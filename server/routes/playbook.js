const express = require('express');
const router = express.Router();
const { getPlaybookBySlug, hasPaidOrder } = require('../db/queries');

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

// Parse markdown content into sections array [{ title, content }]
function parseSections(markdown) {
  if (!markdown) return [];

  const sections = [];
  const lines = markdown.split('\n');
  let currentSection = null;
  let contentLines = [];

  for (const line of lines) {
    // H1 heading is the title, skip it
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      continue;
    }
    // H2 heading starts a new section
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection !== null && contentLines.length > 0) {
        sections.push({
          title: currentSection,
          content: contentLines.join('\n').trim(),
        });
      }
      currentSection = line.replace('## ', '').trim();
      contentLines = [];
    } else if (currentSection !== null) {
      contentLines.push(line);
    }
  }

  // Save last section
  if (currentSection !== null && contentLines.length > 0) {
    sections.push({
      title: currentSection,
      content: contentLines.join('\n').trim(),
    });
  }

  return sections;
}

// GET /api/playbook/:slug/preview
router.get('/:slug/preview', async (req, res) => {
  try {
    const { slug } = req.params;

    const playbook = getPlaybookBySlug(slug);
    if (!playbook) {
      return res.status(404).json({
        error: '未找到该副业方向',
        message: '未找到该副业方向',
        code: 'NOT_FOUND',
      });
    }

    // Parse preview content and build table of contents
    let previewContent = '';
    let tableOfContents = [];
    let teaser = '';

    if (playbook.preview_content) {
      previewContent = playbook.preview_content;

      // Extract headings for table of contents
      const headingRegex = /^## (.+)$/gm;
      let match;
      while ((match = headingRegex.exec(previewContent)) !== null) {
        tableOfContents.push(match[1].trim());
      }

      // Extract teaser (first ~200 chars after the first heading)
      const contentAfterTitle = previewContent.replace(/^# .+\n+/, '');
      const firstParagraph = contentAfterTitle.replace(/^## .+\n+/, '').trim();
      teaser = firstParagraph.substring(0, 200);
      if (firstParagraph.length > 200) {
        teaser += '...';
      }
    }

    return res.json({
      slug: playbook.slug,
      title: playbook.title,
      category: playbook.category || '',
      difficulty: normalizeDifficulty(playbook.difficulty),
      incomeRange: playbook.income_range || '',
      tableOfContents,
      teaser,
      previewContent,
    });
  } catch (error) {
    console.error('[Playbook Preview] Error:', error.message);
    return res.status(500).json({
      error: '获取预览内容失败，请稍后重试',
      message: '获取预览内容失败，请稍后重试',
      code: 'INTERNAL_ERROR',
    });
  }
});

// GET /api/playbook/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const sessionId = req.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        error: '缺少会话标识',
        message: '缺少会话标识',
        code: 'MISSING_SESSION',
      });
    }

    const playbook = getPlaybookBySlug(slug);
    if (!playbook) {
      return res.status(404).json({
        error: '未找到该副业方向',
        message: '未找到该副业方向',
        code: 'NOT_FOUND',
      });
    }

    // Check if user has paid
    const paid = hasPaidOrder(sessionId, slug);

    if (!paid) {
      return res.status(403).json({
        error: '请先解锁',
        message: '请先解锁',
        needPayment: true,
        slug: playbook.slug,
        title: playbook.title,
      });
    }

    // Parse suitable_for JSON
    let suitableFor = {};
    try {
      suitableFor = JSON.parse(playbook.suitable_for || '{}');
    } catch (e) {
      suitableFor = {};
    }

    // Parse content into sections
    const sections = parseSections(playbook.content);

    // Return wrapped in { playbook: { ... } } for frontend compatibility
    return res.json({
      playbook: {
        id: playbook.id,
        slug: playbook.slug,
        title: playbook.title,
        category: playbook.category || '',
        difficulty: normalizeDifficulty(playbook.difficulty),
        incomeRange: playbook.income_range || '',
        suitableFor,
        content: playbook.content || '',
        sections: sections.length > 0 ? sections : null,
        createdAt: playbook.created_at,
        updatedAt: playbook.updated_at,
      },
    });
  } catch (error) {
    console.error('[Playbook] Error:', error.message);
    return res.status(500).json({
      error: '获取内容失败，请稍后重试',
      message: '获取内容失败，请稍后重试',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
