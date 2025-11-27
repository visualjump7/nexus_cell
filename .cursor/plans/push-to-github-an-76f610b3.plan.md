<!-- 76f610b3-371b-4d0d-8ac7-4dc4bfd86e8d baab47ea-c944-4a69-b3ec-bdb83b63f78e -->
# Cinematic UI Design Update

## 1. Background Overhaul

- **Base:** Set background to pure black (`bg-black`).
- **Grid:** Implement a crisp CSS grid pattern using `linear-gradient`.
- **Animation:** Add "out of focus" floating color points (bokeh effect) using absolute positioned `div`s with blur filters and CSS keyframe animations.

## 2. UI Component Refinement

- **Buttons & Cards:** 
- Make card backgrounds transparent or semi-transparent black to blend with the scene.
- Add clean 1px borders (`border-white/10`) to create "graphic lines".
- Add subtle hover effects that respect the dark theme (e.g., glow or border brighten).
- **Layout:** Ensure the "Technical/Cinematic" feel is maintained with precise spacing and alignment.

## 3. Implementation

- **File:** `src/app/dashboard/page.tsx`
- **Process:**
- Define new CSS animations for the floating orbs.
- Replace the existing background `div` structure.
- Update the classNames for `ArsenalCard` buttons and other interactive elements to match the "pure black + clean lines" directive.

### To-dos

- [ ] Commit all files and push to GitHub
- [ ] Deploy to Vercel with environment variables
- [ ] Connect custom domain (optional)
- [x] Implement pure black background with CSS grid and animated bokeh orbs
- [x] Update button and card styles to blend with background and add technical lines
- [ ] Implement pure black background with CSS grid and animated bokeh orbs
- [ ] Update button and card styles to blend with background and add technical lines