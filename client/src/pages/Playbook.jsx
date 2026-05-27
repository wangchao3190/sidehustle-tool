import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlaybook, submitFeedback, ApiError } from '../api'

/* ── Markdown renderer ─────────────────────────────── */
function renderContent(text) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-white mt-8 mb-3">
          {parseInline(line.slice(3))}
        </h2>
      )
      i++
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-gray-200 mt-6 mb-2">
          {parseInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }

    if (line.match(/^[\-\*]\s/)) {
      const listItems = []
      while (i < lines.length && lines[i].match(/^[\-\*]\s/)) {
        listItems.push(
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
            <span className="text-gold-400 mt-0.5 flex-shrink-0">&bull;</span>
            <span>{parseInline(lines[i].replace(/^[\-\*]\s/, ''))}</span>
          </li>
        )
        i++
      }
      elements.push(
        <ul key={`list-${i}`} className="space-y-2 mt-2 mb-4 pl-1">
          {listItems}
        </ul>
      )
      continue
    }

    if (line.match(/^\d+[\.\)]\s/)) {
      const listItems = []
      while (i < lines.length && lines[i].match(/^\d+[\.\)]\s/)) {
        const num = lines[i].match(/^(\d+)/)[1]
        listItems.push(
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
            <span className="text-gold-400 font-medium min-w-[20px] flex-shrink-0">{num}.</span>
            <span>{parseInline(lines[i].replace(/^\d+[\.\)]\s/, ''))}</span>
          </li>
        )
        i++
      }
      elements.push(
        <ol key={`olist-${i}`} className="space-y-2 mt-2 mb-4">
          {listItems}
        </ol>
      )
      continue
    }

    if (line.trim() === '') { i++; continue }

    elements.push(
      <p key={i} className="text-sm text-gray-300 leading-relaxed mb-3">
        {parseInline(line)}
      </p>
    )
    i++
  }

  return elements
}

function parseInline(text) {
  if (!text) return text
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }
    const linkParts = part.split(/(\[.*?\]\(.*?\))/g)
    return linkParts.map((lp, lIdx) => {
      const linkMatch = lp.match(/\[(.*?)\]\((.*?)\)/)
      if (linkMatch) {
        return (
          <a key={`${idx}-${lIdx}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
            className="text-gold-400 underline decoration-gold-400/30 hover:decoration-gold-400">
            {linkMatch[1]}
          </a>
        )
      }
      return lp
    })
  })
}

/* ── Section icons ─────────────────────────────────── */
const SECTION_ICONS = {
  '30天启动计划': '📅',
  '真实收入参考': '💰',
  '需要的工具': '🛠️',
  '常见错误': '⚠️',
  '竞争情况': '📊',
  '第一件事': '⚡',
}

function getSectionIcon(title) {
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (title.includes(key)) return icon
  }
  return '📄'
}

/* ── Playbook Page ─────────────────────────────────── */
export default function Playbook() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [playbook, setPlaybook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const loadPlaybook = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPlaybook(slug)
      setPlaybook(data.playbook)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 403 ? '请先解锁后再查看完整内容' : err.message)
      } else {
        setError('加载失败，请检查网络后重试')
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { loadPlaybook() }, [loadPlaybook])

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) return
    setSubmittingFeedback(true)
    try {
      await submitFeedback(playbook?.id || slug, feedbackRating, feedbackComment)
      setFeedbackSubmitted(true)
    } catch {
      setFeedbackSubmitted(true)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  /* ── Loading ──────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
          <p className="text-sm text-gray-400">加载手册内容...</p>
        </div>
      </div>
    )
  }

  /* ── Error ────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-5">
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">无法查看内容</h2>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button onClick={loadPlaybook} className="btn-gold flex-1 py-3 text-sm">重试</button>
            <button onClick={() => navigate('/')} className="btn-gold-outline flex-1 py-3 text-sm">返回首页</button>
          </div>
        </div>
      </div>
    )
  }

  if (!playbook) return null

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b border-white/5" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="px-5 pt-6 pb-3">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </button>
            <h1 className="text-xl font-bold text-white">{playbook.title}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        <div className="max-w-md mx-auto">
          {/* Trust banner */}
          <div className="glass-card p-4 mb-6 animate-fade-in-down">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gold-400">
                <span>🔄</span>
                <span className="font-medium">本月已更新</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>💡</span>
                <span>基于50+真实案例</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>🛠️</span>
                <span>包含工具清单</span>
              </div>
            </div>
          </div>

          {/* Sections */}
          {playbook.sections && playbook.sections.length > 0 ? (
            <div className="space-y-6">
              {playbook.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center
                      text-lg border border-gold-500/20">
                      {getSectionIcon(section.title)}
                    </div>
                    <h2 className="text-lg font-bold text-white">{section.title}</h2>
                  </div>

                  {/* Section content */}
                  <div className="glass-card p-5">
                    {renderContent(section.content)}
                  </div>
                </div>
              ))}
            </div>
          ) : playbook.content ? (
            <div className="glass-card p-5">
              {renderContent(playbook.content)}
            </div>
          ) : null}

          {/* Feedback widget */}
          <div className="mt-12 pt-8 border-t border-white/5">
            {feedbackSubmitted ? (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center
                  mx-auto mb-4 border border-emerald-500/20">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-white">感谢你的反馈！</p>
                <p className="text-sm text-gray-400 mt-1">我们会持续优化手册内容</p>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-white text-center mb-4">
                  这份手册对你有用吗？
                </h3>
                <div className="flex items-center justify-center gap-2 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="w-12 h-12 flex items-center justify-center
                        rounded-xl transition-all duration-200"
                    >
                      <svg
                        className={`w-9 h-9 transition-colors ${
                          star <= feedbackRating
                            ? 'text-gold-400'
                            : 'text-gray-600 hover:text-gray-500'
                        }`}
                        fill={star <= feedbackRating ? 'currentColor' : 'none'}
                        stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {feedbackRating > 0 && (
                  <div className="animate-fade-in">
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="还有什么想说的？（选填）"
                      rows={3}
                      className="w-full p-4 rounded-xl border-2 border-white/10 bg-white/[0.03]
                        focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20
                        outline-none transition-all resize-none text-sm text-white
                        placeholder:text-gray-500"
                    />
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={submittingFeedback}
                      className={`w-full mt-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        submittingFeedback
                          ? 'bg-white/[0.05] text-gray-500 cursor-not-allowed'
                          : 'btn-gold'
                      }`}
                    >
                      {submittingFeedback ? '提交中...' : '提交反馈'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-4 safe-bottom" />
    </div>
  )
}
