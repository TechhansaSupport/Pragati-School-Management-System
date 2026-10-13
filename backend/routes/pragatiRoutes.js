const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');

// POST /api/pragati/webhook
router.post('/webhook', express.json(), async (req, res) => {
  try {
    // 1. Verify the shared secret
    const secret = req.headers['x-pragati-secret'];
    const WEBHOOK_SECRET = process.env.PRAGATI_WEBHOOK_SECRET || 'pragati_webhook_secret';
    if (!secret || secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized webhook call' });
    }
    
    // 2. Validate payload
    const { event, slug, status } = req.body;
    if (!event || !slug || !status) {
      return res.status(400).json({ error: 'Missing event, slug, or status' });
    }
    
    if (!['tenant.suspended', 'tenant.activated'].includes(event)) {
      return res.status(400).json({ error: 'Unknown event type' });
    }

    // 3. Update local Tenant record to stay in sync with Pragati
    const tenant = await Tenant.findOneAndUpdate(
      { slug },
      { status },
      { new: true }
    );
    
    if (!tenant) {
      // If we don't have the tenant locally, you could choose to create it, 
      // but typically we wait for full sync or ignore if this node doesn't own it.
      // For Pragati, we'll return 404 for missing.
      return res.status(404).json({ error: `Tenant "${slug}" not found` });
    }
    
    console.log(`[Pragati Webhook] ${event} → slug=${slug}, status=${status}`);
    return res.json({ success: true, slug, status });
  } catch (err) {
    console.error('[Pragati Webhook] Error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
