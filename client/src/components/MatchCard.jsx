import { useState, useEffect, useRef } from 'react'
import { DIFFICULTY_LABELS } from '../utils'

const DIFF_COLORS = {
  easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-gold-500/10 text-gold-400 border-gold-500/20',
  hard: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

const DIFF_DESC = {
  easy: '门槛低，适合新手',
  medium: '需要一定基础',
  hard: '适合有经验者',
}

const PLAYBOOK_SECTIONS = [
  { icon: '📅', text: '30天启动计划（每日具体任务）' },
  { icon: '💰', text: '真实收入参考（新手→熟练→高手）' },
  { icon: '🛠️', text: '需要的工具和平台（含具体操作路径）' },
  { icon: '⚠️', text: '5个新手常见错误与避坑方法' },
  { icon: '📊', text: '当前市场竞争分析（2026年最新）' },
  { icon: '⚡', text: '今天就该做的第一件事' },
]

export default function MatchCard({ match, index, onUnlock, isUnlocking }) {
  const [expanded, setExpanded] = useState(false)
  const [animatedRate, setAnimatedRate] = useState(0)
  const animationRef = useRef(null)
  const cardRef = useRef(null)

  const diffLabel = DIFFICULTY_LABELS[match.difficulty] || match.difficulty
  const diffColorClass = DIFF_COLORS[match.difficulty] || DIFF_COLORS.medium
  const diffDesc = DIFF_DESC[match.difficulty] || ''

  // Animate match rate on mount
  useEffect(() => {
    const target = match.matchRate || 0
    const duration = 1000 + index * 200
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setAnimatedRate(Math.round(eased * target))
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [match.matchRate])

  // Intersection observer for entrance animation
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translateY(0)'
        }
      },
      { threshold: 0.1 }
    )
    el.style.opacity = '0'
    el.style.transform = 'translateY(30px)'
    el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const getRateColor = (rate) => {
    if (rate >= 90) return 'text-gold-400'
    if (rate >= 75) return 'text-indigo-400'
    return 'text-gray-400'
  }

  const getRateBg = (rate) => {
    if (rate >= 90) return 'bg-gold-500/10 border-gold-500/30'
    if (rate >= 75) return 'bg-indigo-500/10 border-indigo-500/30'
    return 'bg-white/5 border-white/10'
  }

  const rateColor = getRateColor(match.matchRate)
  const rateBg = getRateBg(match.matchRate)

  // Category badge
  const categoryLabel = match.category || ''

  return (
    <div
      ref={cardRef}
      className="glass-card overflow-hidden card-hover"
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      {/* Card header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {categoryLabel && (
                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold
                  bg-white/5 text-gray-300 border border-white/10">
                  {categoryLabel}
                </span>
              )}
              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${diffColorClass}`}>
                {diffLabel}
                {diffDesc && <span className="ml-1 opacity-60">{diffDesc}</span>}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white leading-snug mb-1">
              {match.title}
            </h3>
            <p className="text-sm text-gray-400">
              预期收入：{match.incomeRange}
            </p>
          </div>

          {/* Match rate */}
          <div className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[72px] rounded-2xl border ${rateBg}`}>
            <span className={`text-2xl font-extrabold ${rateColor} leading-none`}>
              {animatedRate}%
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">匹配度</span>
          </div>
        </div>
      </div>

      {/* Reason paragraph */}
      <div className="px-5 pb-4">
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs text-indigo-400 font-semibold">为什么适合你</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {match.reason}
          </p>
        </div>
      </div>

      {/* Why this fits you — highlights */}
      {match.highlights && match.highlights.length > 0 && (
        <div className="px-5 pb-4">
          <div className="space-y-2">
            {match.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-gold-400 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
                <span className="text-sm text-gray-300 leading-relaxed">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unique advantage */}
      {match.uniqueAdvantage && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="text-sm">💡</span>
            <span className="text-xs text-gray-400">{match.uniqueAdvantage}</span>
          </div>
        </div>
      )}

      {/* TOC preview — CLEAR, not blurred — as selling tool */}
      <div className="border-t border-white/5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-3.5 flex items-center justify-between
            text-sm text-gray-400 hover:bg-white/[0.02] transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="font-medium">📋 解锁后你将获得</span>
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-5 pb-5 animate-fade-in">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              {/* Section list */}
              <ul className="space-y-3 mb-5">
                {PLAYBOOK_SECTIONS.map((section, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5">{section.icon}</span>
                    <span className="text-sm text-gray-300">{section.text}</span>
                  </li>
                ))}
              </ul>

              {/* Premium trust badges — prominent selling point */}
              <div className="mt-4 bg-gradient-to-br from-gold-500/8 to-gold-500/3 border border-gold-500/20 rounded-2xl p-4">
                <p className="text-sm font-bold text-gold-400 mb-3 text-center">
                  ✨ 解锁后你将获得
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-start gap-2 bg-white/[0.03] rounded-xl p-2.5">
                    <span className="text-base flex-shrink-0">🔄</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-200">每月更新</p>
                      <p className="text-[10px] text-gray-500">内容持续迭代</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/[0.03] rounded-xl p-2.5">
                    <span className="text-base flex-shrink-0">💡</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-200">50+真实案例</p>
                      <p className="text-[10px] text-gray-500">经验提炼总结</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/[0.03] rounded-xl p-2.5">
                    <span className="text-base flex-shrink-0">🛠️</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-200">工具清单</p>
                      <p className="text-[10px] text-gray-500">具体操作路径</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/[0.03] rounded-xl p-2.5">
                    <span className="text-base flex-shrink-0">♾️</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-200">永久查看</p>
                      <p className="text-[10px] text-gray-500">一次购买永不过期</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => onUnlock(match)}
                disabled={isUnlocking}
                className={`btn-gold w-full py-3.5 text-base mt-4 ${
                  isUnlocking ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isUnlocking ? '处理中...' : `解锁完整手册 · 仅需 ¥9.9`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Direct unlock button (when TOC is collapsed) */}
      {!expanded && (
        <div className="px-5 pb-5 pt-1">
          <button
            onClick={() => onUnlock(match)}
            disabled={isUnlocking}
            className={`btn-gold w-full py-3.5 text-base ${
              isUnlocking ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isUnlocking ? '处理中...' : `解锁完整手册 · 仅需 ¥9.9`}
          </button>
        </div>
      )}
    </div>
  )
}
