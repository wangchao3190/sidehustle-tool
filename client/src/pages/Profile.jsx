import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { submitQuiz, ApiError } from '../api'

/* ── Radar score computation (100% client-side) ───── */
function computeScores(answers) {
  const q1 = answers.q1 || ''
  const q2 = answers.q2 || ''
  const q3 = answers.q3 || ''
  const q4 = answers.q4 || ''
  const q5 = answers.q5 || ''
  const q7 = answers.q7 || ''
  const q8 = answers.q8 || ''
  const q9 = answers.q9 || ''

  const lookup = (map, key, fallback = 82) => (map[key] !== undefined ? map[key] : fallback)

  const hasQ9 = (val) => q9.split(',').includes(val)
  const minQ9Score = (map, fallback = 82) => {
    const vals = q9.split(',').filter(Boolean)
    if (vals.length === 0) return fallback
    return Math.min(...vals.map(v => lookup(map, v, fallback)))
  }

  // 执行力
  const q2Score = lookup({ gt2h: 95, '1-2h': 85, lt1h: 75, irregular: 78 }, q2)
  const q7Score = lookup({ immediate: 93, '1-3month': 85, 'half-year': 78 }, q7)
  const execution = Math.round((q2Score + q7Score) / 2)

  // 创造力
  const q1Creative = lookup({ creative: 95, data: 80, people: 82, tech: 75 }, q1)
  const q4Creative = lookup({ explore: 93, depends: 82, sop: 75 }, q4)
  const creativity = Math.round((q1Creative + q4Creative) / 2)

  // 技术力
  const q1Tech = lookup({ tech: 95, data: 85, creative: 78, people: 75 }, q1)
  const q3Tech = lookup({ desktop: 90, both: 82, mobile: 75 }, q3)
  const technical = Math.round((q1Tech + q3Tech) / 2)

  // 社交力
  const q1Social = lookup({ people: 95, creative: 82, data: 78, tech: 75 }, q1)
  let q9SocialMod = 0
  if (hasQ9('privacy')) q9SocialMod -= 10
  if (hasQ9('scam')) q9SocialMod -= 5
  if (hasQ9('no-traffic')) q9SocialMod -= 5
  const social = Math.min(100, Math.max(75, Math.round(q1Social + q9SocialMod)))

  // 风险承受
  const q5Risk = lookup({ gt2000: 93, '500-2000': 85, lt500: 78, '0': 75 }, q5)
  const q9Risk = minQ9Score({ scam: 75, 'waste-time': 76, 'no-profit': 76 }, 85)
  const riskTolerance = Math.min(100, Math.max(75, Math.round((q5Risk + q9Risk) / 2)))

  // 学习力
  const q4Learn = lookup({ explore: 95, depends: 85, sop: 78 }, q4)
  const q8Learn = lookup({ success: 95, tried: 85, none: 78 }, q8)
  const learning = Math.round((q4Learn + q8Learn) / 2)

  const floor = (v) => Math.max(75, v)
  return {
    execution: floor(execution),
    creativity: floor(creativity),
    technical: floor(technical),
    social: floor(social),
    riskTolerance: floor(riskTolerance),
    learning: floor(learning),
  }
}

