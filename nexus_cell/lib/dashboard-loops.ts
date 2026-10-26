// The four dashboard data loops: seamless 12 s, 1920×1080 H.264 MP4s rendered
// from the dashboard summary. Single source of truth for the player's tabs, the
// "Watch" links on the dashboard and the asset paths. The files live in
// public/demo/loops/<id>.mp4 and <id>.jpg (poster, the loop's hold frame) and
// are written by the loops' publish-to-app.sh, so the ids here must match it.
import type { RpLoopItem } from '@/components/rp'

export type DashboardLoopId = 'program' | 'draws' | 'money' | 'packages'

export interface DashboardLoop extends RpLoopItem {
  id: DashboardLoopId
  num: string
  /** The loop's on-screen headline. */
  title: string
}

/** Search param that holds the selected loop: /dashboard?loop=draws. */
export const LOOP_PARAM = 'loop'
/** Id of the dashboard section that holds the player. */
export const LOOP_ANCHOR = 'showcase'
export const DEFAULT_LOOP: DashboardLoopId = 'program'
/** The loops are a rendered snapshot of the figures on this date; the dashboard itself is live. */
export const DASHBOARD_LOOPS_AS_OF = '2026-10-26'

/** Every loop holds still and complete from 4.4 s to 9.4 s, and its poster is
 *  the frame at 6.6 s (the loops' shared timeline; render.js posterT). The
 *  player starts there and pauses there. Keep in step with the renders. */
const POSTER_AT = 6.6

const files = (id: DashboardLoopId) => ({ src: `/demo/loops/${id}.mp4`, poster: `/demo/loops/${id}.jpg`, posterAt: POSTER_AT })

export const DASHBOARD_LOOPS: DashboardLoop[] = [
  {
    id: 'program',
    num: '01',
    label: 'The program',
    title: 'Where the build stands',
    line: 'A $198.6M program across 50 packages is 36% spent, $71.9M to date, with $126.7M still to draw.',
    ...files('program'),
  },
  {
    id: 'draws',
    num: '02',
    label: 'Draws by month',
    title: 'The build is accelerating',
    line: 'Monthly draws grew from $1.3M in October 2025 to $12.3M in September 2026, $59.1M paid in 12 months.',
    ...files('draws'),
  },
  {
    id: 'money',
    num: '03',
    label: 'Where the money goes',
    title: 'Site work leads the spend',
    line: 'Of $83.2M billed, site work takes $26.6M (32%), ahead of garages, design and engineering, track and paddock, and the clubhouse.',
    ...files('money'),
  },
  {
    id: 'packages',
    num: '04',
    label: 'Package by package',
    title: '50 packages, one program',
    line: 'Of 50 packages, 43 are in build, 4 complete, 2 on hold and 1 archived; the 4 complete closed $378K (2.5%) over budget.',
    ...files('packages'),
  },
]

/** Props for an RpLoopLink ("Watch") that selects this loop and scrolls to the player. */
export function watchLoop(id: DashboardLoopId) {
  const loop = DASHBOARD_LOOPS.find(l => l.id === id)
  return { id, label: loop?.label ?? id, param: LOOP_PARAM, anchor: LOOP_ANCHOR }
}
