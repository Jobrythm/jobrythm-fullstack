import { Router, Response, Request } from 'express';
import Stripe from 'stripe';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getStripeConfig, getAppUrl } from '../utils/appSettings.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { Invoice } from '../entities/Invoice.js';
import { SubscriptionPlan, InvoiceStatus } from '../types/enums.js';

const router = Router();

type PlanTier = 'starter' | 'professional' | 'business';
type BillingPeriod = 'monthly' | 'annual';

function planFromPriceId(
  priceId: string,
  config: Awaited<ReturnType<typeof getStripeConfig>>,
): SubscriptionPlan {
  if (priceId === config.businessMonthlyPriceId || priceId === config.businessAnnualPriceId) {
    return SubscriptionPlan.BUSINESS;
  }
  if (priceId === config.professionalMonthlyPriceId || priceId === config.professionalAnnualPriceId) {
    return SubscriptionPlan.PROFESSIONAL;
  }
  if (priceId === config.starterMonthlyPriceId || priceId === config.starterAnnualPriceId) {
    return SubscriptionPlan.STARTER;
  }
  return SubscriptionPlan.PROFESSIONAL;
}

function resolvePriceId(
  planTier: PlanTier,
  billingPeriod: BillingPeriod,
  config: Awaited<ReturnType<typeof getStripeConfig>>,
): string | null {
  if (planTier === 'starter') {
    return billingPeriod === 'annual' ? config.starterAnnualPriceId : config.starterMonthlyPriceId;
  }
  if (planTier === 'professional') {
    return billingPeriod === 'annual' ? config.professionalAnnualPriceId : config.professionalMonthlyPriceId;
  }
  return billingPeriod === 'annual' ? config.businessAnnualPriceId : config.businessMonthlyPriceId;
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

        // Prefer metadata.userId (set at checkout creation) for reliable user lookup.
        // Fall back to email for sessions created before metadata was added.
        const metaUserId = session.metadata?.userId;
        const email = session.customer_email ?? session.customer_details?.email;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        let user: User | null = null;
        if (metaUserId) {
          user = await userRepo.findOne({ where: { id: metaUserId } });
        }
        if (!user && email) {
          user = await userRepo.findOne({ where: { email } });
        }
        if (!user) break;

        let newPlan = SubscriptionPlan.PROFESSIONAL;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
          const priceId = (sub.items.data[0]?.price as Stripe.Price)?.id;
          if (priceId) newPlan = planFromPriceId(priceId, config);
          user.subscriptionEndsAt = new Date(sub.current_period_end * 1000);
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

        const expandedSub = await stripe.subscriptions.retrieve(sub.id, { expand: ['items.data.price'] });
        const priceId = (expandedSub.items.data[0]?.price as Stripe.Price)?.id;
        if (priceId) {
          user.plan = planFromPriceId(priceId, config);
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

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoiceId;
        if (!invoiceId) break;

        const invoiceRepo = AppDataSource.getRepository(Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: invoiceId } });
        if (!invoice || invoice.status === InvoiceStatus.PAID) break;

        invoice.status = InvoiceStatus.PAID;
        invoice.paidAt = new Date();
        await invoiceRepo.save(invoice);
        console.log(`Invoice ${invoice.invoiceNumber} marked as paid via Stripe`);
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
// Body: { planTier: 'starter' | 'professional' | 'business', billingPeriod: 'monthly' | 'annual' }
router.post('/checkout', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getStripeConfig();
    const stripe = config.apiKey ? new Stripe(config.apiKey) : null;

    if (!stripe) {
      res.status(503).json({ message: 'Billing is not configured. Contact your administrator.' });
      return;
    }

    const planTier: PlanTier = req.body?.planTier ?? 'professional';
    const billingPeriod: BillingPeriod = req.body?.billingPeriod === 'annual' ? 'annual' : 'monthly';
    const priceId = resolvePriceId(planTier, billingPeriod, config);

    if (!priceId) {
      res.status(503).json({ message: 'That billing plan is not configured yet. Contact your administrator.' });
      return;
    }

    const base = await getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 14 },
      success_url: `${base}/settings?tab=billing&status=success`,
      cancel_url: `${base}/settings?tab=billing`,
      customer_email: req.user?.email,
      metadata: { userId: req.user?.userId ?? '', planTier, billingPeriod },
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

    const base = await getAppUrl();
    const portalParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: customerId,
      return_url: `${base}/settings?tab=billing`,
    };
    if (config.portalConfigurationId) {
      portalParams.configuration = config.portalConfigurationId;
    }
    const session = await stripe.billingPortal.sessions.create(portalParams);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// GET /api/billing/status
router.get('/status', async (_req: AuthRequest, res: Response): Promise<void> => {
  const config = await getStripeConfig();
  res.json({
    configured: Boolean(config.apiKey),
    starterMonthly: Boolean(config.starterMonthlyPriceId),
    starterAnnual: Boolean(config.starterAnnualPriceId),
    professionalMonthly: Boolean(config.professionalMonthlyPriceId),
    professionalAnnual: Boolean(config.professionalAnnualPriceId),
    businessMonthly: Boolean(config.businessMonthlyPriceId),
    businessAnnual: Boolean(config.businessAnnualPriceId),
  });
});

export default router;
