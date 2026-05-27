const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  updateOrderStatus,
  getPlaybookBySlug,
} = require('../db/queries');
const crypto = require('crypto');

// POST /api/payment/create
router.post('/create', async (req, res) => {
  try {
    const { playbookSlug } = req.body;
    const sessionId = req.sessionId;

    if (!playbookSlug) {
      return res.status(400).json({
        error: '请提供副业方向标识',
        message: '请提供副业方向标识',
        code: 'MISSING_SLUG',
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        error: '缺少会话标识',
        message: '缺少会话标识',
        code: 'MISSING_SESSION',
      });
    }

    // Verify playbook exists
    const playbook = getPlaybookBySlug(playbookSlug);
    if (!playbook) {
      return res.status(404).json({
        error: '未找到该副业方向',
        message: '未找到该副业方向',
        code: 'NOT_FOUND',
      });
    }

    // Create order
    const orderId = createOrder(sessionId, playbookSlug);

    // For MVP: generate a placeholder payment URL
    const payjsKey = process.env.PAYJS_KEY;
    let paymentUrl;

    if (payjsKey) {
      paymentUrl = `https://payjs.cn/api/jsapi?mchid=${payjsKey}&out_trade_no=order_${orderId}&total_fee=990&body=${encodeURIComponent('解锁：' + playbook.title)}`;
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      paymentUrl = `${frontendUrl}/payment?orderId=${orderId}&slug=${playbookSlug}`;
    }

    return res.json({
      orderId,
      paymentUrl,
      amount: 9.9,
      playbookTitle: playbook.title,
    });
  } catch (error) {
    console.error('[Payment Create] Error:', error.message);
    return res.status(500).json({
      error: '创建订单失败，请稍后重试',
      message: '创建订单失败，请稍后重试',
      code: 'INTERNAL_ERROR',
    });
  }
});

// POST /api/payment/callback
// PayJS webhook endpoint
router.post('/callback', async (req, res) => {
  try {
    const payjsKey = process.env.PAYJS_KEY;

    // If PayJS key is not configured, treat as MVP mode
    if (!payjsKey) {
      const { order_id, status, sign } = req.body;

      if (!order_id || !status) {
        return res.status(400).json({ code: -1, msg: '参数不完整' });
      }

      const orderId = parseInt(String(order_id).replace('order_', ''), 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ code: -1, msg: '无效的订单号' });
      }

      const order = getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ code: -1, msg: '订单不存在' });
      }

      if (status === 'paid') {
        updateOrderStatus(orderId, 'paid');
      } else if (status === 'failed') {
        updateOrderStatus(orderId, 'failed');
      }

      return res.json({ code: 0, msg: 'ok' });
    }

    // PayJS signature verification (production mode)
    const { order_id, status, sign } = req.body;

    if (!order_id || !status || !sign) {
      return res.status(400).json({ code: -1, msg: '参数不完整' });
    }

    const signStr = `order_id=${order_id}&status=${status}&key=${payjsKey}`;
    const expectedSign = crypto.createHash('md5').update(signStr).digest('hex');

    if (sign.toLowerCase() !== expectedSign.toLowerCase()) {
      console.error('[Payment Callback] Signature verification failed');
      return res.status(403).json({ code: -1, msg: '签名验证失败' });
    }

    const orderId = parseInt(String(order_id).replace('order_', ''), 10);
    if (!isNaN(orderId)) {
      const order = getOrderById(orderId);
      if (order) {
        if (status === 'paid') {
          updateOrderStatus(orderId, 'paid');
        } else if (status === 'failed' || status === 'cancelled') {
          updateOrderStatus(orderId, 'failed');
        }
      }
    }

    return res.json({ code: 0, msg: 'ok' });
  } catch (error) {
    console.error('[Payment Callback] Error:', error.message);
    return res.status(500).json({ code: -1, msg: '服务器错误' });
  }
});

// GET /api/payment/status/:orderId
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const id = parseInt(orderId, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        error: '无效的订单号',
        message: '无效的订单号',
        code: 'INVALID_ORDER_ID',
      });
    }

    const order = getOrderById(id);
    if (!order) {
      return res.status(404).json({
        error: '订单不存在',
        message: '订单不存在',
        code: 'NOT_FOUND',
      });
    }

    return res.json({
      orderId: order.id,
      status: order.status,
      playbookSlug: order.playbook_slug,
      amount: order.amount,
      createdAt: order.created_at,
      paidAt: order.paid_at,
    });
  } catch (error) {
    console.error('[Payment Status] Error:', error.message);
    return res.status(500).json({
      error: '查询订单状态失败，请稍后重试',
      message: '查询订单状态失败，请稍后重试',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
