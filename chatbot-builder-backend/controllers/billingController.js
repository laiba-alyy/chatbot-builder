const Subscription = require('../models/subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/payment');
const User = require('../models/user');
const Bot = require('../models/bot');
const Conversation = require('../models/conversation');
const Integration = require('../models/integration');
const Team = require('../models/team');
const catchAsync = require('../utils/catchAsync'); // ✅ FIX 1: Fixed import - no destructuring
const AppError = require('../utils/apiError');

// ✅ FIX 2: Lazy initialize Stripe - won't crash if STRIPE_SECRET_KEY is missing
let stripeInstance;
const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new AppError('Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file', 500);
    }
    stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

/**
 * @desc    Get current subscription for authenticated user
 * @route   GET /api/billing/subscription
 * @access  Private
 */
exports.getSubscription = catchAsync(async (req, res, next) => {
  let subscription = await Subscription.findOne({ user: req.user.id })
    .populate('user', 'fullName email');

  // If no subscription exists, create a free plan subscription
  if (!subscription) {
    subscription = await Subscription.create({
      user: req.user.id,
      plan: 'free',
      status: 'active',
      billingCycle: 'monthly',
      amount: 0,
      currency: 'USD',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      limits: {
        bots: 1,
        conversations: 500,
        teamMembers: 1,
        integrations: 0,
        storage: 1,
        apiCalls: 1000
      },
      usage: {
        bots: 0,
        conversations: 0,
        teamMembers: 0,
        integrations: 0,
        storage: 0,
        apiCalls: 0
      },
      features: {
        customBranding: false,
        advancedAnalytics: false,
        prioritySupport: false,
        apiAccess: false,
        webhooks: false,
        customModels: false
      }
    });
  }

  // Update usage stats
  await updateUsageStats(subscription);

  res.status(200).json({
    success: true,
    data: subscription
  });
});

/**
 * @desc    Get available plans
 * @route   GET /api/billing/plans
 * @access  Private
 */
exports.getPlans = catchAsync(async (req, res, next) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      currency: 'USD',
      features: {
        bots: 1,
        conversations: 500,
        teamMembers: 1,
        integrations: 0,
        storage: 1,
        apiCalls: 1000,
        customBranding: false,
        advancedAnalytics: false,
        prioritySupport: false,
        apiAccess: false,
        webhooks: false,
        customModels: false
      },
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      yearlyPrice: 190,
      currency: 'USD',
      features: {
        bots: 3,
        conversations: 2500,
        teamMembers: 2,
        integrations: 5,
        storage: 5,
        apiCalls: 10000,
        customBranding: false,
        advancedAnalytics: true,
        prioritySupport: false,
        apiAccess: false,
        webhooks: true,
        customModels: false
      },
      popular: false
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 49,
      yearlyPrice: 490,
      currency: 'USD',
      features: {
        bots: 10,
        conversations: 10000,
        teamMembers: 5,
        integrations: 20,
        storage: 10,
        apiCalls: 100000,
        customBranding: true,
        advancedAnalytics: true,
        prioritySupport: true,
        apiAccess: true,
        webhooks: true,
        customModels: false
      },
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      yearlyPrice: 990,
      currency: 'USD',
      features: {
        bots: -1,
        conversations: -1,
        teamMembers: -1,
        integrations: -1,
        storage: 100,
        apiCalls: 1000000,
        customBranding: true,
        advancedAnalytics: true,
        prioritySupport: true,
        apiAccess: true,
        webhooks: true,
        customModels: true
      },
      popular: false
    }
  ];

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans
  });
});

/**
 * @desc    Create checkout session for subscription
 * @route   POST /api/billing/checkout
 * @access  Private
 */
exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const { planId, billingCycle = 'monthly' } = req.body;

  if (!planId) {
    return next(new AppError('Please provide a planId', 400));
  }

  const plans = {
    free: { price: 0, stripePriceId: null },
    starter: {
      price: 19,
      stripePriceId: billingCycle === 'monthly' ? 'price_starter_monthly' : 'price_starter_yearly'
    },
    pro: {
      price: 49,
      stripePriceId: billingCycle === 'monthly' ? 'price_pro_monthly' : 'price_pro_yearly'
    },
    enterprise: {
      price: 99,
      stripePriceId: billingCycle === 'monthly' ? 'price_enterprise_monthly' : 'price_enterprise_yearly'
    }
  };

  if (!plans[planId]) {
    return next(new AppError('Invalid plan selected', 400));
  }

  if (planId === 'free') {
    return next(new AppError('Cannot checkout for free plan', 400));
  }

  const stripe = getStripe();

  let subscription = await Subscription.findOne({ user: req.user.id });
  let stripeCustomerId = subscription?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.fullName,
      metadata: { userId: req.user.id.toString() }
    });
    stripeCustomerId = customer.id;

    if (subscription) {
      subscription.stripeCustomerId = stripeCustomerId;
      await subscription.save();
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [{ price: plans[planId].stripePriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
    metadata: {
      userId: req.user.id.toString(),
      planId,
      billingCycle
    }
  });

  res.status(200).json({
    success: true,
    data: {
      sessionId: session.id,
      sessionUrl: session.url
    }
  });
});

/**
 * @desc    Handle Stripe webhook events
 * @route   POST /api/billing/webhook
 * @access  Public (verified via signature)
 */
