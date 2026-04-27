import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Lead } from '../entities/Lead.js';
import { EmailTemplate } from '../entities/EmailTemplate.js';
import { EmailCampaign } from '../entities/EmailCampaign.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import { LeadStatus, LeadSource, CampaignStatus } from '../types/enums.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

// ── Leads ──────────────────────────────────────────────────────────────────────

router.get('/leads', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leads = await AppDataSource.getRepository(Lead).find({ order: { createdAt: 'DESC' } });
    res.json(leads);
  } catch (error) {
    console.error('List leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/leads', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, company, phone, source, status, notes, assignedToUserId } = req.body as Partial<Lead>;

    if (!name || !email) {
      res.status(400).json({ error: 'name and email are required' });
      return;
    }

    const lead = AppDataSource.getRepository(Lead).create({
      name,
      email,
      company,
      phone,
      source: (source as LeadSource) ?? LeadSource.OTHER,
      status: (status as LeadStatus) ?? LeadStatus.LEAD,
      notes,
      assignedToUserId,
    });

    await AppDataSource.getRepository(Lead).save(lead);
    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/leads/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Lead);
    const lead = await repo.findOne({ where: { id: String(req.params.id) } });

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const { name, email, company, phone, source, status, notes, assignedToUserId } = req.body as Partial<Lead>;
    if (name !== undefined) lead.name = name;
    if (email !== undefined) lead.email = email;
    if (company !== undefined) lead.company = company;
    if (phone !== undefined) lead.phone = phone;
    if (source !== undefined) lead.source = source as LeadSource;
    if (status !== undefined) lead.status = status as LeadStatus;
    if (notes !== undefined) lead.notes = notes;
    if (assignedToUserId !== undefined) lead.assignedToUserId = assignedToUserId;

    await repo.save(lead);
    res.json(lead);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/leads/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Lead);
    const lead = await repo.findOne({ where: { id: String(req.params.id) } });

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    await repo.remove(lead);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Email templates ────────────────────────────────────────────────────────────

router.get('/email-templates', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = await AppDataSource.getRepository(EmailTemplate).find({ order: { createdAt: 'DESC' } });
    res.json(templates);
  } catch (error) {
    console.error('List email templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/email-templates', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, subject, bodyHtml, bodyText } = req.body as Partial<EmailTemplate>;

    if (!name || !subject || !bodyHtml) {
      res.status(400).json({ error: 'name, subject, and bodyHtml are required' });
      return;
    }

    const template = AppDataSource.getRepository(EmailTemplate).create({ name, subject, bodyHtml, bodyText });
    await AppDataSource.getRepository(EmailTemplate).save(template);
    res.status(201).json(template);
  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/email-templates/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(EmailTemplate);
    const template = await repo.findOne({ where: { id: String(req.params.id) } });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const { name, subject, bodyHtml, bodyText } = req.body as Partial<EmailTemplate>;
    if (name !== undefined) template.name = name;
    if (subject !== undefined) template.subject = subject;
    if (bodyHtml !== undefined) template.bodyHtml = bodyHtml;
    if (bodyText !== undefined) template.bodyText = bodyText;

    await repo.save(template);
    res.json(template);
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/email-templates/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(EmailTemplate);
    const template = await repo.findOne({ where: { id: String(req.params.id) } });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    await repo.remove(template);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Email campaigns ────────────────────────────────────────────────────────────

router.get('/campaigns', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaigns = await AppDataSource.getRepository(EmailCampaign).find({ order: { createdAt: 'DESC' } });
    res.json(campaigns.map(serialiseCampaign));
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, templateId, subject, recipients } = req.body as {
      name?: string;
      templateId?: string;
      subject?: string;
      recipients?: string[];
    };

    if (!name || !subject || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ error: 'name, subject, and a non-empty recipients array are required' });
      return;
    }

    const campaign = AppDataSource.getRepository(EmailCampaign).create({
      name,
      templateId,
      subject,
      recipientsJson: JSON.stringify(recipients),
      status: CampaignStatus.DRAFT,
      recipientCount: recipients.length,
    });

    await AppDataSource.getRepository(EmailCampaign).save(campaign);
    res.status(201).json(serialiseCampaign(campaign));
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns/:id/send', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(EmailCampaign);
    const campaign = await repo.findOne({ where: { id: String(req.params.id) } });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.status === CampaignStatus.SENT) {
      res.status(400).json({ error: 'Campaign has already been sent' });
      return;
    }

    // Resolve body from linked template if any
    let bodyHtml = (req.body as { bodyHtml?: string }).bodyHtml ?? '';
    let bodyText = (req.body as { bodyText?: string }).bodyText;

    if (!bodyHtml && campaign.templateId) {
      const template = await AppDataSource.getRepository(EmailTemplate).findOne({
        where: { id: campaign.templateId },
      });
      if (template) {
        bodyHtml = template.bodyHtml;
        bodyText = template.bodyText;
      }
    }

    if (!bodyHtml) {
      res.status(400).json({ error: 'No email body provided. Supply bodyHtml in request or link a template.' });
      return;
    }

    const recipients: string[] = JSON.parse(campaign.recipientsJson);

    // Send to all recipients — fire-and-forget individual failures so one bad address doesn't block the rest
    const results = await Promise.allSettled(
      recipients.map((to) =>
        sendEmail({ to, subject: campaign.subject, html: bodyHtml, text: bodyText }),
      ),
    );

    const failures = results.filter((r) => r.status === 'rejected').length;

    campaign.status = CampaignStatus.SENT;
    campaign.sentAt = new Date();
    await repo.save(campaign);

    res.json({
      ...serialiseCampaign(campaign),
      sent: recipients.length - failures,
      failed: failures,
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function serialiseCampaign(c: EmailCampaign) {
  return {
    id: c.id,
    name: c.name,
    templateId: c.templateId ?? null,
    subject: c.subject,
    recipients: JSON.parse(c.recipientsJson) as string[],
    status: c.status,
    sentAt: c.sentAt ?? null,
    recipientCount: c.recipientCount,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export default router;
