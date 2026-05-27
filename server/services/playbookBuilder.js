const fs = require('fs');
const path = require('path');

function loadSideHustles() {
  const dataPath = path.join(__dirname, '..', '..', 'data', 'sidehustles.json');
  if (!fs.existsSync(dataPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function buildTableOfContents(sections) {
  return sections.map((s, i) => `${i + 1}. ${s}`);
}

function generateContentFromSideHustle(hustler) {
  const sections = [];

  // Title
  sections.push(`# ${hustler.title}`);
  sections.push('');

  // About
  sections.push('## 项目简介');
  sections.push('');
  sections.push(hustler.description || '暂无简介');
  sections.push('');

  // Why it works
  if (hustler.whyItWorks) {
    sections.push('## 为什么这个方向可行');
    sections.push('');
    sections.push(hustler.whyItWorks);
    sections.push('');
  }

  // Basic info
  sections.push('## 基本信息');
  sections.push('');
  sections.push(`- **难度**：${hustler.difficulty || '中等'}`);
  sections.push(`- **时间投入**：${hustler.timeCommitment || '每天2-3小时'}`);
  sections.push(`- **收入范围**：${hustler.incomeRange || '500-5000元/月'}`);
  sections.push(`- **启动成本**：${hustler.startupCost || '0-500元'}`);
  sections.push(`- **设备要求**：${hustler.device || '电脑/手机'}`);
  sections.push(`- **适合性格**：${(hustler.personality || []).join('、')}`);
  sections.push(`- **适合城市**：${(hustler.cityType || []).join('、')}`);
  sections.push('');

  // Skills needed
  if (hustler.skillsNeeded && hustler.skillsNeeded.length > 0) {
    sections.push('## 所需技能');
    sections.push('');
    hustler.skillsNeeded.forEach(skill => {
      sections.push(`- ${skill}`);
    });
    sections.push('');
  }

  // Tags
  if (hustler.tags && hustler.tags.length > 0) {
    sections.push('## 特点标签');
    sections.push('');
    sections.push(hustler.tags.map(t => `\`${t}\``).join(' '));
    sections.push('');
  }

  // Common pitfalls
  if (hustler.commonPitfalls && hustler.commonPitfalls.length > 0) {
    sections.push('## 常见坑与避坑指南');
    sections.push('');
    hustler.commonPitfalls.forEach((pitfall, i) => {
      sections.push(`### 坑 ${i + 1}`);
      sections.push('');
      sections.push(pitfall);
      sections.push('');
    });
  }

  // Platform recommendations
  if (hustler.platforms && hustler.platforms.length > 0) {
    sections.push('## 推荐平台');
    sections.push('');
    hustler.platforms.forEach(p => {
      sections.push(`- ${p}`);
    });
    sections.push('');
  }

  // Market analysis
  if (hustler.redOceanLevel) {
    sections.push('## 市场竞争分析');
    sections.push('');
    sections.push(hustler.redOceanLevel);
    sections.push('');
  }

  // Suitable profile
  if (hustler.suitableFor) {
    sections.push('## 适合人群');
    sections.push('');
    sections.push(`**最适合**：${hustler.suitableFor.primaryProfile || ''}`);
    sections.push('');
    sections.push(`**为什么**：${hustler.suitableFor.whyMatches || ''}`);
    sections.push('');
    if (hustler.suitableFor.contraindications && hustler.suitableFor.contraindications.length > 0) {
      sections.push('**不适合人群**：');
      hustler.suitableFor.contraindications.forEach(c => {
        sections.push(`- ${c}`);
      });
      sections.push('');
    }
  }

  // Getting started steps
  sections.push('## 新手起步指南');
  sections.push('');
  sections.push('### 第一步：了解行业');
  sections.push('');
  sections.push(`花1-2周时间深入了解"${hustler.title}"这个领域。关注做得好的同行，研究他们的成功路径。`);
  sections.push('');
  sections.push('### 第二步：准备工具和技能');
  sections.push('');
  const skills = hustler.skillsNeeded || [];
  if (skills.length > 0) {
    sections.push(`重点学习和练习：${skills.slice(0, 3).join('、')}。`);
  }
  sections.push('利用免费资源（B站教程、知乎文章、小红书）入门，不需要一开始就花钱买课。');
  sections.push('');
  sections.push('### 第三步：小规模试水');
  sections.push('');
  sections.push('不要一上来就追求完美。先接1-2个小单，或者发布第一批内容，用真实反馈来优化。');
  sections.push('');
  sections.push('### 第四步：优化和放大');
  sections.push('');
  sections.push('找到你的差异化优势，持续优化流程，逐步提高单价或扩大规模。');
  sections.push('');

  const fullContent = sections.join('\n');

  // Generate preview (first ~800 chars of intro sections)
  const previewSections = sections.slice(0, sections.findIndex((s, i) =>
    i > 5 && s.startsWith('## ') && !s.includes('项目简介') && !s.includes('为什么这个方向可行') && !s.includes('基本信息')
  ));
  const previewContent = previewSections.length > 0
    ? previewSections.join('\n') + '\n\n> 💡 解锁完整版查看全部内容，包括常见坑避坑指南、推荐平台、市场分析和新手起步指南。'
    : fullContent.substring(0, 800) + '...';

  return {
    content: fullContent,
    previewContent: previewContent,
  };
}

function seedPlaybooks(upsertFn) {
  const sideHustles = loadSideHustles();
  if (sideHustles.length === 0) {
    console.log('[Seed] No side hustles found in data file');
    return 0;
  }

  let count = 0;
  for (const hustler of sideHustles) {
    const { content, previewContent } = generateContentFromSideHustle(hustler);

    upsertFn(hustler.slug, {
      title: hustler.title,
      category: hustler.category,
      difficulty: hustler.difficulty,
      income_range: hustler.incomeRange,
      suitable_for: {
        primaryProfile: hustler.suitableFor ? hustler.suitableFor.primaryProfile : '',
        whyMatches: hustler.suitableFor ? hustler.suitableFor.whyMatches : '',
        contraindications: hustler.suitableFor ? hustler.suitableFor.contraindications : [],
        tags: hustler.tags,
        personality: hustler.personality,
        cityType: hustler.cityType,
        skillsNeeded: hustler.skillsNeeded,
      },
      content: content,
      preview_content: previewContent,
    });
    count++;
  }

  return count;
}

module.exports = { seedPlaybooks, buildTableOfContents, generateContentFromSideHustle };