exports.handleWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Webhook Error: ${error.message}`
    });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ success: true });
});

/**
 * @desc    Get invoices for authenticated user
 * @route   GET /api/billing/invoices
 * @access  Private
 */
exports.getInvoices = catchAsync(async (req, res, next) => {
  const { limit = 20, page = 1 } = req.query;

  const invoices = await Invoice.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Invoice.countDocuments({ user: req.user.id });

  res.status(200).json({
    success: true,
    count: invoices.length,
    total: count,
    page: Math.ceil(count / limit),
    data: invoices
  });
});

/**
 * @desc    Get single invoice
 * @route   GET /api/billing/invoices/:id
 * @access  Private
 */
exports.getInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
});

/**
 * @desc    Get payment methods for authenticated user
 * @route   GET /api/billing/payment-methods
 * @access  Private
 */
exports.getPaymentMethods = catchAsync(async (req, res, next) => {
  const subscription = await Subscription.findOne({ user: req.user.id });

  if (!subscription || !subscription.stripeCustomerId) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  const paymentMethods = await getStripe().paymentMethods.list({
    customer: subscription.stripeCustomerId,
    type: 'card'
  });

  const formattedMethods = paymentMethods.data.map(pm => ({
    id: pm.id,
    type: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
    isDefault: pm.id === subscription.defaultPaymentMethod
  }));

  res.status(200).json({
    success: true,
    data: formattedMethods
  });
});

/**
 * @desc    Update usage stats for subscription
 * @route   PATCH /api/billing/usage
 * @access  Private
 */
exports.updateUsage = catchAsync(async (req, res, next) => {
  const { resource, value } = req.body;

  if (!resource || value === undefined) {
    return next(new AppError('Please provide resource and value', 400));
  }

  const subscription = await Subscription.findOne({ user: req.user.id });

  if (!subscription) {
    return next(new AppError('No subscription found', 404));
  }

  if (subscription.usage[resource] === undefined) {
    return next(new AppError(`Invalid resource: ${resource}`, 400));
  }

  subscription.usage[resource] = value;
  await subscription.save();

  const limit = subscription.limits[resource];
  if (limit !== -1 && value > limit) {
    console.log(`User ${req.user.id} exceeded ${resource} limit`);
  }

  res.status(200).json({
    success: true,
    data: {
      resource,
      current: value,
      limit,
      percentage: limit === -1 ? 0 : ((value / limit) * 100).toFixed(1)
    }
  });
});

/**
 * @desc    Cancel subscription
 * @route   DELETE /api/billing/subscription
 * @access  Private
 */
exports.cancelSubscription = catchAsync(async (req, res, next) => {
  const subscription = await Subscription.findOne({ user: req.user.id });

  if (!subscription) {
    return next(new AppError('No subscription found', 404));
  }

  if (subscription.plan === 'free') {
    return next(new AppError('Free plan cannot be cancelled', 400));
  }

  if (subscription.cancelAtPeriodEnd) {
    return next(new AppError('Subscription is already scheduled for cancellation', 400));
  }

  if (subscription.stripeSubscriptionId) {
    await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
  }

  res.status(200).json({
    success: true,
    message: 'Subscription will be cancelled at the end of billing period',
    data: {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: subscription.currentPeriodEnd
    }
  });
});

/**
 * @desc    Resume cancelled subscription
 * @route   POST /api/billing/subscription/resume
 * @access  Private
 */
exports.resumeSubscription = catchAsync(async (req, res, next) => {
  const subscription = await Subscription.findOne({ user: req.user.id });

  if (!subscription) {
    return next(new AppError('No subscription found', 404));
  }

  if (!subscription.cancelAtPeriodEnd) {
    return next(new AppError('Subscription is not scheduled for cancellation', 400));
  }

  if (subscription.stripeSubscriptionId) {
    await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    subscription.cancelAtPeriodEnd = false;
    await subscription.save();
  }

  res.status(200).json({
    success: true,
    message: 'Subscription resumed successfully' // ✅ FIX 6: Fixed misleading message
  });
});

/**
 * @desc    Get usage statistics
 * @route   GET /api/billing/usage
 * @access  Private
 */
exports.getUsageStats = catchAsync(async (req, res, next) => {
  const subscription = await Subscription.findOne({ user: req.user.id });

  if (!subscription) {
    return next(new AppError('No subscription found', 404));
  }

  await updateUsageStats(subscription);

  const usage = subscription.usage;
  const limits = subscription.limits;

  const usageStats = Object.keys(usage).map(resource => ({
    resource,
    used: usage[resource],
    limit: limits[resource],
    percentage: limits[resource] === -1 ? 0 : ((usage[resource] / limits[resource]) * 100).toFixed(1),
    isUnlimited: limits[resource] === -1
  }));

  res.status(200).json({
    success: true,
    data: {
      usage: usageStats,
      resetDate: subscription.currentPeriodEnd,
      plan: subscription.plan
    }
  });
});

/**
 * @desc    Download invoice PDF
 * @route   GET /api/billing/invoices/:id/pdf
 * @access  Private
 */
exports.downloadInvoicePdf = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  if (!invoice.stripeInvoiceId) {
    return next(new AppError('PDF not available for this invoice', 400));
  }

  const stripeInvoice = await getStripe().invoices.retrieve(invoice.stripeInvoiceId);

  if (stripeInvoice.hosted_invoice_url) {
    res.redirect(stripeInvoice.hosted_invoice_url);
  } else {
    return next(new AppError('PDF not available', 404));
  }
});

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * ✅ FIX 4: Update usage stats - fixed conversation count to use bot field
 * ✅ FIX 5: Team model safely required at top level - no crash risk
 */
async function updateUsageStats(subscription) {
  // Count bots owned by user
  const botCount = await Bot.countDocuments({ owner: subscription.user });
  subscription.usage.bots = botCount;

  // ✅ FIX 4: Count conversations via bots, not directly by user
  const userBots = await Bot.find({ owner: subscription.user }).select('_id');
  const conversationCount = await Conversation.countDocuments({
    bot: { $in: userBots.map(b => b._id) },
    createdAt: {
      $gte: subscription.currentPeriodStart,
      $lte: new Date()
    }
  });
  subscription.usage.conversations = conversationCount;

  // ✅ FIX 5: Team model is safe to use - models/team.js exists
  const team = await Team.findOne({ owner: subscription.user });
  subscription.usage.teamMembers = team?.members?.length || 1;

  // Count integrations
  const integrationCount = await Integration.countDocuments({
    user: subscription.user
  });
  subscription.usage.integrations = integrationCount;

  await subscription.save({ validateBeforeSave: false });
}

/**
 * ✅ FIX 3: Handle checkout.session.completed - fetch subscription from Stripe
 * for correct period dates instead of using session object
 */
async function handleCheckoutCompleted(session) {
  const { userId, planId, billingCycle } = session.metadata;

  const subscription = await Subscription.findOne({ user: userId });

  if (subscription) {
    // ✅ FIX 3: Retrieve Stripe subscription to get accurate period dates
    const stripeSubscription = await getStripe().subscriptions.retrieve(session.subscription);

    subscription.plan = planId;
    subscription.status = 'active';
    subscription.billingCycle = billingCycle;
    subscription.stripeSubscriptionId = session.subscription;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);

    updatePlanFeatures(subscription, planId);
    await subscription.save();
  }
}

/**
 * Handle customer.subscription.updated webhook
 */
async function handleSubscriptionUpdated(stripeSubscription) {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id
  });

  if (subscription) {
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    await subscription.save();
  }
}

/**
 * Handle customer.subscription.deleted webhook
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id
  });

  if (subscription) {
    subscription.status = 'canceled';
    subscription.plan = 'free';
    subscription.stripeSubscriptionId = undefined;
    updatePlanFeatures(subscription, 'free');
    await subscription.save();
  }
}

/**
 * Handle invoice.payment_succeeded webhook
 */
async function handlePaymentSucceeded(stripeInvoice) {
  const subscription = await Subscription.findOne({
    stripeCustomerId: stripeInvoice.customer
  });

  if (subscription) {
    await Invoice.create({
      user: subscription.user,
      subscription: subscription._id,
      invoiceNumber: stripeInvoice.number,
      description: `${subscription.plan} plan - ${subscription.billingCycle}`,
      amount: stripeInvoice.amount_paid / 100,
      amountDue: stripeInvoice.amount_due / 100,
      amountPaid: stripeInvoice.amount_paid / 100,
      currency: stripeInvoice.currency.toUpperCase(),
      status: 'paid',
      stripeInvoiceId: stripeInvoice.id,
      stripePaymentIntentId: stripeInvoice.payment_intent,
      periodStart: new Date(stripeInvoice.period_start * 1000),
      periodEnd: new Date(stripeInvoice.period_end * 1000),
      paid: true,
      paidAt: new Date()
    });

    // Create payment record — invoice field required by payment model
    const invoice = await Invoice.findOne({ stripeInvoiceId: stripeInvoice.id });
    if (invoice) {
      await Payment.create({
        user: subscription.user,
        subscription: subscription._id,
        invoice: invoice._id,
        amount: stripeInvoice.amount_paid / 100,
        currency: stripeInvoice.currency.toUpperCase(),
        type: 'subscription',
        status: 'succeeded',
        stripe: {
          paymentIntentId: stripeInvoice.payment_intent,
          chargeId: stripeInvoice.charge,
          customerId: stripeInvoice.customer
        },
        paid: true,
        paidAt: new Date()
      });
    }
  }
}

/**
 * Handle invoice.payment_failed webhook
 */
async function handlePaymentFailed(stripeInvoice) {
  const subscription = await Subscription.findOne({
    stripeCustomerId: stripeInvoice.customer
  });

  if (subscription) {
    subscription.status = 'past_due';
    await subscription.save();

    await Invoice.create({
      user: subscription.user,
      subscription: subscription._id,
      invoiceNumber: stripeInvoice.number,
      amount: stripeInvoice.amount_due / 100,
      amountDue: stripeInvoice.amount_due / 100,
      currency: stripeInvoice.currency.toUpperCase(),
      status: 'open',
      stripeInvoiceId: stripeInvoice.id,
      periodStart: new Date(stripeInvoice.period_start * 1000),
      periodEnd: new Date(stripeInvoice.period_end * 1000)
    });
  }
}

/**
 * Update plan features and limits on subscription object
 */
function updatePlanFeatures(subscription, planId) {
  const plans = {
    free: {
      limits: { bots: 1, conversations: 500, teamMembers: 1, integrations: 0, storage: 1, apiCalls: 1000 },
      features: { customBranding: false, advancedAnalytics: false, prioritySupport: false, apiAccess: false, webhooks: false, customModels: false }
    },
    starter: {
      limits: { bots: 3, conversations: 2500, teamMembers: 2, integrations: 5, storage: 5, apiCalls: 10000 },
      features: { customBranding: false, advancedAnalytics: true, prioritySupport: false, apiAccess: false, webhooks: true, customModels: false }
    },
    pro: {
      limits: { bots: 10, conversations: 10000, teamMembers: 5, integrations: 20, storage: 10, apiCalls: 100000 },
      features: { customBranding: true, advancedAnalytics: true, prioritySupport: true, apiAccess: true, webhooks: true, customModels: false }
    },
    enterprise: {
      limits: { bots: -1, conversations: -1, teamMembers: -1, integrations: -1, storage: 100, apiCalls: 1000000 },
      features: { customBranding: true, advancedAnalytics: true, prioritySupport: true, apiAccess: true, webhooks: true, customModels: true }
    }
  };

  const plan = plans[planId] || plans.free;
  subscription.limits = plan.limits;
  subscription.features = plan.features;
}