import { SECTION_HERO } from '@/lib/project-imagery'
import { sectionEyebrow } from '@/lib/sections'
import { RpPage, RpPageHeader, RpTag, RpFilm, RpCardGrid, RpCard, RpNote } from '@/components/rp'

const CHANNELS = [
  { num: '01', title: 'Owner threads', line: 'Decisions with the owner, kept with the package' },
  { num: '02', title: 'Vendor RFIs', line: 'Questions and answers, tied to drawings' },
  { num: '03', title: 'Member updates', line: 'Build news for founding members' },
]

export default function CommsComingSoon() {
  return (
    <RpPage>
      <RpPageHeader
        eyebrow={sectionEyebrow('comms')}
        tags={<RpTag tone="gold">Soon</RpTag>}
        title="Messaging is on the way"
        line="One thread for the build: owner, owner's rep, vendors and members."
      />
      <RpFilm
        {...SECTION_HERO.comms}
        aspect="banner"
        caption={undefined}
        line="One source. Many channels."
        meta="Working line · in design"
      />
      <RpCardGrid max={3}>
        {CHANNELS.map(c => (
          <RpCard key={c.num} num={c.num} title={c.title} line={c.line} />
        ))}
      </RpCardGrid>
      <RpNote>Messaging is not live yet. Alerts and briefs carry the build&apos;s updates for now.</RpNote>
    </RpPage>
  )
}
