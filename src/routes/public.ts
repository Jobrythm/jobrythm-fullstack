import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { AppDataSource } from '../config/database.js';
import { Quote } from '../entities/Quote.js';
import { Invoice } from '../entities/Invoice.js';
import { User } from '../entities/User.js';
import { QuoteStatus, InvoiceStatus } from '../types/enums.js';
import { getStripeConfig } from '../utils/appSettings.js';

const router = Router();

// ── Public config (unauthenticated) ───────────────────────────────────────────

// Returns non-secret runtime config that public pages need (e.g. Stripe publishable key)
router.get('/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await getStripeConfig();
    res.json({ stripePublishableKey: config.publishableKey ?? null });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Quotes ────────────────────────────────────────────────────────────────────

// Get public quote by token
router.get('/quotes/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .leftJoinAndSelect('job.user', 'user')
      .where('quote.publicToken = :token', { token: req.params.token })
      .getOne();

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    // Return only safe public fields (never expose userId, passwordHash, etc.)
    res.json({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      validUntil: quote.validUntil,
      notes: quote.notes,
      terms: quote.terms,
      totalNet: quote.totalNet,
      vatRate: quote.vatRate,
      vatAmount: quote.vatAmount,
      totalGross: quote.totalGross,
      createdAt: quote.createdAt,
      job: {
        title: quote.job?.title,
        client: quote.job?.client ? { name: quote.job.client.name } : null,
        lineItems: quote.job?.lineItems ?? [],
      },
      contractor: {
        companyName: quote.job?.user?.companyName || quote.job?.user?.fullName,
        companyAddress: quote.job?.user?.companyAddress,
        logoUrl: quote.job?.user?.logoUrl,
      },
    });
  } catch (error) {
    console.error('Public get quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve quote
router.post('/quotes/:token/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const quoteRepository = AppDataSource.getRepository(Quote);
    const token = req.params.token as string;
    const quote = await quoteRepository.findOne({ where: { publicToken: token } });

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    if (quote.status !== QuoteStatus.SENT && quote.status !== QuoteStatus.DRAFT) {
      res.status(409).json({ error: `Quote cannot be approved in its current status (${quote.status})` });
      return;
    }

    quote.status = QuoteStatus.ACCEPTED;
    quote.acceptedAt = new Date();
    await quoteRepository.save(quote);

    res.json({ message: 'Quote accepted', status: quote.status });
  } catch (error) {
    console.error('Public approve quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject quote
router.post('/quotes/:token/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const quoteRepository = AppDataSource.getRepository(Quote);
    const token = req.params.token as string;
    const quote = await quoteRepository.findOne({ where: { publicToken: token } });

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    if (quote.status !== QuoteStatus.SENT && quote.status !== QuoteStatus.DRAFT) {
      res.status(409).json({ error: `Quote cannot be rejected in its current status (${quote.status})` });
      return;
    }

    quote.status = QuoteStatus.REJECTED;
    await quoteRepository.save(quote);

    res.json({ message: 'Quote declined', status: quote.status });
  } catch (error) {
    console.error('Public reject quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Invoices ──────────────────────────────────────────────────────────────────

// Get public invoice by token
router.get('/invoices/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .leftJoinAndSelect('job.user', 'user')
      .where('invoice.publicToken = :token', { token: req.params.token })
      .getOne();

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      terms: invoice.terms,
      totalNet: invoice.totalNet,
      vatRate: invoice.vatRate,
      vatAmount: invoice.vatAmount,
      totalGross: invoice.totalGross,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      job: {
        title: invoice.job?.title,
        client: invoice.job?.client ? { name: invoice.job.client.name } : null,
        lineItems: invoice.job?.lineItems ?? [],
      },
      contractor: {
        companyName: invoice.job?.user?.companyName || invoice.job?.user?.fullName,
        companyAddress: invoice.job?.user?.companyAddress,
        logoUrl: invoice.job?.user?.logoUrl,
      },
    });
  } catch (error) {
    console.error('Public get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Stripe PaymentIntent for invoice
router.post('/invoices/:token/pay', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.user', 'user')
      .where('invoice.publicToken = :token', { token: req.params.token })
      .getOne();

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (invoice.status === InvoiceStatus.PAID) {
      res.status(409).json({ error: 'Invoice is already paid' });
      return;
    }

    const stripeConfig = await getStripeConfig();
    if (!stripeConfig.apiKey) {
      res.status(503).json({ error: 'Payment processing is not configured' });
      return;
    }

    const stripe = new Stripe(stripeConfig.apiKey, { apiVersion: '2025-02-24.acacia' });

    // Reuse existing PaymentIntent if one was already created
    if (invoice.stripePaymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(invoice.stripePaymentIntentId);
        if (existing.status !== 'canceled') {
          res.json({ clientSecret: existing.client_secret });
          return;
        }
      } catch {
        // Fall through to create a new one
      }
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: invoice.job.userId } });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(invoice.totalGross),
      currency: 'gbp',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        contractorUserId: invoice.job.userId,
      },
      description: `Invoice ${invoice.invoiceNumber}${user?.companyName ? ` — ${user.companyName}` : ''}`,
      automatic_payment_methods: { enabled: true },
    });

    invoice.stripePaymentIntentId = paymentIntent.id;
    await invoiceRepository.save(invoice);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Public invoice pay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
