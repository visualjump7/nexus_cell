// Demo branding. Swap these (and the tokens in globals.css / tailwind.config.ts)
// to re-skin the app for another client.
export const BRAND = {
  name: 'Roaring Pines',
  fullName: 'Roaring Pines Motor Club',
  shortName: 'Roaring Pines',
  subName: 'Motor Club',
  tagline: 'Development portal',
  location: 'Florida',
  status: 'Under construction',
  assistantName: 'Nexus',
  badge: '/brand/badge-satin-aluminum.svg',
  badgeAlt: '/brand/badge-polished-steel.svg',
  mark: '/brand/mark-gold.svg',
  pines: '/brand/pines-paired.svg',
  heroImage: '/demo/site/site-full-hero.jpg',
  masterplan: '/demo/plans/masterplan-v5.jpg',
  colors: {
    gold: '#CDA14B',
    blue: '#3989CB',
    green: '#A4CC5C',
    text: '#F5F5F5',
    line: '#1F1F1F',
    bg: '#0A0B0C',
    panel: '#0E0F11',
    surface: '#141618',
    muted: '#9AA0A4',
    dim: '#6E7578',
  },
  // Categorical chart order: gold, blue, green, light gold, light blue, steel.
  chart: ['#CDA14B', '#3989CB', '#A4CC5C', '#E0BF7B', '#7FB3DE', '#9AA0A4'],
  // Visible labels only; role values stay principal/ea/cfo/admin/viewer.
  roleLabel: {
    principal: 'Owner',
    ea: "Owner's Rep",
    cfo: 'CFO',
    admin: 'Administrator',
    viewer: 'Viewer',
  },
} as const
