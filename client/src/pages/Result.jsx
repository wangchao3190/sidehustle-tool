import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MatchCard from '../components/MatchCard'
import PayGate from '../components/PayGate'

/* ── Mini radar chart thumbnail ────────────────────── */
function MiniRadar({ scores }) {
  if (!scores) return null
  const cx = 40, cy = 40, r = 32
  const dims = ['execution', 'creativity', 'technical', 'social', 'riskTolerance', 'learning']
  const points = dims.map((dim, i) => {
    const angle = ((i * 60) - 90) * (Math.PI / 180)
    const rr = ((scores[dim] || 50) / 100) * r
    return `${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
      <polygon
        points={dims.map((_, i) => {
          const angle = ((i * 60) - 90) * (Math.PI / 180)
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
        }).join(' ')}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"
      />
      {[0.5, 0.75].map((lvl, li) => (
        <polygon
          key={li}
          points={dims.map((_, i) => {
            const angle = ((i * 60) - 90) * (Math.PI / 180)
            const rr = lvl * r
            return `${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`
          }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"
        />
      ))}
      <polygon points={points} fill="rgba(99,102,241,0.2)" stroke="#818CF8" strokeWidth="1" />
      {dims.map((dim, i) => {
        const angle = ((i * 60) - 90) * (Math.PI / 180)
        const rr = ((scores[dim] || 50) / 100) * r
        return (
          <circle key={i} cx={cx + rr * Math.cos(angle)} cy={cy + rr * Math.sin(angle)} r="1.5" fill="#F59E0B" />
        )
      })}
    </svg>
  )
}

export default function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const matches = location.state?.matches || []
  const scores = location.state?.scores || null

  const [showPayGate, setShowPayGate] = useState(false)
  const [selectedPlaybook, setSelectedPlaybook] = useState(null)
  const [unlockingSlug, setUnlockingSlug] = useState(null)

  const hasMatches = matches.length > 0

  const handleUnlock = (match) => {
    setSelectedPlaybook({
      slug: match.slug,
      title: match.title,
    })
    setUnlockingSlug(match.slug)
    setShowPayGate(true)
  }

  const handlePaymentSuccess = () => {
    setShowPayGate(false)
    if (selectedPlaybook) {
      navigate(`/playbook/${selectedPlaybook.slug}`)
    }
  }

  const handleClosePayGate = () => {
    setShowPayGate(false)
    setUnlockingSlug(null)
  }

  // Empty state
  if (!hasMatches) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-5">
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">暂无匹配结果</h2>
          <p className="text-sm text-gray-400 mb-6">
            请先完成测评，让我们了解你的偏好
          </p>
          <button
            onClick={() => navigate('/quiz')}
            className="btn-gold w-full py-3.5 text-base"
          >
            开始测评
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-sm text-gray-400
              hover:text-gray-300 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回能力画像
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400
              px-4 py-1.5 rounded-full text-sm font-medium mb-3 border border-emerald-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              分析完成
            </div>

            {/* Header with mini radar */}
            <div className="flex items-center justify-center gap-4 mb-1">
              {scores && <MiniRadar scores={scores} />}
              <div className="text-left">
                <h1 className="text-2xl font-extrabold text-white">
                  你的专属副业匹配报告
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  基于9维度分析，为你推荐 {matches.length} 个方向
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/quiz')}
              className="text-sm text-gold-400 hover:text-gold-300 transition-colors mt-2 inline-block"
            >
              重新测评
            </button>
          </div>
        </div>
      </div>

      {/* Match cards */}
      <div className="flex-1 px-5 pb-6">
        <div className="max-w-md mx-auto space-y-5">
          {matches.map((match, index) => (
            <MatchCard
              key={match.id || match.slug}
              match={match}
              index={index}
              onUnlock={handleUnlock}
              isUnlocking={unlockingSlug === match.slug}
            />
          ))}
        </div>

        {/* Bottom note */}
        <div className="max-w-md mx-auto mt-6 text-center">
          <p className="text-xs text-gray-500">
            以上匹配基于你的回答和AI深度分析生成
          </p>
        </div>
      </div>

      {/* Payment modal */}
      {showPayGate && selectedPlaybook && (
        <PayGate
          playbook={selectedPlaybook}
          onSuccess={handlePaymentSuccess}
          onClose={handleClosePayGate}
        />
      )}

      <div className="h-4 safe-bottom" />
    </div>
  )
}
