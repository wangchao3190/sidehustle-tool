import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QuizStep from '../components/QuizStep'

const QUESTIONS = [
  {
    id: 'q1',
    text: '你更喜欢哪种工作方式？',
    type: 'choice',
    options: [
      { value: 'data', label: '跟数据/文字打交道' },
      { value: 'people', label: '跟人打交道' },
      { value: 'tech', label: '跟工具/技术打交道' },
      { value: 'creative', label: '做创意类工作' },
    ],
  },
  {
    id: 'q2',
    text: '每天能挤出多少自由时间？',
    type: 'choice',
    options: [
      { value: 'lt1h', label: '1小时以内' },
      { value: '1-2h', label: '1-2小时' },
      { value: 'gt2h', label: '2小时以上' },
      { value: 'irregular', label: '时间不固定，看情况' },
    ],
  },
  {
    id: 'q3',
    text: '你更习惯用手机操作还是电脑？',
    type: 'choice',
    options: [
      { value: 'mobile', label: '主要以手机为主' },
      { value: 'desktop', label: '主要以电脑为主' },
      { value: 'both', label: '两者都行' },
    ],
  },
  {
    id: 'q4',
    text: '你偏好有确定流程的事，还是喜欢自己摸索？',
    type: 'choice',
    options: [
      { value: 'sop', label: '给我SOP，我跟着做就行' },
      { value: 'explore', label: '我喜欢自己研究探索' },
      { value: 'depends', label: '看情况' },
    ],
  },
  {
    id: 'q5',
    text: '你愿意为副业启动投入多少钱？',
    type: 'choice',
    options: [
      { value: '0', label: '0元，纯时间投入' },
      { value: 'lt500', label: '500元以内' },
      { value: '500-2000', label: '500-2000元' },
      { value: 'gt2000', label: '2000元以上' },
    ],
  },
  {
    id: 'q7',
    text: '你希望多久看到副业回报？',
    type: 'choice',
    options: [
      { value: 'immediate', label: '最好马上见效，越快越好' },
      { value: '1-3month', label: '1-3个月内开始有收入就行' },
      { value: 'half-year', label: '半年以上也没关系，重在积累' },
    ],
  },
  {
    id: 'q8',
    text: '你之前有过副业或创业经历吗？',
    type: 'choice',
    options: [
      { value: 'none', label: '完全零经验，第一次尝试' },
      { value: 'tried', label: '尝试过但没坚持下来' },
      { value: 'success', label: '有过成功经验，赚到过钱' },
    ],
  },
  {
    id: 'q9',
    text: '开始副业，你最担心什么？（可多选）',
    type: 'multichoice',
    maxSelect: 3,
    options: [
      { value: 'scam', label: '怕被骗，交钱后被坑' },
      { value: 'waste-time', label: '怕浪费时间，最后没结果' },
      { value: 'no-profit', label: '怕赚不到钱，白忙活' },
      { value: 'no-traffic', label: '怕不会推广获客，没人买单' },
      { value: 'privacy', label: '怕被熟人同事发现' },
    ],
  },
  {
    id: 'q6',
    text: '有什么特别擅长或感兴趣的领域？（选填）',
    type: 'text',
    options: [],
  },
]

export default function Quiz() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [direction, setDirection] = useState(1)
  const answersRef = useRef({})

  const question = QUESTIONS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === QUESTIONS.length - 1
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100

  const handleChange = (questionId, value) => {
    const next = { ...answersRef.current, [questionId]: value }
    answersRef.current = next
    setAnswers(next)
  }

  const handleNext = () => {
    if (isLast) {
      sessionStorage.setItem('quizAnswers', JSON.stringify(answersRef.current))
      navigate('/profile', { state: { answers: answersRef.current } })
      return
    }
    setDirection(1)
    setCurrentStep((s) => Math.min(s + 1, QUESTIONS.length - 1))
  }

  const handlePrev = () => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="max-w-md mx-auto">
          {/* Back button */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 flex items-center justify-center rounded-xl
                hover:bg-white/[0.05] transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-400 font-medium">副业方向测评</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full progress-bar-fill shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              style={{ width: `${Math.max(progress, (1 / QUESTIONS.length) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">
            {currentStep + 1} / {QUESTIONS.length}
          </p>
        </div>
      </div>

      {/* Quiz content */}
      <div className="flex-1 px-5 py-4">
        <div className="max-w-lg mx-auto">
          <QuizStep
            key={`${currentStep}-${direction}`}
            question={question}
            value={answers[question.id] || ''}
            onChange={handleChange}
            onNext={handleNext}
            onPrev={handlePrev}
            isFirst={isFirst}
            isLast={isLast}
            step={currentStep + 1}
            totalSteps={QUESTIONS.length}
          />
        </div>
      </div>

      {/* Bottom safe area */}
      <div className="h-4 safe-bottom" />
    </div>
  )
}
