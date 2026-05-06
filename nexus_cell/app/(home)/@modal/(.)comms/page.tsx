import CommsComingSoon from '@/app/(modules)/comms/CommsComingSoon'
import SectionOverlay from '@/components/shared/SectionOverlay'

export default function CommsOverlay() {
  return (
    <SectionOverlay title="Comms" fullPageHref="/comms">
      <CommsComingSoon />
    </SectionOverlay>
  )
}
