<!-- 987b331e-3b89-49bf-a30e-ca32533407a9 7a76a4aa-2047-4e1b-968a-fea5422be61b -->
# Fix Missing Component Files

The dashboard (`src/app/dashboard/page.tsx`) imports 3 files that don't exist, causing the build to fail. We need to create them.

## Files to Create

### 1. `src/components/SystemStateToggle.tsx`

The "Focus / Advanced" toggle switch with animated icons.

- Uses `framer-motion` for animations
- Focus mode: Green breathing target icon
- Advanced mode: Red spinning CPU/Settings icon
- Sliding background indicator

Key implementation:

```tsx
// Pill-shaped toggle with sliding background
// Focus = emerald (green), Advanced = red
// Target icon pulses, Cpu icon rotates
```

### 2. `src/hooks/useViewMode.ts`

Custom hook for managing and persisting the global view mode state.

- Stores `'focus' | 'advanced'` in localStorage
- Key: `'prompt-armory-view-mode'`
- Includes `isHydrated` flag for SSR safety

### 3. `src/components/DashboardHeaderControls.tsx`

The right-side navigation stack component.

- Row 1 (Meta-Nav): Library + Whitepaper links
- Row 2: App Switcher button (Email Armory / Prompt Armory)
- Glowing colored icons: Amber for Email, Cyan for Visual

Key implementation:

```tsx
// currentApp prop determines which link to show
// 'visual' -> shows "Email Armory" button with amber glow
// 'text' -> shows "Prompt Armory" button with cyan glow
```

## Implementation Order

1. Create `useViewMode.ts` (dependency for other components)
2. Create `SystemStateToggle.tsx`
3. Create `DashboardHeaderControls.tsx`

### To-dos

- [ ] Create useViewMode hook for global state persistence
- [ ] Create SystemStateToggle component with animated Focus/Advanced modes
- [ ] Create DashboardHeaderControls component with Navigation Stack
- [ ] Update Dashboard page header with new layout
- [ ] Recreate Email Armory (Text Armory) page
- [ ] Recreate Prompt Library placeholder page
- [ ] Restore modified files (dashboard/page.tsx, package.json, package-lock.json) to last commit
- [ ] Remove new untracked files and directories created today