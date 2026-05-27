const express = require('express');
const router = express.Router();
const { insertQuiz, updateQuizMatches, getPlaybookBySlug } = require('../db/queries');
const { getMatches } = require('../services/ai');

// Normalize Chinese difficulty labels to frontend-friendly English keys
function normalizeDifficulty(chineseDifficulty) {
  const map = {
    '简单': 'easy',
    '中等': 'medium',
    '中等偏难': 'hard',
    '较难': 'hard',
    '困难': 'hard',
  };
  return map[chineseDifficulty] || 'medium';
}

// Build preview sections from playbook
function buildPreviewSections(playbook) {
  if (!playbook || !playbook.preview_content) {
    return [
      '30天启动计划（每日任务）',
      '真实收入参考（分阶段）',
      '需要的工具和平台',
      '新手常见错误与避坑指南',
      '当前竞争情况分析',
      '今天就该做的第一件事',
    ];
  }
  const headingRegex = /^## (.+)$/gm;
  const sections = [];
  let match;
  while ((match = headingRegex.exec(playbook.preview_content)) !== null) {
    sections.push(match[1].trim());
  }
  return sections.length > 0 ? sections : [
    '30天启动计划（每日任务）',
    '真实收入参考（分阶段）',
    '需要的工具和平台',
    '新手常见错误与避坑指南',
    '当前竞争情况分析',
    '今天就该做的第一件事',
  ];
}

// POST /api/quiz
router.post('/', async (req, res) => {
  try {
    const { answers } = req.body;

    // Validate input
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        error: '请提供有效的测评答案',
        message: '请提供有效的测评答案',
        code: 'INVALID_ANSWERS',
      });
    }

    const requiredQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q7', 'q8', 'q9'];
    const missingQuestions = requiredQuestions.filter(q => !answers[q]);
    if (missingQuestions.length > 0) {
      return res.status(400).json({
        error: `请回答所有测评问题（缺少：${missingQuestions.join(', ')}）`,
        message: `请回答所有测评问题（缺少：${missingQuestions.join(', ')}）`,
        code: 'INCOMPLETE_ANSWERS',
      });
    }

    const sessionId = req.sessionId;

    // Step 1: Store quiz answers in DB
    let quizId;
    try {
      quizId = insertQuiz(sessionId, answers);
    } catch (dbError) {
      console.error('[Quiz] Database error storing quiz:', dbError.message);
      return res.status(500).json({
        error: '数据存储失败，请稍后重试',
        message: '数据存储失败，请稍后重试',
        code: 'DB_ERROR',
      });
    }

    // Step 2 & 3: Call Claude API for matching
    let matches;
    try {
      matches = await getMatches(answers);
    } catch (aiError) {
      console.error('[Quiz] Claude API error:', aiError.message);
      const msg = aiError.message || 'AI 匹配服务暂时不可用，请稍后重试';
      return res.status(500).json({
        error: msg,
        message: msg,
        code: 'AI_ERROR',
      });
    }

    // Validate matches
    if (!matches || matches.length === 0) {
      return res.status(500).json({
        error: 'AI 未能返回有效的匹配结果，请稍后重试',
        message: 'AI 未能返回有效的匹配结果，请稍后重试',
        code: 'EMPTY_MATCHES',
      });
    }

    // Step 4: Store matches in DB
    try {
      updateQuizMatches(quizId, matches);
    } catch (dbError) {
      console.error('[Quiz] Database error updating matches:', dbError.message);
      // Non-critical: matches are already in response
    }

    // Step 5: Build enriched response with previewSections
    const enrichedMatches = matches.slice(0, 3).map((m, index) => {
      const playbook = getPlaybookBySlug(m.slug);
      const previewSections = buildPreviewSections(playbook);
      return {
        id: m.id || index + 1,
        slug: m.slug,
        title: m.title,
        matchRate: m.matchRate,
        reason: m.reason,
        difficulty: normalizeDifficulty(m.difficulty),
        incomeRange: m.incomeRange,
        matchHighlights: m.matchHighlights || [],
        previewSections,
        category: m.category || '',
        tags: m.tags || [],
      };
    });

    return res.json({ matches: enrichedMatches });
  } catch (error) {
    console.error('[Quiz] Unexpected error:', error.message);
    return res.status(500).json({
      error: '服务器内部错误，请稍后重试',
      message: '服务器内部错误，请稍后重试',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
