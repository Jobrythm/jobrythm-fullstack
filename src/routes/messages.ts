import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Message } from '../entities/Message.js';
import { Job } from '../entities/Job.js';
import { Client } from '../entities/Client.js';
import { User } from '../entities/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = Router();
router.use(authenticateToken);

// Resolve companyId from request (sub-user aware)
function cid(req: AuthRequest): string {
  return req.user!.companyId ?? req.user!.userId;
}

// GET /api/jobs/:jobId/messages
router.get('/:jobId/messages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = cid(req);
    const jobRepo = AppDataSource.getRepository(Job);
    const job = await jobRepo.findOne({ where: { id: String(req.params.jobId), userId: companyId } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    const msgRepo = AppDataSource.getRepository(Message);
    const messages = await msgRepo.find({
      where: { jobId: String(req.params.jobId) },
      order: { createdAt: 'ASC' },
    });
    res.json(messages);
  } catch (err) {
    console.error('List messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/jobs/:jobId/messages
router.post('/:jobId/messages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = cid(req);
    const jobRepo = AppDataSource.getRepository(Job);
    const job = await jobRepo.findOne({
      where: { id: String(req.params.jobId), userId: companyId },
      relations: ['client'],
    });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    const { body } = req.body as { body?: string };
    if (!body?.trim()) {
      res.status(400).json({ error: 'Message body is required' });
      return;
    }

    // Determine sender name
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.user!.userId } });
    const senderName = user?.fullName ?? user?.email ?? 'Your contractor';

    const msgRepo = AppDataSource.getRepository(Message);
    const msg = msgRepo.create({
      jobId: job.id,
      senderType: 'contractor',
      senderName,
      body: body.trim(),
    });
    await msgRepo.save(msg);

    // Email notification to client if they have an email
    const clientEmail = (job as Job & { client?: Client }).client?.email;
    if (clientEmail) {
      try {
        const clientName = (job as Job & { client?: Client }).client?.name ?? 'there';
        const ownerUser = await userRepo.findOne({ where: { id: companyId } });
        await sendEmail({
          to: clientEmail,
          subject: `New message about job: ${job.title}`,
          html: `
            <p>Hi ${clientName},</p>
            <p>You have a new message about your job <strong>${job.title}</strong>:</p>
            <blockquote style="border-left:3px solid #e2e8f0;padding:8px 16px;margin:16px 0;color:#374151">
              ${body.trim().replace(/\n/g, '<br>')}
            </blockquote>
            <p>Kind regards,<br>${ownerUser?.companyName ?? senderName}</p>
          `,
          text: `Hi ${clientName},\n\nNew message about job "${job.title}":\n\n${body.trim()}\n\nKind regards,\n${ownerUser?.companyName ?? senderName}`,
        });
        msg.emailSent = true;
        await msgRepo.save(msg);
      } catch {
        // Email failure is non-fatal — message still saved
      }
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/jobs/:jobId/messages/:id
router.delete('/:jobId/messages/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = cid(req);
    const jobRepo = AppDataSource.getRepository(Job);
    const job = await jobRepo.findOne({ where: { id: String(req.params.jobId), userId: companyId } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    const msgRepo = AppDataSource.getRepository(Message);
    const msg = await msgRepo.findOne({ where: { id: String(req.params.id), jobId: String(req.params.jobId) } });
    if (!msg) { res.status(404).json({ error: 'Message not found' }); return; }

    await msgRepo.remove(msg);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
