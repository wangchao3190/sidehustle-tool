const fs = require('fs');
const path = require('path');

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

async function callDeepSeek(systemPrompt, userMessage) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your-deepseek-key-here') {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error('DeepSeek API Key 无效，请检查配置');
    }
    if (response.status === 429) {
      throw new Error('API 请求过于频繁，请稍后重试');
    }
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(systemPrompt, userMessage) {
  const { Anthropic } = require('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-key-here') {
    throw new Error('ANTHROPIC_API_KEY 未配置');
  }

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');
}

function parseAIResponse(textContent) {
  let matches;
  try {
    matches = JSON.parse(textContent);
  } catch (e1) {
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

  return matches;
}

function enrichMatches(matches) {
  const sideHustles = loadSideHustles();

  return matches.slice(0, 3).map((match, index) => {
    const hustler = sideHustles.find(h => h.slug === match.slug);
    return {
      id: hustler ? hustler.id : index + 1,
      slug: match.slug,
      title: match.title || (hustler ? hustler.title : ''),
      matchRate: match.matchRate || 80 - index * 7,
      category: match.category || (hustler ? hustler.category : ''),
      difficulty: match.difficulty || (hustler ? hustler.difficulty : '中等'),
      reason: match.reason || '根据你的特点和偏好，这个方向很适合你',
      matchHighlights: match.matchHighlights || [],
      incomeRange: hustler ? hustler.incomeRange : '500-5000元/月',
      tags: hustler ? hustler.tags : [],
    };
  });
}

async function getMatches(answers) {
  const systemPrompt = loadSystemPrompt();
  const sideHustles = loadSideHustles();
  const provider = process.env.AI_PROVIDER || 'deepseek';

  const userMessage = `用户测评答案：\n${JSON.stringify(answers, null, 2)}\n\n副业方向数据库：\n${JSON.stringify(sideHustles, null, 2)}\n\n请根据以上信息给出匹配结果。`;

  let textContent;
  if (provider === 'anthropic') {
    textContent = await callAnthropic(systemPrompt, userMessage);
  } else {
    textContent = await callDeepSeek(systemPrompt, userMessage);
  }

  const matches = parseAIResponse(textContent);
  return enrichMatches(matches);
}

module.exports = { getMatches };
