import { Router, Response } from 'express';
import OpenAI from 'openai';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getGitHubModelsConfig } from '../utils/appSettings.js';
import { AppDataSource } from '../config/database.js';
import { Job } from '../entities/Job.js';

const router = Router();
router.use(authenticateToken);

// POST /api/jobs/:id/ai-suggest-line-items
// Uses GitHub Models (GPT-4o) to suggest line items based on job title/description
// and the contractor's recent job history.
router.post('/jobs/:id/ai-suggest-line-items', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aiConfig = await getGitHubModelsConfig();
    if (!aiConfig.token) {
      res.status(503).json({ error: 'AI features are not configured. Ask your admin to add a GitHub Models token in the admin settings.' });
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

    const client = new OpenAI({
      baseURL: 'https://models.inference.ai.azure.com',
      apiKey: aiConfig.token,
    });

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

    const completion = await client.chat.completions.create({
      model: aiConfig.model ?? 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
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

    res.json({ suggestions, model: aiConfig.model ?? 'gpt-4o' });
  } catch (error) {
    console.error('AI suggest error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `AI suggestion failed: ${msg}` });
  }
});

export default router;
