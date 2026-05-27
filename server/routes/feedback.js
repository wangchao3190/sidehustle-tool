const express = require('express');
const router = express.Router();
const { insertFeedback, getFeedbackBySlug, getAverageRating } = require('../db/queries');

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    // Accept both playbookId and playbookSlug (frontend sends playbookId)
    const playbookSlug = req.body.playbookSlug || req.body.playbookId;
    const { rating, comment } = req.body;
    const sessionId = req.sessionId;

    // Validate input
    if (!playbookSlug) {
      return res.status(400).json({
        error: '请提供副业方向标识',
        message: '请提供副业方向标识',
        code: 'MISSING_SLUG',
      });
    }

    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: '请提供有效的评分（1-5）',
        message: '请提供有效的评分（1-5）',
        code: 'INVALID_RATING',
      });
    }

    // Store feedback
    try {
      insertFeedback(playbookSlug, sessionId || null, rating, comment || null);
    } catch (dbError) {
      console.error('[Feedback] Database error:', dbError.message);
      return res.status(500).json({
        error: '反馈提交失败，请稍后重试',
        message: '反馈提交失败，请稍后重试',
        code: 'DB_ERROR',
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Feedback] Error:', error.message);
    return res.status(500).json({
      error: '服务器内部错误，请稍后重试',
      message: '服务器内部错误，请稍后重试',
      code: 'INTERNAL_ERROR',
    });
  }
});

// GET /api/feedback/:slug (get feedback for a playbook)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const feedbackList = getFeedbackBySlug(slug);
    const stats = getAverageRating(slug);

    return res.json({
      slug,
      averageRating: stats.avg ? Math.round(stats.avg * 10) / 10 : 0,
      totalReviews: stats.count,
      reviews: feedbackList.map(f => ({
        rating: f.rating,
        comment: f.comment,
        createdAt: f.created_at,
      })),
    });
  } catch (error) {
    console.error('[Feedback List] Error:', error.message);
    return res.status(500).json({
      error: '获取反馈列表失败',
      message: '获取反馈列表失败',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
