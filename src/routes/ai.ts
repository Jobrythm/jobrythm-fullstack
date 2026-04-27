import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getGeminiConfig } from '../utils/appSettings.js';
import { AppDataSource } from '../config/database.js';
import { Job } from '../entities/Job.js';

const router = Router();
router.use(authenticateToken);

// Helper: build a Gemini client from stored config, or return null
async function buildAiClient(): Promise<{ ai: GoogleGenAI; model: string } | null> {
  const config = await getGeminiConfig();
  if (!config.apiKey) return null;
  return {
    ai: new GoogleGenAI({ apiKey: config.apiKey }),
    model: config.model ?? 'gemini-2.0-flash',
  };
}

// Extract JSON from a model response that may be wrapped in markdown code fences
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) return raw.slice(firstBrace, lastBrace + 1);
  return raw.trim();
}

// POST /api/jobs/:id/ai-suggest-line-items
// Uses Gemini to suggest line items based on job title/description
// and the contractor's recent job history.
router.post('/jobs/:id/ai-suggest-line-items', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aiClient = await buildAiClient();
    if (!aiClient) {
      res.status(503).json({ error: 'AI features are not configured. Ask your admin to add a Gemini API key in the admin settings.' });
      return;
    }

    const jobRepository = AppDataSource.getRepository(Job);

    // Load the target job
    const job = await jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .leftJoinAndSelect('job.client', 'client')
      .where('job.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Load up to 20 recent completed jobs for context
    const recentJobs = await jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .where('job.userId = :userId', { userId: req.user!.userId })
      .andWhere('job.status IN (:...statuses)', { statuses: ['completed', 'invoiced'] })
      .andWhere('job.id != :currentId', { currentId: job.id })
      .orderBy('job.createdAt', 'DESC')
      .take(20)
      .getMany();

    // Build context string from recent jobs
    const historySummary = recentJobs
      .filter((j) => j.lineItems && j.lineItems.length > 0)
      .slice(0, 10)
      .map((j) => {
        const items = j.lineItems
          .map((li) => `  - ${li.description} (qty: ${li.quantity}, unit: £${(Number(li.unitPrice) / 100).toFixed(2)}, category: ${li.category})`)
          .join('\n');
        return `Job: "${j.title}"\nLine items:\n${items}`;
      })
      .join('\n\n');

    const systemPrompt = `You are a helpful assistant for trade contractors (plumbers, HVAC, electricians, handymen). 
Your task is to suggest appropriate line items for a job quote based on the job description and the contractor's past job history.

Return ONLY a valid JSON object with a single key "lineItems" containing an array of line item objects.
Each line item must have these exact fields:
- description: string (clear, professional description)
- quantity: number (positive integer or decimal)
- unitPriceCents: number (price in pence/cents, integer)
- category: string (one of: "labour", "materials", "equipment", "subcontractor", "other")

Example response:
{"lineItems": [{"description": "Supply and fit new 28mm stopcock","quantity": 1,"unitPriceCents": 8500,"category": "materials"},{"description": "Labour - 2 hours at £45/hr","quantity": 2,"unitPriceCents": 4500,"category": "labour"}]}

Respond with ONLY the JSON object, no markdown, no explanation.`;

    const userPrompt = `Job title: ${job.title}
Job description: ${job.description || 'No description provided'}
${job.client ? `Client type: ${job.client.name}` : ''}

${historySummary ? `Here are some of my recent completed jobs with their line items for reference:\n\n${historySummary}` : 'No past job history available.'}

Please suggest 3–8 appropriate line items for this job.`;

    const response = await aiClient.ai.models.generateContent({
      model: aiClient.model,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const raw = extractJson(response.text ?? '{}');
    let parsed: { lineItems?: unknown[] };
    try {
      parsed = JSON.parse(raw) as { lineItems?: unknown[] };
    } catch {
      res.status(500).json({ error: 'AI returned an invalid response. Please try again.' });
      return;
    }

    if (!Array.isArray(parsed.lineItems)) {
      res.status(500).json({ error: 'AI returned an unexpected format. Please try again.' });
      return;
    }

    // Validate and sanitize each item
    const suggestions = parsed.lineItems
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        description: String(item.description ?? '').trim(),
        quantity: Math.max(0.01, Number(item.quantity) || 1),
        unitPriceCents: Math.max(0, Math.round(Number(item.unitPriceCents) || 0)),
        category: ['labour', 'materials', 'equipment', 'subcontractor', 'other'].includes(String(item.category))
          ? String(item.category)
          : 'other',
      }))
      .filter((item) => item.description.length > 0);

    res.json({ suggestions, model: aiClient.model });
  } catch (error) {
    console.error('AI suggest error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `AI suggestion failed: ${msg}` });
  }
});

