import { Router, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

const getStripe = (): Stripe | null => {
  const key = process.env.STRIPE_API_KEY;
  if (!key) return null;
  return new Stripe(key);
};

const resolveReturnBase = (): string => {
  return (process.env.APP_URL ?? 'http://localhost:8080').replace(/\/$/, '');
};

// Create Stripe Checkout session (upgrade / subscribe)
router.post('/checkout', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ message: 'Billing is not configured on this instance.' });
      return;
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      res.status(503).json({ message: 'Billing plans are not configured.' });
      return;
    }

    const base = resolveReturnBase();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/settings?billing=success`,
      cancel_url: `${base}/settings`,
      customer_email: req.user?.email,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create Stripe Billing Portal session (manage / cancel subscription)
router.post('/portal', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ message: 'Billing is not configured on this instance.' });
      return;
    }

    if (!req.user?.email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Find the Stripe customer by email
    const customers = await stripe.customers.list({ email: req.user.email, limit: 1 });
    if (customers.data.length === 0) {
      res.status(404).json({ message: 'No billing account found. Please subscribe first.' });
      return;
    }

    const base = resolveReturnBase();
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${base}/settings`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

export default router;
