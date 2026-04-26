import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Client } from '../entities/Client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Like } from 'typeorm';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all clients with pagination and search
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const pageSize = parseInt((req.query.pageSize as string) || '30');
    const search = (req.query.search as string) || '';

    const clientRepository = AppDataSource.getRepository(Client);
    const skip = (page - 1) * pageSize;

    const where: any = { userId: req.user!.userId };
    if (search) {
      where.name = Like(`%${search}%`);
    }

    const [clients, total] = await clientRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    res.json({
      items: clients,
      page,
      pageSize,
      total,
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clientRepository = AppDataSource.getRepository(Client);
    const client = await clientRepository.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
      relations: ['jobs'],
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create client
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const clientRepository = AppDataSource.getRepository(Client);
    const client = clientRepository.create({
      userId: req.user!.userId,
      name,
      email,
      phone,
      address,
    });

    await clientRepository.save(client);

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clientRepository = AppDataSource.getRepository(Client);
    const client = await clientRepository.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const { name, email, phone, address } = req.body;

    if (name !== undefined) client.name = name;
    if (email !== undefined) client.email = email;
    if (phone !== undefined) client.phone = phone;
    if (address !== undefined) client.address = address;

    await clientRepository.save(client);

    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete client
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clientRepository = AppDataSource.getRepository(Client);
    const client = await clientRepository.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    await clientRepository.remove(client);

    res.status(204).send();
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
