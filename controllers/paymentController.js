const db = require('../database/connection.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/*  createCheckoutSession  */
const handleCreateCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const { userId, email } = req.user;

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.APP_URL}/pro-success`,
            cancel_url: `${process.env.APP_URL}/pro`,
            customer_email: email,
            client_reference_id: userId.toString()
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  createPortalSession  */
const handleCreatePortalSession = async (req, res) => {
    const { userId } = req.user;

    try {
        const [[user]] = await db.execute(
            'SELECT stripe_customer_id FROM users WHERE user_id = ?',
            [userId]
        );

        if (!user || !user.stripe_customer_id) {
            return res.status(404).json({ error: 'No subscription found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: `${process.env.APP_URL}/settings`
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  stripeWebhook  */
const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;

        try {
            await db.query('UPDATE users SET is_pro = TRUE, stripe_customer_id = ? WHERE user_id = ?', [session.customer, userId]);
        } catch (err) {
            console.error('Failed to update user pro status:', err);
        }
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        if (subscription.cancel_at_period_end === true) {
            console.log('Subscription set to cancel at period end');
        }

        if (subscription.status === 'canceled') {
            try {
                await db.query('UPDATE users SET is_pro = FALSE WHERE stripe_customer_id = ?', [customerId]);
            } catch (err) {
                console.error('Failed to update user pro status:', err);
            }
        }
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        try {
            await db.query('UPDATE users SET is_pro = FALSE WHERE stripe_customer_id = ?', [customerId]);
        } catch (err) {
            console.error('Failed to update user pro status:', err);
        }
    }

    res.json({ received: true });
};

module.exports = { handleCreateCheckoutSession, handleCreatePortalSession, handleStripeWebhook };