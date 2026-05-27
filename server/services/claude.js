const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

let anthropic = null;

function getClient() {
  if (anthropic) return anthropic;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-key-here') {
    throw new Error('ANTHROPIC_API_KEY 未配置，请在 .env 文件中设置有效的 API Key');
  }

  anthropic = new Anthropic({ apiKey });
  return anthropic;
}

function loadSystemPrompt() {
  const promptPath = path.join(__dirname, '..', '..', 'data', 'prompts', 'matching-prompt.md');
  if (!fs.existsSync(promptPath)) {
    throw new Error('匹配提示词文件不存在');
  }
  return fs.readFileSync(promptPath, 'utf-8');
}

function loadSideHustles() {
  const dataPath = path.join(__dirname, '..', '..', 'data', 'sidehustles.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('副业数据库文件不存在');
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

async function getMatches(answers) {
  try {
    const client = getClient();
    const systemPrompt = loadSystemPrompt();
    const sideHustles = loadSideHustles();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `用户测评答案：\n${JSON.stringify(answers, null, 2)}\n\n副业方向数据库：\n${JSON.stringify(sideHustles, null, 2)}\n\n请根据以上信息给出匹配结果。`
      }]
    });

    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Try to parse JSON from the response
    let matches;
    try {
      // First try: direct parse
      matches = JSON.parse(textContent);
    } catch (e1) {
      // Second try: extract JSON from markdown code block
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          matches = JSON.parse(jsonMatch[1]);
        } catch (e2) {
          throw new Error('AI 返回的匹配结果格式不正确，请稍后重试');
        }
      } else {
        throw new Error('AI 返回的匹配结果格式不正确，请稍后重试');
      }
    }

    if (!Array.isArray(matches) || matches.length < 1) {
      throw new Error('AI 未能返回有效的匹配结果');
    }

    // Enrich matches with additional info from sidehustles
    const enrichedMatches = matches.slice(0, 3).map((match, index) => {
      const hustler = sideHustles.find(h => h.slug === match.slug);
      return {
        id: hustler ? hustler.id : index + 1,
        slug: match.slug,
        title: match.title || (hustler ? hustler.title : ''),
        matchRate: match.matchRate || 80 - index * 7,
        reason: match.reason || '根据你的特点和偏好，这个方向很适合你',
        difficulty: match.difficulty || (hustler ? hustler.difficulty : '中等'),
        incomeRange: hustler ? hustler.incomeRange : '500-5000元/月',
        matchHighlights: match.matchHighlights || [],
        category: hustler ? hustler.category : '',
        tags: hustler ? hustler.tags : [],
      };
    });

    return enrichedMatches;
  } catch (error) {
    if (error.message.includes('ANTHROPIC_API_KEY')) {
      throw error;
    }
    if (error.status === 401) {
      throw new Error('AI 服务认证失败，请检查 API Key 配置');
    }
    if (error.status === 429) {
      throw new Error('AI 服务请求过于频繁，请稍后重试');
    }
    if (error.status >= 500) {
      throw new Error('AI 服务暂时不可用，请稍后重试');
    }
    throw error;
  }
}

module.exports = { getMatches };
