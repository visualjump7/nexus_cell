// Roaring Pines kit — import everything from '@/components/rp'.
// Server-safe modules have no directive; modules with hooks are 'use client'
// (RpTabs/RpUrlTabs, RpFigure, RpGallery, RpLightbox, RpModal, RpForm,
// RpSidebar/RpTopBar, RpFootNav, RpSectionNav, RpLoopPlayer/RpLoopLink). All of them can be rendered
// from server pages with serialisable props.

export type { RpTone, RpAspect, RpImage, RpNavItem } from './types'

// status + formatting + class constants + icons
export { STATUS, statusDef, statusTone, statusLabel } from './status'
export type { RpStatusKind, RpStatusDef } from './status'
export { fmtMoney, fmtMoneyFull, fmtPct, pad2, fmtDate, fmtRange, fmtTime, timeAgo, daysUntil, dot } from './format'
export { rpInputClass, rpSelectClass, rpTextareaClass, rpLabelClass, rpHintClass, rpErrorClass, rpCheckClass } from './form'
export * from './icons'
export { TONE_COLOR, TONE_TEXT } from './tones'
export { frameClass, isMatAspect, pairedAspects } from './frame'
export type { RpPairItem } from './frame'
export { activeNavIndex } from './nav'
export { pushEscapeLayer } from './escape'

// layout + text
export { RpPage } from './RpPage'
export { RpPageHeader } from './RpPageHeader'
export type { RpPageHeaderProps } from './RpPageHeader'
export { RpEyebrow, RpTitle, RpLede, RpCapNum, RpCounter } from './RpText'
export { RpSubhead } from './RpSubhead'
export type { RpSubheadProps } from './RpSubhead'
export { RpGroup, RpGroupHead } from './RpGroup'
export type { RpGroupHeadProps } from './RpGroup'
export { RpRule, RpNote, RpSource } from './RpRule'

// tabs + chips
export { RpTabs, RpUrlTabs } from './RpTabs'
export type { RpTabItem, RpTabsProps, RpUrlTabsProps } from './RpTabs'
export { RpTabLinks } from './RpTabLinks'
export type { RpTabLinksProps } from './RpTabLinks'
export { RpChips } from './RpChips'
export type { RpChipItem, RpChipsProps } from './RpChips'

// figures + tags
export { RpStat, RpStatStrip } from './RpStat'
export type { RpStatProps, RpStatStripProps } from './RpStat'
export { RpMeter } from './RpMeter'
export type { RpMeterProps } from './RpMeter'
export { RpTag, RpBadge, RpStatus, RpPriority } from './RpTag'
export type { RpTagProps, RpStatusProps } from './RpTag'

// lists, cards, tables
export { RpList, RpRow } from './RpList'
export type { RpRowProps } from './RpList'
export { RpCardGrid, RpCard, RpBox } from './RpCard'
export type { RpCardGridProps, RpCardProps, RpBoxProps } from './RpCard'
export { RpTable, RpKV } from './RpTable'
export type { RpTableProps, RpKVItem } from './RpTable'

// imagery
export { RpFigure } from './RpFigure'
export type { RpFigureProps } from './RpFigure'
export { RpGallery } from './RpGallery'
export type { RpGalleryProps } from './RpGallery'
export { RpLightbox, useRpLightbox, lightboxCaption } from './RpLightbox'
export type { RpLightboxProps } from './RpLightbox'
export { RpPending } from './RpPending'
export type { RpPendingProps } from './RpPending'
export { RpFilm } from './RpFilm'
export type { RpFilmProps } from './RpFilm'
export { RpLoopPlayer, RpLoopLink } from './RpLoopPlayer'
export type { RpLoopItem, RpLoopPlayerProps, RpLoopLinkProps } from './RpLoopPlayer'
export { RpPines } from './RpPines'
export type { RpPinesPlacement } from './RpPines'

// actions + forms + overlays
export { RpButton } from './RpButton'
export type { RpButtonProps, RpButtonVariant } from './RpButton'
export { RpModal } from './RpModal'
export type { RpModalProps } from './RpModal'
export { RpField, RpInput, RpSelect, RpTextarea, RpCheck, RpFormGrid } from './RpForm'
export type { RpFieldProps, RpInputProps, RpSelectProps, RpTextareaProps, RpCheckProps } from './RpForm'
export { RpFilterBar } from './RpFilterBar'
export { RpEmpty, RpLoading } from './RpEmpty'
export type { RpEmptyProps, RpLoadingProps } from './RpEmpty'

// shell
export { RpSidebar, RpTopBar } from './RpSidebar'
export type { RpSidebarProps, RpTopBarProps, RpBrand } from './RpSidebar'
export { RpFootNav } from './RpFootNav'
export { RpSectionNav } from './RpSectionNav'
export type { RpSectionNavItem, RpSectionNavProps } from './RpSectionNav'

// charts
export { RP_CHART, RpChartFrame, RpLegend, RpBarList } from './chart'
export type { RpChartFrameProps, RpLegendItem, RpBarListItem, RpBarListProps } from './chart'
