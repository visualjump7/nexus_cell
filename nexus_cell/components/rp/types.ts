// Shared types for the Roaring Pines kit (components/rp).

/** Tag / meter / status tones. Gold = active or needs attention, green =
 *  complete or on track, blue = scheduled or informational, alert = overdue,
 *  urgent or over budget, dim = closed or archived. */
export type RpTone = 'neutral' | 'gold' | 'green' | 'blue' | 'alert' | 'dim'

/** Frame aspect ratios. plan | sheet | masterplan sit on the white drawing mat. */
export type RpAspect =
  | 'aerial'     // 16/10 photoreal aerials (default)
  | 'card'       // 16/10 card heroes
  | 'site'       // 3/2 site-model renders
  | 'wide'       // 16/9 entrance, homes, exterior models
  | 'photo'      // 7/4 merchandise
  | 'banner'     // 21/9 livery / project hero
  | 'film'       // 21/9 film still (object-position center 30%)
  | 'pano'       // 3/1 connected row
  | 'portrait'   // 4/5 floor-plan renders
  | 'layout'     // 1262/669 model layout views
  | 'square'     // 1/1
  | 'plan'       // 4/5 drawing on the white mat
  | 'sheet'      // 17/11 full drawing sheet on the white mat
  | 'masterplan' // 3/2 master plan sheet on the white mat

/** An image with its provenance. Spread into RpFigure (`{...img}`) or pass
 *  arrays to RpGallery / useRpLightbox. */
export interface RpImage {
  src: string
  /** Subject · detail, no full stop. */
  caption?: string
  alt?: string
  aspect?: RpAspect
  /** Frame badge, e.g. 'Phantom concept'. */
  badge?: string
  /** 'Aerial render', 'Site model', 'As issued', 'Your images', … Used as the lightbox prefix. */
  provenance?: string
  /** Right-hand caption qualifier, e.g. 'Representative view'. */
  qualifier?: string
  /** Larger source for the lightbox (drawings). */
  full?: string
  /** White drawing mat + contain (set by toRpImage for plan / sheet / masterplan). */
  mat?: boolean
  objectPosition?: string
}

export interface RpNavItem {
  num: string
  label: string
  href: string
  /** Gold count at the right of the row (falsy/0 hides it). */
  badge?: number
  /** Gold flag at the right of the row, e.g. 'Soon'. */
  flag?: string
  /** Extra path prefixes that also make this item current. */
  match?: string[]
}
