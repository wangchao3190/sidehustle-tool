import { useNavigate } from 'react-router-dom'

const trustBadges = [
  { icon: '◆', text: '9维度深度分析' },
  { icon: '◆', text: 'AI智能匹配' },
  { icon: '◆', text: '实操手册落地' },
]

const processSteps = [
  {
    step: '01',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: '回答9题',
    desc: '深入了解你的优势与偏好',
  },
  {
    step: '02',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI深度分析',
    desc: '9维度能力画像+智能匹配',
  },
  {
    step: '03',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: '获取实操手册',
    desc: '30天计划+工具清单+避坑指南',
  },
]

const uspCards = [
  {
    icon: '🎯',
    title: '个性化匹配',
    desc: '不是泛泛推荐，9维度深度分析你的实际情况',
    highlight: '匹配准确率 94%',
  },
  {
    icon: '📚',
    title: '实操手册',
    desc: '30天计划+真实案例，跟着做就能出成果',
    highlight: '50+ 真实案例',
  },
  {
    icon: '🔄',
    title: '每月更新',
    desc: '市场变化快，手册持续迭代最新策略',
    highlight: '2026年5月最新',
  },
  {
    icon: '🛠️',
    title: '工具推荐',
    desc: '每个方向配套具体工具和平台操作路径',
    highlight: '精选工具清单',
  },
]

const testimonials = [
  {
    name: '小李',
    role: '互联网运营 · 28岁',
    text: '一直在想做自媒体但不知道怎么起步，测评给我匹配了"小红书内容电商"，手册里30天计划非常详细，照着做就行。第一个月就出了第一篇爆款。',
    result: '已启动小红书账号',
  },
  {
    name: '老王',
    role: '建筑设计师 · 35岁',
    text: '本来想搞编程接单，测评结果建议我做"AI工具使用培训"，因为我有教学经验。没想到这个方向需求这么大，现在周末上一次课，月增收3000+。',
    result: '月增收 3000+',
  },
  {
    name: '张姐',
    role: '全职妈妈 · 32岁',
    text: '时间很碎，测评给我匹配了"闲鱼无货源"，不用囤货、时间灵活。手册里的选品清单和话术模板直接拿来用，两周出了第一单。',
    result: '两周出首单',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A]">
      {/* ── Header ──────────────────────────────── */}
      <header className="px-5 pt-6 pb-2">
        <div className="max-w-md mx-auto flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
            <span className="text-[#0F172A] text-sm font-extrabold">副</span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">副业实操手册</span>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <main className="flex-1 px-5">
        <div className="max-w-md mx-auto pt-8 pb-10">

          {/* Badge */}
          <div className="animate-fade-in-down text-center mb-5">
            <span className="inline-block bg-gold-500/10 text-gold-400 text-xs font-semibold
              px-4 py-1.5 rounded-full border border-gold-500/20">
              AI驱动的副业方向匹配工具
            </span>
          </div>

          {/* Headline */}
          <div className="text-center animate-fade-in-up">
            <h1 className="text-3xl font-extrabold text-white leading-tight mb-3 tracking-tight">
              找到真正属于你的<br />
              <span className="text-gold-gradient">副业方向</span>
            </h1>
            <p className="text-base text-gray-400 leading-relaxed mb-3 max-w-sm mx-auto">
              不是泛泛而谈的推荐，而是基于你的实际情况、
              由AI驱动的<span className="text-gold-400 font-semibold">个性化深度分析</span>
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {trustBadges.map((b) => (
              <div key={b.text} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="text-gold-500 text-[10px]">{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="animate-fade-in-up mb-4" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => navigate('/quiz')}
              className="btn-gold w-full py-4 text-lg"
            >
              开始免费测评（只需3分钟）
            </button>
          </div>

          {/* Social proof */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm text-gray-500">
              已有 <span className="text-gold-400 font-bold">12,830+</span> 人完成测评，
              匹配准确率 <span className="text-gold-400 font-bold">94%</span>
            </p>
          </div>

          {/* ── Process Steps ─────────────────────── */}
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl font-bold text-white text-center mb-8">
              三步找到你的副业方向
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {processSteps.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 glass-card flex items-center justify-center
                    mx-auto mb-3 text-gold-400">
                    {item.icon}
                  </div>
                  <p className="text-xs text-gold-500/60 font-bold mb-1">Step {item.step}</p>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Why Us (USPs) ─────────────────────── */}
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-bold text-white text-center mb-8">
              为什么选择我们
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {uspCards.map((card) => (
                <div
                  key={card.title}
                  className="glass-card p-5 card-hover"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{card.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-white">{card.title}</h3>
                        <span className="text-[11px] text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full font-medium">
                          {card.highlight}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Testimonials ──────────────────────── */}
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-xl font-bold text-white text-center mb-8">
              他们通过手册找到了方向
            </h2>
            <div className="space-y-4">
              {testimonials.map((item, i) => (
                <div
                  key={i}
                  className="glass-card p-5 animate-fade-in-up"
                  style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600
                      rounded-full flex items-center justify-center text-[#0F172A] text-sm font-extrabold">
                      {item.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">
                    "{item.text}"
                  </p>
                  <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400
                    text-xs font-semibold rounded-full border border-emerald-500/20">
                    {item.result}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom CTA ────────────────────────── */}
          <div className="mt-16 mb-12 text-center animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            <div className="glass-card p-8">
              <p className="text-lg font-bold text-white mb-2">
                不确定自己适合什么副业？
              </p>
              <p className="text-sm text-gray-400 mb-6">
                让AI深度分析你的能力画像，精准匹配最适合的方向
              </p>
              <button
                onClick={() => navigate('/quiz')}
                className="btn-gold w-full py-4 text-lg"
              >
                免费开始测评（只需3分钟）
              </button>
              <p className="text-xs text-gray-500 mt-3">
                无需注册 · 不索要个人信息 · 先看结果再决定
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="px-5 py-6 border-t border-white/5">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs text-gray-500">
            副业实操手册 · 帮你找到真正适合的副业方向
          </p>
          <p className="text-xs text-gray-600 mt-1">
            &copy; 2026 副业实操手册 版权所有
          </p>
        </div>
      </footer>
    </div>
  )
}
