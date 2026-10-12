import type { RpAspect } from './types'

const MAT_ASPECTS: RpAspect[] = ['plan', 'sheet', 'masterplan']

/** Does this aspect sit on the white drawing mat by default? */
export function isMatAspect(aspect: RpAspect): boolean {
  return MAT_ASPECTS.includes(aspect)
}

/** Class list for a frame of a given aspect. Mat aspects add rp-frame--mat. */
export function frameClass(aspect: RpAspect = 'aerial', mat?: boolean): string {
  const useMat = mat ?? isMatAspect(aspect)
  return ['rp-frame', `rp-frame--${aspect}`, useMat ? 'rp-frame--mat' : ''].filter(Boolean).join(' ')
}

export interface RpPairItem { aspect: RpAspect; mat?: boolean }

/**
 * Aspects for a 2-up gallery, so both frames of a pair share one height.
 * Items from `from` on are paired (from, from+1), (from+2, from+3)…; `tail`
 * is the aspect of a trailing cell (an "Add images" plate) that pairs with an
 * odd last item. A mixed pair takes the photo's aspect: drawings keep their
 * white mat and object-fit: contain, so a plan sheet stays whole, just
 * smaller, instead of leaving a ragged row beside a 16:10 render.
 */
export function pairedAspects(items: RpPairItem[], from = 0, tail?: RpAspect): RpAspect[] {
  const out = items.map(i => i.aspect)
  for (let a = from; a < items.length; a += 2) {
    const b = a + 1
    const A = items[a]
    const B: RpPairItem | undefined = b < items.length ? items[b] : tail ? { aspect: tail, mat: false } : undefined
    if (!B || A.aspect === B.aspect) continue
    const aMat = A.mat ?? isMatAspect(A.aspect)
    const bMat = B.mat ?? isMatAspect(B.aspect)
    const shared = !aMat ? A.aspect : !bMat ? B.aspect : A.aspect
    out[a] = shared
    if (b < items.length) out[b] = shared
  }
  return out
}
