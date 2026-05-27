import { useState, useEffect, useRef } from 'react'
import { createPayment, getPaymentStatus, ApiError } from '../api'

export default function PayGate({ playbook, onSuccess, onClose }) {
  const [step, setStep] = useState('confirm')
  const [orderId, setOrderId] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [paymentUrl, setPaymentUrl] = useState(null)
  const [error, setError] = useState('')
  const pollingRef = useRef(null)

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const handleCreatePayment = async () => {
    setStep('qr')
    setError('')
    try {
      const data = await createPayment(playbook.slug)
      setOrderId(data.orderId)
      setQrCode(data.qrCode || null)
      setPaymentUrl(data.paymentUrl || null)
      startPolling(data.orderId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '创建支付失败，请重试')
      setStep('error')
    }
  }

  const startPolling = (orderId) => {
    pollingRef.current = setInterval(async () => {
      try {
        const data = await getPaymentStatus(orderId)
        if (data.status === 'paid') {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          onSuccess()
        } else if (data.status === 'failed') {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          setError('支付未成功，请重试')
          setStep('error')
        }
      } catch {
        // Silent retry
      }
    }, 3000)
  }

  const handleRetry = () => {
    setStep('confirm')
    setError('')
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto
        animate-fade-in-up shadow-2xl safe-bottom"
        style={{ background: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 pt-6 px-6 pb-4 border-b border-white/8"
          style={{ background: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">
              {step === 'confirm' && '确认解锁'}
              {step === 'qr' && '扫码支付'}
              {step === 'error' && '支付提示'}
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full
                hover:bg-white/[0.05] transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 truncate">{playbook.title}</p>
        </div>

        <div className="p-6">
          {/* ── Confirm step ─────────────────── */}
          {step === 'confirm' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center
                mx-auto mb-5 border border-gold-500/20">
                <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              <p className="text-gray-300 mb-3 font-medium">解锁后可查看完整实操手册，包括：</p>
              <div className="grid grid-cols-2 gap-2 mb-6 text-left">
                {[
                  '📅 30天启动计划',
                  '💰 真实收入参考',
                  '🛠️ 工具平台推荐',
                  '⚠️ 避坑指南',
                  '📊 竞争分析',
                  '⚡ 今日行动清单',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gold-500/5 border border-gold-500/20 rounded-2xl p-5 mb-6">
                <p className="text-sm text-gray-400 mb-1">解锁价格</p>
                <p className="text-4xl font-extrabold text-gold-400">¥9.9</p>
                <p className="text-xs text-gray-500 mt-1">一次购买，永久查看，每月更新</p>
              </div>

              <button
                onClick={handleCreatePayment}
                className="btn-gold w-full py-3.5 text-base"
              >
                前往支付
              </button>

              <p className="text-xs text-gray-500 mt-3">
                支付遇到问题？联系客服获取帮助
              </p>
            </div>
          )}

          {/* ── QR / payment step ─────────────── */}
          {step === 'qr' && (
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-5 font-medium">
                请使用微信或支付宝扫码支付
              </p>

              <div className="bg-white rounded-2xl w-52 h-52 mx-auto mb-5
                flex items-center justify-center border border-white/10 p-3">
                {qrCode ? (
                  <img
                    src={qrCode}
                    alt="支付二维码"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <svg className="w-14 h-14 text-gray-300 mx-auto mb-2" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 4v1m6 11h2m-6 0h-2m4-5a4 4 0 00-8 0v1m8 0a4 4 0 01-8 0m8 0h2M6 12h2m-2 4h2" />
                    </svg>
                    <p className="text-xs text-gray-400">二维码加载中...</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="text-sm text-gray-400 ml-2">等待支付确认...</span>
              </div>

              <p className="text-3xl font-extrabold text-gold-400 mb-5">¥9.9</p>

              {paymentUrl && (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 border-2 border-gold-500/50
                    text-gold-400 font-semibold rounded-xl
                    active:bg-gold-500/10 transition-colors text-sm mb-3"
                >
                  在浏览器中打开支付页面
                </a>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 text-gray-500 text-sm
                  hover:text-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          )}

          {/* ── Error step ──────────────────── */}
          {step === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center
                mx-auto mb-5 border border-red-500/20">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">支付遇到问题</p>
              <p className="text-sm text-gray-400 mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="btn-gold w-full py-3.5 text-base mb-3"
              >
                重新尝试
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-gray-500 text-sm hover:text-gray-300 transition-colors"
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
