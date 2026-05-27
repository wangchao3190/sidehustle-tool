import { useState, useEffect, useRef } from 'react'

const OPTION_ICONS = {
  q1: { 'data': '📊', 'people': '🤝', 'tech': '💻', 'creative': '🎨' },
  q2: { 'lt1h': '⏰', '1-2h': '⌚', 'gt2h': '🕐', 'irregular': '📋' },
  q3: { 'mobile': '📱', 'desktop': '🖥️', 'both': '💻📱' },
  q4: { 'sop': '📝', 'explore': '🔍', 'depends': '🤔' },
  q5: { '0': '💰', 'lt500': '💵', '500-2000': '💳', 'gt2000': '🏦' },
  q7: { 'immediate': '⚡', '1-3month': '📅', 'half-year': '🌱' },
  q8: { 'none': '🌱', 'tried': '🔄', 'success': '🏆' },
  q9: { 'scam': '⚠️', 'waste-time': '⏳', 'no-profit': '💸', 'no-traffic': '📢', 'privacy': '🔒' },
}

export default function QuizStep({
  question,
  value,
  onChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
  step,
  totalSteps,
}) {
  const [animKey, setAnimKey] = useState(0)
  const [selected, setSelected] = useState(value)
  const [multiSelected, setMultiSelected] = useState(value ? value.split(',') : [])
  const textInputRef = useRef(null)

  useEffect(() => {
    setAnimKey((k) => k + 1)
    setSelected(value)
    setMultiSelected(value ? value.split(',') : [])
  }, [question.id])

  useEffect(() => {
    if (question.type === 'text' && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [question.id, question.type])

  const handleSelect = (optionValue) => {
    setSelected(optionValue)
    onChange(question.id, optionValue)
    if (question.type !== 'text') {
      setTimeout(() => onNext(), 450)
    }
  }

  const handleMultiToggle = (optionValue) => {
    setMultiSelected((prev) => {
      if (prev.includes(optionValue)) {
        return prev.filter((v) => v !== optionValue)
      }
      if (prev.length >= (question.maxSelect || 3)) {
        return prev
      }
      return [...prev, optionValue]
    })
  }

  const handleMultiConfirm = () => {
    const value = multiSelected.join(',')
    onChange(question.id, value)
    setTimeout(() => onNext(), 300)
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    onChange(question.id, value || '')
    setTimeout(() => onNext(), 100)
  }

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onNext()
    }
  }

  return (
    <div className="w-full" key={animKey}>
      {/* Question header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-extrabold text-gold-400 bg-gold-500/10 px-3 py-1.5 rounded-lg border border-gold-500/20">
            Q{step}
          </span>
          <span className="text-xs text-gray-500">
            第 {step}/{totalSteps} 题
          </span>
          {question.type === 'multichoice' && (
            <span className="text-xs text-gold-400/70 ml-auto">
              最多选{question.maxSelect || 3}项
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-white mb-8 leading-relaxed">
          {question.text}
        </h2>
      </div>

      {/* Choice options */}
      {question.type === 'choice' && (
        <div className="space-y-3">
          {question.options.map((opt, index) => {
            const isSelected = selected === opt.value
            const emoji = (OPTION_ICONS[question.id] && OPTION_ICONS[question.id][opt.value]) || '●'
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`
                  option-btn w-full text-left p-5 rounded-2xl border-2
                  transition-all duration-300 animate-slide-in-right
                  ${isSelected
                    ? 'option-selected-glow bg-gold-500/5 border-gold-500'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }
                `}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-base transition-colors ${
                      isSelected ? 'text-gold-400 font-semibold' : 'text-gray-300'
                    }`}>
                      {opt.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-[#0F172A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Multichoice options */}
      {question.type === 'multichoice' && (
        <div className="space-y-3">
          {question.options.map((opt, index) => {
            const isSelected = multiSelected.includes(opt.value)
            const emoji = (OPTION_ICONS[question.id] && OPTION_ICONS[question.id][opt.value]) || '●'
            return (
              <button
                key={opt.value}
                onClick={() => handleMultiToggle(opt.value)}
                className={`
                  option-btn w-full text-left p-5 rounded-2xl border-2
                  transition-all duration-300 animate-slide-in-right
                  ${isSelected
                    ? 'option-selected-glow bg-gold-500/5 border-gold-500'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }
                `}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-base transition-colors ${
                      isSelected ? 'text-gold-400 font-semibold' : 'text-gray-300'
                    }`}>
                      {opt.label}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-gold-500 border-gold-500'
                      : 'border-white/20 bg-transparent'
                  }`}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-[#0F172A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {/* Confirm button for multichoice */}
          <div className="pt-4 animate-fade-in">
            <button
              onClick={handleMultiConfirm}
              className="btn-gold w-full py-3.5 text-base font-bold"
            >
              确认选择{multiSelected.length > 0 ? `（已选${multiSelected.length}项）` : '（可跳过）'}
            </button>
          </div>
        </div>
      )}

      {/* Text input */}
      {question.type === 'text' && (
        <div className="animate-slide-in-right">
          <textarea
            ref={textInputRef}
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            onKeyDown={handleTextKeyDown}
            placeholder="例如：写作、摄影、编程、手工、语言...（选填，不影响匹配）"
            rows={4}
            className="w-full p-4 rounded-2xl border-2 border-white/10 bg-white/[0.03]
              focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20
              outline-none transition-all resize-none text-base text-white
              placeholder:text-gray-500"
          />
          <button
            onClick={handleTextSubmit}
            className="btn-gold w-full py-3.5 text-base font-bold mt-4"
          >
            {isLast ? '查看能力画像' : '下一题'}
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            此题选填，不影响匹配结果
          </p>
        </div>
      )}

      {/* Navigation for choice questions */}
      {question.type === 'choice' && (
        <div className="flex items-center justify-between mt-8 animate-fade-in">
          {!isFirst ? (
            <button
              onClick={onPrev}
              className="px-5 py-3 text-gray-400 font-medium
                rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08]
                transition-colors text-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一题
            </button>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Navigation for multichoice questions */}
      {question.type === 'multichoice' && (
        <div className="flex items-center justify-between mt-6 animate-fade-in">
          {!isFirst ? (
            <button
              onClick={onPrev}
              className="px-5 py-3 text-gray-400 font-medium
                rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08]
                transition-colors text-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一题
            </button>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Hints */}
      {question.type === 'choice' && !value && (
        <p className="text-center text-xs text-gray-500 mt-4">
          点击选项自动进入下一题
        </p>
      )}
      {question.type === 'multichoice' && (
        <p className="text-center text-xs text-gray-500 mt-3">
          可跳过不选，表示没有特别顾虑
        </p>
      )}
    </div>
  )
}