/* ── Hexagon point math ────────────────────────────── */
function hexPoints(cx, cy, radius, scores) {
  const dims = ['execution', 'creativity', 'technical', 'social', 'riskTolerance', 'learning']
  return dims.map((dim, i) => {
    const angle = ((i * 60) - 90) * (Math.PI / 180)
    const r = (scores[dim] / 100) * radius
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')
}

/* ── Labels & interpretations ─────────────────────── */
const DIMENSIONS = [
  { key: 'execution', label: '执行力', angle: -90 },
  { key: 'creativity', label: '创造力', angle: -30 },
  { key: 'technical', label: '技术力', angle: 30 },
  { key: 'social', label: '社交力', angle: 90 },
  { key: 'riskTolerance', label: '风险承受', angle: 150 },
  { key: 'learning', label: '学习力', angle: 210 },
]

function interpretScores(scores) {
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const strengths = top.slice(0, 2)
  const weakness = top[top.length - 1]

  const strengthLabels = {
    execution: '执行力强',
    creativity: '创造力出色',
    technical: '技术功底好',
    social: '社交能力强',
    riskTolerance: '敢于承担风险',
    learning: '学习能力出众',
  }

  const weaknessLabels = {
    execution: '执行力有待提升',
    creativity: '创造力可以加强',
    technical: '技术基础较薄弱',
    social: '社交方面需更多尝试',
    riskTolerance: '风险偏好偏保守',
    learning: '学习适应需要更多时间',
  }

  return {
    strengths: strengths.map(([k]) => strengthLabels[k] || k),
    weakness: weaknessLabels[weakness[0]] || '',
    summary:
      `你的核心优势在于${strengths.map(([k]) => strengthLabels[k]).join('和')}。` +
      `建议优先选择能发挥你${strengths[0][1] > 80 ? '这些' : '核心'}优势的副业方向，` +
      `同时注意${weaknessLabels[weakness[0]]}，在实践中逐步提升。`,
  }
}

/* ── RadarChart SVG component ──────────────────────── */
function RadarChart({ scores, revealed }) {
  const cx = 150, cy = 150, r = 110
  const levels = [0.25, 0.5, 0.75, 1]

  const labelPos = (i) => {
    const angle = ((i * 60) - 90) * (Math.PI / 180)
    const lr = r + 32
    return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle) }
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
      {/* Background grids */}
      {levels.map((lvl, li) => {
        const pts = DIMENSIONS.map((_, i) => {
          const angle = ((i * 60) - 90) * (Math.PI / 180)
          const rr = lvl * r
          return `${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`
        }).join(' ')
        return (
          <polygon
            key={li}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            className={revealed ? 'radar-ring revealed' : 'radar-ring'}
            style={{ animationDelay: `${li * 0.2}s` }}
          />
        )
      })}

      {/* Axis lines */}
      {DIMENSIONS.map((_, i) => {
        const angle = ((i * 60) - 90) * (Math.PI / 180)
        const ex = cx + r * Math.cos(angle)
        const ey = cy + r * Math.sin(angle)
        return (
          <line
            key={i}
            x1={cx} y1={cy} x2={ex} y2={ey}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        )
      })}

      {/* Data polygon */}
      {revealed && (
        <polygon
          points={hexPoints(cx, cy, r, scores)}
          fill="rgba(99, 102, 241, 0.15)"
          stroke="#818CF8"
          strokeWidth="2"
          className="radar-polygon"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      )}

      {/* Data points */}
      {revealed && DIMENSIONS.map((dim, i) => {
        const angle = ((i * 60) - 90) * (Math.PI / 180)
        const rr = (scores[dim.key] / 100) * r
        const px = cx + rr * Math.cos(angle)
        const py = cy + rr * Math.sin(angle)
        return (
          <circle
            key={i}
            cx={px} cy={py} r="4"
            fill="#F59E0B"
            stroke="#0F172A"
            strokeWidth="1.5"
            className="radar-polygon"
          />
        )
      })}

      {/* Labels */}
      {DIMENSIONS.map((dim, i) => {
        const pos = labelPos(i)
        return (
          <text
            key={i}
            x={pos.x} y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={revealed ? '#94A3B8' : 'rgba(148,163,184,0.3)'}
            fontSize="13"
            fontWeight="600"
            style={{ transition: 'fill 0.6s ease' }}
          >
            {dim.label}
          </text>
        )
      })}

      {/* Score labels at each point */}
      {revealed && DIMENSIONS.map((dim, i) => {
        const angle = ((i * 60) - 90) * (Math.PI / 180)
        const rr = Math.min((scores[dim.key] / 100) * r + 16, r + 24)
        const sx = cx + rr * Math.cos(angle)
        const sy = cy + rr * Math.sin(angle)
        return (
          <text
            key={`s-${i}`}
            x={sx} y={sy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#F59E0B"
            fontSize="11"
            fontWeight="700"
            className="animate-fade-in"
            style={{ animationDelay: '0.6s' }}
          >
            {scores[dim.key]}
          </text>
        )
      })}
    </svg>
  )
}

/* ── Profile Page Component ───────────────────────── */
export default function Profile() {
  const navigate = useNavigate()
  const location = useLocation()

  // Primary source: sessionStorage (more reliable than router state)
  const [rawAnswers, setRawAnswers] = useState(() => {
    // Try sessionStorage first
    const stored = sessionStorage.getItem('quizAnswers')
    if (stored) {
      try { return JSON.parse(stored) } catch (e) { /* ignore */ }
    }
    // Fallback to router state
    return location.state?.answers || null
  })

  const [phase, setPhase] = useState('loading')
  const [scores, setScores] = useState(null)
  const [interpretation, setInterpretation] = useState(null)
  const [matches, setMatches] = useState(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [error, setError] = useState('')
  const apiCalled = useRef(false)

  // Redirect if no answers
  useEffect(() => {
    if (!rawAnswers || Object.keys(rawAnswers).length < 5) {
      navigate('/quiz', { replace: true })
      return
    }

    // We have answers: compute scores and start the flow
    const s = computeScores(rawAnswers)
    setScores(s)
    setInterpretation(interpretScores(s))

    if (!apiCalled.current) {
      apiCalled.current = true
      setApiLoading(true)
      submitQuiz(rawAnswers)
        .then((data) => setMatches(data.matches))
        .catch((err) => {
          if (err instanceof ApiError) setError(err.message)
          else setError('分析失败，请检查网络后重试')
        })
        .finally(() => setApiLoading(false))
    }

    // Reveal chart after 1.5s
    const timer = setTimeout(() => setPhase('reveal'), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleViewResults = () => {
    if (matches) {
      sessionStorage.removeItem('quizAnswers')
      navigate('/result', { state: { matches, scores } })
    }
  }

  const handleRetry = () => {
    setError('')
    setMatches(null)
    setApiLoading(false)
    apiCalled.current = false
  }

  // Don't render if no answers (redirect will handle it via useEffect)
  if (!rawAnswers || Object.keys(rawAnswers).length < 5) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="flex gap-1 justify-center mb-4">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
          <p className="text-sm text-gray-400">正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <div className="flex-1 px-5 py-8">
        <div className="max-w-md mx-auto">

          {/* ── Header ─────────────────────────── */}
          <div className="text-center mb-6">
            {phase === 'loading' && (
              <>
                <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-gold-500/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gold-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                      <span className="loading-dot" />
                      <span className="loading-dot" />
                      <span className="loading-dot" />
                    </div>
                  </div>
                </div>
                <h1 className="text-xl font-extrabold text-white mb-3 animate-fade-in-up">
                  正在生成你的能力画像...
                </h1>
                <p className="text-sm text-gray-400 mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                  AI正在从9个维度深度分析你的优势与特质
                </p>
                <div className="space-y-2.5 max-w-[260px] mx-auto">
                  {[
                    '分析工作偏好与性格特质...',
                    '评估技能匹配度与成长潜力...',
                    '计算风险偏好与时间弹性...',
                    '生成个性化能力画像...',
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm text-gray-500 animate-fade-in"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    >
                      <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-gold-500/60" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </>
            )}

            {phase === 'reveal' && scores && (
              <>
                <h1 className="text-xl font-extrabold text-white mb-1 animate-fade-in-down">
                  你的能力画像
                </h1>
                <p className="text-sm text-gray-400 mb-6 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                  基于你的测评回答，以下是你的6维能力分析
                </p>
              </>
            )}
          </div>

          {/* ── Radar Chart ────────────────────── */}
          {scores && (
            <div className="glass-card p-4 mb-6 animate-fade-in-up">
              <RadarChart scores={scores} revealed={phase === 'reveal'} />
            </div>
          )}

          {/* ── Interpretation ─────────────────── */}
          {phase === 'reveal' && interpretation && (
            <div className="glass-card p-5 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-base font-bold text-white mb-3">能力分析总结</h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                {interpretation.summary}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-xs text-emerald-400 font-semibold mb-1">你的优势</p>
                  {interpretation.strengths.map((s, i) => (
                    <p key={i} className="text-sm text-emerald-300">{s}</p>
                  ))}
                </div>
                <div className="bg-gold-500/5 border border-gold-500/20 rounded-xl p-3">
                  <p className="text-xs text-gold-400 font-semibold mb-1">可以提升</p>
                  <p className="text-sm text-gold-300">{interpretation.weakness}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Error ──────────────────────────── */}
          {error && (
            <div className="glass-card p-5 mb-6 text-center animate-fade-in">
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="btn-gold-outline px-6 py-2.5 text-sm"
              >
                重试
              </button>
            </div>
          )}

          {/* ── CTA Button ─────────────────────── */}
          {phase === 'reveal' && (
            <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <button
                onClick={handleViewResults}
                disabled={!matches && !error}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  matches
                    ? 'btn-gold animate-glow'
                    : error
                    ? 'btn-gold-outline'
                    : 'bg-white/[0.05] text-gray-500 cursor-not-allowed border border-white/10'
                }`}
              >
                {matches ? '查看匹配结果' : error ? '重新获取结果' : apiLoading ? 'AI正在分析匹配中...' : '正在获取匹配结果...'}
              </button>
              {!matches && !error && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">
                查看AI为你推荐的3个最佳副业方向
              </p>
            </div>
          )}

        </div>
      </div>

      <div className="h-4 safe-bottom" />
    </div>
  )
}
