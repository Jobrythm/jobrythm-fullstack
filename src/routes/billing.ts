import { Router, Response, Request } from 'express';
import Stripe from 'stripe';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getStripeConfig } from '../utils/appSettings.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { SubscriptionPlan } from '../types/enums.js';

const router = Router();

const resolveReturnBase = (): string =>
  (process.env.APP_URL ?? 'http://localhost:8080').replace(/\/$/, '');

function planFromPriceId(
  priceId: string,
  proPriceId: string | null,
  teamPriceId: string | null,
): SubscriptionPlan {
  if (teamPriceId && priceId === teamPriceId) return SubscriptionPlan.TEAM;
  if (proPriceId && priceId === proPriceId) return SubscriptionPlan.PRO;
  return SubscriptionPlan.PRO;
}

// ── Webhook (raw body — registered separately in server.ts) ───────────────────
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const config = await getStripeConfig();
  const stripe = config.apiKey ? new Stripe(config.apiKey) : null;

  if (!stripe || !config.webhookSecret) {
    res.status(503).json({ message: 'Billing is not configured.' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, config.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const email = session.customer_email ?? session.customer_details?.email;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (!email) break;
        const user = await userRepo.findOne({ where: { email } });
        if (!user) break;

        // Determine plan from the subscription's price
        let newPlan = SubscriptionPlan.PRO;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
          const priceId = (sub.items.data[0]?.price as Stripe.Price)?.id;
          if (priceId) newPlan = planFromPriceId(priceId, config.proPriceId, config.teamPriceId);

          const currentPeriodEnd = sub.current_period_end;
          user.subscriptionEndsAt = new Date(currentPeriodEnd * 1000);
          user.stripeSubscriptionId = subscriptionId;
        }

        if (customerId) user.stripeCustomerId = customerId;
        user.plan = newPlan;
        await userRepo.save(user);
        console.log(`User ${email} upgraded to ${newPlan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const user = await userRepo.findOne({ where: { stripeCustomerId: customerId } });
        if (!user) break;

        // Retrieve subscription with expanded price to get the price ID
        const expandedSub = await stripe.subscriptions.retrieve(sub.id, { expand: ['items.data.price'] });
        const priceId = (expandedSub.items.data[0]?.price as Stripe.Price)?.id;
        if (priceId) {
          user.plan = planFromPriceId(priceId, config.proPriceId, config.teamPriceId);
        }
        user.subscriptionEndsAt = new Date(expandedSub.current_period_end * 1000);
        await userRepo.save(user);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const user = await userRepo.findOne({ where: { stripeCustomerId: customerId } });
        if (!user) break;

        user.plan = SubscriptionPlan.STARTER;
        user.stripeSubscriptionId = undefined;
        user.subscriptionEndsAt = undefined;
        await userRepo.save(user);
        console.log(`Subscription cancelled for customer ${customerId}`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
}

// ── Authenticated billing routes ───────────────────────────────────────────────
router.use(authenticateToken);

// POST /api/billing/checkout
// Body: { planTier: 'pro' | 'team' }
router.post('/checkout', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getStripeConfig();
    const stripe = config.apiKey ? new Stripe(config.apiKey) : null;

    if (!stripe) {
      res.status(503).json({ message: 'Billing is not configured. Contact your administrator.' });
      return;
    }

    const planTier: string = req.body?.planTier ?? 'pro';
    const priceId = planTier === 'team' ? config.teamPriceId : config.proPriceId;

    if (!priceId) {
      res.status(503).json({ message: 'Billing plan not configured. Contact your administrator.' });
      return;
    }

    const base = resolveReturnBase();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/settings?tab=billing&status=success`,
      cancel_url: `${base}/settings?tab=billing`,
      customer_email: req.user?.email,
      metadata: { userId: req.user?.userId ?? '' },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/portal
router.post('/portal', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getStripeConfig();
    const stripe = config.apiKey ? new Stripe(config.apiKey) : null;

    if (!stripe) {
      res.status(503).json({ message: 'Billing is not configured. Contact your administrator.' });
      return;
    }

    if (!req.user?.email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Find the Stripe customer by stripeCustomerId or email
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.user.userId } });

    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: req.user.email, limit: 1 });
      customerId = customers.data[0]?.id;
    }

    if (!customerId) {
      res.status(404).json({ message: 'No billing account found. Please subscribe first.' });
      return;
    }

    const base = resolveReturnBase();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/settings?tab=billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// GET /api/billing/status — returns whether billing is configured
router.get('/status', async (_req: AuthRequest, res: Response): Promise<void> => {
  const config = await getStripeConfig();
  res.json({
    configured: Boolean(config.apiKey),
    hasProPlan: Boolean(config.proPriceId),
    hasTeamPlan: Boolean(config.teamPriceId),
  });
});

export default router;

