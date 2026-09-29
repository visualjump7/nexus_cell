import { BRAND } from '@/lib/brand'

export default function CommsComingSoon() {
  return (
    <div className="rp-panel relative overflow-hidden text-center py-16 px-6" style={{ isolation: 'isolate', minHeight: 320 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.pines} alt="" aria-hidden className="rp-pines rp-pines--foot" />
      <div className="w-12 h-12 mx-auto mb-5 border border-[#26292C] flex items-center justify-center">
        <svg className="w-6 h-6 text-[#9AA0A4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </div>
      <span className="rp-eyebrow block mb-3">Comms</span>
      <h2 className="rp-title mb-4">Messaging is coming soon</h2>
      <p className="rp-lede mx-auto">
        Threaded communication with the owner, the owner&apos;s rep and the CFO is coming soon. Until then, use Alerts for anything that needs action.
      </p>
    </div>
  )
}
