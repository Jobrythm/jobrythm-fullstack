import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AppDataSource } from '../config/database.js';
import { Attachment } from '../entities/Attachment.js';
import { Job } from '../entities/Job.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

const router = Router();

router.use(authenticateToken);

// GET /api/attachments?jobId=:jobId
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = req.query.jobId as string;
    if (!jobId) {
      res.status(400).json({ error: 'jobId query parameter is required' });
      return;
    }

    const attachmentRepository = AppDataSource.getRepository(Attachment);
    const attachments = await attachmentRepository.find({
      where: { jobId, userId: req.user!.userId },
      order: { createdAt: 'DESC' },
    });

    res.json(attachments);
  } catch (error) {
    console.error('List attachments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/attachments
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File is required' });
      return;
    }

    const { jobId, description } = req.body;
    if (!jobId) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ error: 'jobId is required' });
      return;
    }

    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: String(jobId), userId: req.user!.userId },
    });

    if (!job) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const attachmentRepository = AppDataSource.getRepository(Attachment);
    const attachment = attachmentRepository.create({
      jobId: job.id,
      userId: req.user!.userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      description: description || undefined,
    });

    await attachmentRepository.save(attachment);

    res.status(201).json(attachment);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/attachments/:id/download
router.get('/:id/download', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attachmentRepository = AppDataSource.getRepository(Attachment);
    const attachment = await attachmentRepository.findOne({
      where: { id: String(req.params.id), userId: req.user!.userId },
    });

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    const filePath = path.join(UPLOADS_DIR, attachment.fileName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/attachments/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attachmentRepository = AppDataSource.getRepository(Attachment);
    const attachment = await attachmentRepository.findOne({
      where: { id: String(req.params.id), userId: req.user!.userId },
    });

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    const filePath = path.join(UPLOADS_DIR, attachment.fileName);
    await attachmentRepository.remove(attachment);

    fs.unlink(filePath, (err) => {
      if (err) console.warn('Could not delete file from disk:', filePath, err.message);
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