// POST /api/ai/suggest-client
// Parses a plain-English description into structured client fields.
router.post('/ai/suggest-client', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aiClient = await buildAiClient();
    if (!aiClient) {
      res.status(503).json({ error: 'AI features are not configured. Add a Gemini API key in Admin → AI Settings.' });
      return;
    }

    const { description } = req.body as { description?: string };
    if (!description?.trim()) {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const systemPrompt = `You are a data extraction assistant for a trade contractor CRM.
Extract structured client/contact information from a plain-English description.
Return ONLY a valid JSON object with these exact fields (all optional except name):
- name: string (person or company name)
- email: string (email address if mentioned)
- phone: string (phone number if mentioned, include country code if provided)
- address: string (full address if mentioned)
- notes: string (any other relevant info e.g. "commercial client", "referred by X")

Example: {"name":"Smith Plumbing Ltd","email":"info@smithplumbing.com","phone":"07700 900123","address":"12 High Street, London, SW1A 1AA","notes":"Commercial client, prefers morning calls"}

Respond with ONLY the JSON object. Do not wrap in markdown.`;

    const response = await aiClient.ai.models.generateContent({
      model: aiClient.model,
      contents: description.trim(),
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    });

    const raw = extractJson(response.text ?? '{}');
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      res.status(500).json({ error: 'AI returned an invalid response. Please try again.' });
      return;
    }

    res.json({
      name: String(parsed.name ?? '').trim(),
      email: String(parsed.email ?? '').trim(),
      phone: String(parsed.phone ?? '').trim(),
      address: String(parsed.address ?? '').trim(),
      notes: String(parsed.notes ?? '').trim(),
    });
  } catch (error) {
    console.error('AI suggest-client error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `AI suggestion failed: ${msg}` });
  }
});

// POST /api/ai/suggest-job
// Parses a plain-English description into structured job fields.
router.post('/ai/suggest-job', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aiClient = await buildAiClient();
    if (!aiClient) {
      res.status(503).json({ error: 'AI features are not configured. Add a Gemini API key in Admin → AI Settings.' });
      return;
    }

    const { description } = req.body as { description?: string };
    if (!description?.trim()) {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `You are a data extraction assistant for a trade contractor job management system.
Extract structured job information from a plain-English description.
Today's date is ${today}.
Return ONLY a valid JSON object with these exact fields (all optional except title):
- title: string (short job title, max ~60 chars)
- description: string (detailed job description, 1-3 sentences)
- startDate: string (ISO date YYYY-MM-DD if a start date is mentioned or implied, otherwise omit)
- endDate: string (ISO date YYYY-MM-DD if an end/completion date is mentioned or implied, otherwise omit)

Example: {"title":"Boiler replacement - 12 Oak Avenue","description":"Remove old gas boiler and install new Worcestershire Bosch combi boiler. Include full system flush and pressure test.","startDate":"2024-03-01","endDate":"2024-03-02"}

Respond with ONLY the JSON object. Do not wrap in markdown.`;

    const response = await aiClient.ai.models.generateContent({
      model: aiClient.model,
      contents: description.trim(),
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    });

    const raw = extractJson(response.text ?? '{}');
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      res.status(500).json({ error: 'AI returned an invalid response. Please try again.' });
      return;
    }

    // Validate date format
    const isIsoDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

    res.json({
      title: String(parsed.title ?? '').trim(),
      description: String(parsed.description ?? '').trim(),
      startDate: isIsoDate(parsed.startDate) ? (parsed.startDate as string) : '',
      endDate: isIsoDate(parsed.endDate) ? (parsed.endDate as string) : '',
    });
  } catch (error) {
    console.error('AI suggest-job error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `AI suggestion failed: ${msg}` });
  }
});

export default router;
