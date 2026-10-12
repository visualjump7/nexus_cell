// Concept imagery for projects, trips and sections. Static: no DB access, so
// it works in server and client code. Data below is generated from
// master.json and the concept captions (concept-spec §22).
//
//   getProjectImagery(project, dbImages?) → { hero, gallery, source, key }
//   projectHero(project)                   → RpImage
//   toRpImage(src, caption?)               → RpImage with aspect, badge, provenance
//   subjectImage(text, seed?)              → keyword fallback ('Representative view')
//   tripImage(trip)                        → RpImage for a trip card / map fallback
//   SECTION_HERO[sectionId]                → RpImage per section

import type { RpAspect, RpImage } from '@/components/rp/types'
import type { SectionId } from '@/lib/sections'

export type DemoKind =
  | 'aerial'
  | 'site-model'
  | 'plan'
  | 'photo'
  | 'concept'
  | 'model'
  | 'model-plan'
  | 'home'
  | 'entrance'
  | 'film'
  | 'merch'

export interface DemoMeta {
  caption: string
  aspect: RpAspect
  kind: DemoKind
  provenance: string
  badge?: 'Phantom concept'
}

// One entry per file under public/demo (58).

export const DEMO_CATALOG: Record<string, DemoMeta> = {
  "/demo/concepts/flatrock-concept-01.jpg": { caption: "Exterior at dusk · dark board-and-batten over a stone base, glass garage doors and a two-storey stair hall", aspect: 'wide', kind: 'concept', provenance: "Phantom concept", badge: 'Phantom concept' },
  "/demo/entrance/concept-01-badge-canopy.jpg": { caption: "Badge canopy · black-and-steel badges on the monument and over a single guard booth", aspect: 'wide', kind: 'concept', provenance: "Phantom concept", badge: 'Phantom concept' },
  "/demo/entrance/concept-02-split-lane-gate.jpg": { caption: "Split-lane gate · entrance and exit under one canopy, stone piers and the badge wall", aspect: 'wide', kind: 'concept', provenance: "Phantom concept", badge: 'Phantom concept' },
  "/demo/entrance/main-gate-v03.jpg": { caption: "Main gate · a flat wood soffit over the guard booth, badge monument at the drive", aspect: 'wide', kind: 'entrance', provenance: "Images" },
  "/demo/film/driver-hero.jpg": { caption: "The father in the paddock", aspect: 'film', kind: 'film', provenance: "Film still" },
  "/demo/film/livery-hero.jpg": { caption: "The mark in motion · livery on the TA2 club car", aspect: 'banner', kind: 'film', provenance: "Brand" },
  "/demo/homes/custom-home-entry.jpg": { caption: "Entry · pivot door, stone and wood ceiling", aspect: 'wide', kind: 'home', provenance: "Concept only" },
  "/demo/homes/custom-home-exterior.jpg": { caption: "Arrival · porte-cochère at dusk", aspect: 'wide', kind: 'home', provenance: "Concept only" },
  "/demo/homes/custom-home-garage.jpg": { caption: "Garage · flush door between stone piers", aspect: 'wide', kind: 'home', provenance: "Concept only" },
  "/demo/homes/custom-home-kitchen.jpg": { caption: "Kitchen · island toward the pines", aspect: 'wide', kind: 'home', provenance: "Concept only" },
  "/demo/homes/trackside-contemporary-01.jpg": { caption: "Trackside Contemporary · Exterior at dusk", aspect: 'wide', kind: 'home', provenance: "Concept only" },
  "/demo/images/flatrock-club-01.jpg": { caption: "Exterior from the drive · glass garage doors and the two-storey stair hall", aspect: 'aerial', kind: 'photo', provenance: "Your images" },
  "/demo/images/trackside-connected-row.jpg": { caption: "Connected row at dusk · a flat timber soffit replaces the deep timber under the roof", aspect: 'pano', kind: 'photo', provenance: "Your images" },
  "/demo/images/trackside-looking-out-v03.jpg": { caption: "Looking out from the bay · a flat wood ceiling with recessed lighting in place of the heavy trusses", aspect: 'aerial', kind: 'photo', provenance: "Your images" },
  "/demo/images/trackside-mezzanine-v03.jpg": { caption: "Bay and mezzanine from the reverse angle · flat wood ceilings throughout", aspect: 'aerial', kind: 'photo', provenance: "Your images" },
  "/demo/merch/cap-race-day-redline.jpg": { caption: "Race Day cap · limited edition · Redline racing badge, red sandwich brim", aspect: 'photo', kind: 'merch', provenance: "Concept mockup" },
  "/demo/merch/cap-satin-silver.jpg": { caption: "Baseball cap · Woven badge patch, satin silver", aspect: 'photo', kind: 'merch', provenance: "Concept mockup" },
  "/demo/merch/diecast-cars.jpg": { caption: "Diecast cars · 1:64 and 1:24 · Racing livery on the club car", aspect: 'photo', kind: 'merch', provenance: "Concept mockup" },
  "/demo/merch/hoodie-sweatshirt-satin-silver.jpg": { caption: "Hoodie and sweatshirt · Satin silver badge on black", aspect: 'photo', kind: 'merch', provenance: "Concept mockup" },
  "/demo/merch/jacket-satin-silver.jpg": { caption: "Motorsport jacket · Chest patch, satin silver", aspect: 'photo', kind: 'merch', provenance: "Concept mockup" },
  "/demo/merch/keychain-satin-silver.jpg": { caption: "Shield keychain · Enamel and brushed steel", aspect: 'photo', kind: 'merch', provenance: "Concept mockup" },
  "/demo/merch/sticker-decal-set.jpg": { caption: "Sticker and decal set · Satin silver, racing livery and redline", aspect: 'photo', kind: 'merch', provenance: "Concept mockup" },
  "/demo/merch/tshirt-satin-silver.jpg": { caption: "T-shirt · Satin silver badge on black", aspect: 'photo', kind: 'merch', provenance: "Concept mockup" },
  "/demo/model/flatrock-aerial.jpg": { caption: "Exterior · six-position garage with the two-storey wing and rear porch", aspect: 'wide', kind: 'model', provenance: "Model" },
  "/demo/model/flatrock-ground-plan.jpg": { caption: "Ground floor · six-position garage, entertaining area, kitchen, pantry, rear porch and entry", aspect: 'portrait', kind: 'model-plan', provenance: "Model" },
  "/demo/model/flatrock-upper-plan.jpg": { caption: "Upper floor · two offices with storage, two baths, upper hall and lounge", aspect: 'portrait', kind: 'model-plan', provenance: "Model" },
  "/demo/model/trackside-01-ground-floor-plan.png": { caption: "Ground floor · the 27 × 60 ft bay, front on the left and trackside on the right", aspect: 'layout', kind: 'model-plan', provenance: "Model" },
  "/demo/model/trackside-02-loft-patio-plan.png": { caption: "Upper floor · lounge, restroom, stair arrival and trackside patio", aspect: 'layout', kind: 'model-plan', provenance: "Model" },
  "/demo/model/trackside-03-whole-bay-cutaway.png": { caption: "Whole-bay cutaway · both levels, the stair and the space open to below", aspect: 'layout', kind: 'model', provenance: "Model" },
  "/demo/model/trackside-04-loft-axonometric.png": { caption: "Loft axonometric · furniture and circulation around the restroom and patio", aspect: 'layout', kind: 'model', provenance: "Model" },
  "/demo/model/trackside-05-ground-interior.png": { caption: "Ground interior · the garage looking toward the stair and loft", aspect: 'layout', kind: 'model', provenance: "Model" },
  "/demo/model/trackside-06-loft-toward-patio.png": { caption: "Loft toward the patio · the lounge and the trackside glazing", aspect: 'layout', kind: 'model', provenance: "Model" },
  "/demo/model/trackside-07-loft-toward-stair.png": { caption: "Loft toward the stair · seating, stair arrival, refreshment joinery and restroom", aspect: 'layout', kind: 'model', provenance: "Model" },
  "/demo/plans/flatrock-base-1st-floor.png": { caption: "1st floor · six-car garage and entertaining area · the dividing wall is not built in the base plan", aspect: 'plan', kind: 'plan', provenance: "As issued" },
  "/demo/plans/flatrock-base-2nd-floor.png": { caption: "2nd floor · open loft above the entertaining wing", aspect: 'plan', kind: 'plan', provenance: "As issued" },
  "/demo/plans/flatrock-fitout-1st-floor.png": { caption: "1st floor · upgraded garage · living, dining, kitchen, pantry and entry", aspect: 'plan', kind: 'plan', provenance: "As issued" },
  "/demo/plans/flatrock-fitout-2nd-floor.png": { caption: "2nd floor · two bedrooms, two baths, laundry and loft", aspect: 'plan', kind: 'plan', provenance: "As issued" },
  "/demo/plans/masterplan-v5-unit-mix.jpg": { caption: "Masterplan V5 with unit mix · building types, bay counts, ADA bays and parcels", aspect: 'masterplan', kind: 'plan', provenance: "As issued" },
  "/demo/plans/masterplan-v5.jpg": { caption: "Masterplan V5 · architectural site plan", aspect: 'masterplan', kind: 'plan', provenance: "As issued" },
  "/demo/plans/trackside-1st-floor.png": { caption: "1st floor · main bay, 27 × 60 ft · roll-up doors front and trackside · stair up", aspect: 'plan', kind: 'plan', provenance: "As issued" },
  "/demo/plans/trackside-2nd-floor.png": { caption: "2nd floor · loft with lounge and restroom · open to the bay below · patio trackside", aspect: 'plan', kind: 'plan', provenance: "As issued" },
  "/demo/plans/trackside-sheet-a101-1.png": { caption: "Sheet A-101.1 complete, with the architect’s review notes on the loft", aspect: 'sheet', kind: 'plan', provenance: "As issued" },
  "/demo/site/aerial-01-full-site.jpg": { caption: "The whole club in the pines · circuit, paddock and lakes", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-02-north-pit-grandstand.jpg": { caption: "North pit lane and grandstand", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-03-south-grandstand-entry.jpg": { caption: "South grandstand and paddock entry", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-04-northeast-boardwalk.jpg": { caption: "Northeast shore · boardwalk and docks", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-05-clubhouse-pools-courts.jpg": { caption: "Clubhouse, pools and courts on the north lake", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-06-central-lake-garage-arc.jpg": { caption: "Central lake · the garage arc", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-08-southern-circuit.jpg": { caption: "Southern circuit network · the full loop from the south", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-09-northern-lakes.jpg": { caption: "Northern lakes · docks and lakefront parcels", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-10-garage-campus-pit-lane.jpg": { caption: "Garage campus and pit lane", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/aerial-12-eastern-lakefront.jpg": { caption: "Eastern lakefront parcels · garages along the water", aspect: 'aerial', kind: 'aerial', provenance: "Aerial render" },
  "/demo/site/site-central-lake-garage-arc.jpg": { caption: "Central lake · the garage arc and the pit-lane row", aspect: 'site', kind: 'site-model', provenance: "Site model" },
  "/demo/site/site-clubhouse-pools-courts.jpg": { caption: "Clubhouse, pools and courts on the north lake", aspect: 'site', kind: 'site-model', provenance: "Site model" },
  "/demo/site/site-eastern-lakefront.jpg": { caption: "Eastern lakefront parcels · garages along the water", aspect: 'site', kind: 'site-model', provenance: "Site model" },
  "/demo/site/site-full-hero.jpg": { caption: "The whole property · circuit, paddock, lakes and the pines", aspect: 'site', kind: 'site-model', provenance: "Site model" },
  "/demo/site/site-northern-lakes.jpg": { caption: "Northern lakes · clubhouse, docks and the lakeside garages", aspect: 'site', kind: 'site-model', provenance: "Site model" },
  "/demo/site/site-southern-circuit.jpg": { caption: "Southern circuit network · the full loop from the south", aspect: 'site', kind: 'site-model', provenance: "Site model" },
}

// Generated verbatim from master.json: 50 projects, 31 with galleries (78 images).
export const PROJECT_GALLERIES: Record<string, { name: string; images: { src: string; caption: string }[] }> = {
  "land-acquisition": {
    name: "Land Acquisition, Title & ALTA Survey",
    images: [
      { src: "/demo/site/aerial-01-full-site.jpg", caption: "The whole club in the pines · circuit, paddock and lakes" },
      { src: "/demo/plans/masterplan-v5.jpg", caption: "Masterplan V5 · architectural site plan (sheet A-80a)" },
    ],
  },
  "entitlements": {
    name: "FLUM Amendment, PUD Rezoning & Development Plan",
    images: [
      { src: "/demo/plans/masterplan-v5.jpg", caption: "Masterplan V5 · the PUD exhibit base" },
      { src: "/demo/plans/masterplan-v5-unit-mix.jpg", caption: "Masterplan V5 with unit mix · building types, bay counts, ADA bays and parcels" },
    ],
  },
  "airport-noise": { name: "Airport Compatibility, FAA 7460-1 & Noise Program", images: [] },
  "env-permits-mitigation": {
    name: "Environmental Permits & Wetland Mitigation",
    images: [
      { src: "/demo/site/aerial-09-northern-lakes.jpg", caption: "Northern lakes · littoral shelves under the ERP" },
    ],
  },
  "env-compliance": { name: "Listed Species, NPDES & Erosion Control", images: [] },
  "clearing": {
    name: "Clearing, Grubbing & Pine-Stand Preservation",
    images: [
      { src: "/demo/site/site-full-hero.jpg", caption: "The whole property · pine islands kept as buffers" },
    ],
  },
  "mass-grading-lakes": {
    name: "Mass Grading, Lakes & Building Pads",
    images: [
      { src: "/demo/site/aerial-09-northern-lakes.jpg", caption: "Northern lakes · docks and lakefront parcels" },
      { src: "/demo/site/site-northern-lakes.jpg", caption: "Northern lakes · clubhouse, docks and the lakeside garages" },
      { src: "/demo/site/aerial-06-central-lake-garage-arc.jpg", caption: "Central lake · the garage arc" },
      { src: "/demo/site/aerial-12-eastern-lakefront.jpg", caption: "Eastern lakefront · final lake edge" },
    ],
  },
  "geotech-karst": { name: "Geotechnical Investigation & Karst Remediation", images: [] },
  "stormwater": {
    name: "Stormwater, Outfalls & Circuit Underdrains",
    images: [
      { src: "/demo/site/site-central-lake-garage-arc.jpg", caption: "Central lake · control structures between lake systems" },
    ],
  },
  "circuit-design": {
    name: "Circuit Design, Simulation & Sanctioning",
    images: [
      { src: "/demo/site/aerial-08-southern-circuit.jpg", caption: "Southern circuit network · the full loop from the south" },
      { src: "/demo/site/aerial-01-full-site.jpg", caption: "Road course and street course in the pines" },
    ],
  },
  "track-subgrade-base": {
    name: "Road Course Subgrade & Aggregate Base (2.75 mi)",
    images: [
      { src: "/demo/site/site-southern-circuit.jpg", caption: "Southern circuit network · base on the south loop" },
    ],
  },
  "track-paving": {
    name: "Road & Street Course Paving (PMA Surface)",
    images: [
      { src: "/demo/site/aerial-08-southern-circuit.jpg", caption: "Southern circuit · the paving program Nov 2026 - Apr 2027" },
      { src: "/demo/film/livery-hero.jpg", caption: "The TA2 club car · the surface is built for it" },
    ],
  },
  "track-curbing": { name: "Curbing, Rumble Strips & Track Markings", images: [] },
  "pit-paddock": {
    name: "Pit Lane, Hot Pit & Paddock Apron",
    images: [
      { src: "/demo/site/aerial-10-garage-campus-pit-lane.jpg", caption: "Garage campus and pit lane" },
      { src: "/demo/site/aerial-02-north-pit-grandstand.jpg", caption: "North pit lane and grandstand" },
    ],
  },
  "driver-academy": {
    name: "Driver Academy: Skid Pad, Handling Pad & Karting",
    images: [
      { src: "/demo/film/driver-hero.jpg", caption: "Driver academy · instruction on the handling pad" },
    ],
  },
  "runoff-gravel": { name: "Runoff Areas, Gravel Traps & Marshal Posts", images: [] },
  "barriers-tecpro": { name: "Energy-Absorbing Barriers, Guardrail & Pit Wall", images: [] },
  "debris-fencing": { name: "Debris & Catch Fencing", images: [] },
  "race-control": {
    name: "Race Control Tower, Medical Center & Fire-Rescue Bay",
    images: [
      { src: "/demo/site/aerial-02-north-pit-grandstand.jpg", caption: "North pit straight · race control tower site" },
    ],
  },
  "timing-track-tech": {
    name: "Timing & Scoring, Flag Panels, CCTV & Track Lighting",
    images: [
      { src: "/demo/site/aerial-02-north-pit-grandstand.jpg", caption: "Race control line of sight over the pit straight" },
    ],
  },
  "entry-road-sr100": {
    name: "Entry Road, Boulevard & SR 100 Turn Lanes",
    images: [
      { src: "/demo/site/aerial-03-south-grandstand-entry.jpg", caption: "South entry · boulevard toward the paddock" },
    ],
  },
  "internal-roads": { name: "Internal Roads, Service Roads & Parking", images: [] },
  "water-sewer": { name: "Potable Water, Fire Loop, Sewer & Lift Stations", images: [] },
  "power-fiber": { name: "FPL Duct Bank, Power Distribution & Fiber", images: [] },
  "main-entrance": {
    name: "Main Entrance, Gatehouse & Access Control",
    images: [
      { src: "/demo/entrance/concept-02-split-lane-gate.jpg", caption: "Split-lane gate · entrance and exit under one canopy, stone piers and the badge wall" },
      { src: "/demo/entrance/main-gate-v03.jpg", caption: "Main gate · a flat wood soffit over the guard booth, badge monument at the drive" },
    ],
  },
  "entrance-badge-canopy": {
    name: "Entrance Concept A: Badge Canopy (Superseded)",
    images: [
      { src: "/demo/entrance/concept-01-badge-canopy.jpg", caption: "Badge canopy · black-and-steel badges on the monument and over a single guard booth (superseded)" },
    ],
  },
  "perimeter-sound-walls": { name: "Perimeter Security Fence & Sound Walls", images: [] },
  "clubhouse": {
    name: "Clubhouse: Multi-Level Paddock Clubhouse",
    images: [
      { src: "/demo/site/aerial-05-clubhouse-pools-courts.jpg", caption: "Clubhouse, pools and courts on the north lake" },
      { src: "/demo/site/site-clubhouse-pools-courts.jpg", caption: "Clubhouse parcel · site model" },
    ],
  },
  "courts-fitness-spa": {
    name: "Courts, Fitness & Spa Pavilion",
    images: [
      { src: "/demo/site/site-clubhouse-pools-courts.jpg", caption: "Courts and the fitness pavilion beside the clubhouse" },
    ],
  },
  "pools-cabanas": {
    name: "Resort Pool, Lap Pool & Cabanas",
    images: [
      { src: "/demo/site/aerial-05-clubhouse-pools-courts.jpg", caption: "Resort pool, lap pool and cabanas on the north lake" },
    ],
  },
  "boardwalk-docks": {
    name: "Boardwalk, Docks & Lake Pavilions",
    images: [
      { src: "/demo/site/aerial-04-northeast-boardwalk.jpg", caption: "Northeast shore · boardwalk and docks" },
      { src: "/demo/site/site-eastern-lakefront.jpg", caption: "Eastern lakefront · the boardwalk alignment" },
    ],
  },
  "grandstands-events-lawn": {
    name: "Grandstands, Viewing Terraces & Events Lawn",
    images: [
      { src: "/demo/site/aerial-02-north-pit-grandstand.jpg", caption: "North pit lane and grandstand" },
      { src: "/demo/site/aerial-03-south-grandstand-entry.jpg", caption: "South grandstand and paddock entry" },
    ],
  },
  "fuel-vehicle-service": { name: "Fuel Station, Car Wash & Vehicle Service Building", images: [] },
  "trackside-garages": {
    name: "Trackside Garages: Phase 1 Rows (104 bays)",
    images: [
      { src: "/demo/images/trackside-connected-row.jpg", caption: "Connected row at dusk · a flat timber soffit replaces the deep timber under the roof" },
      { src: "/demo/images/trackside-looking-out-v03.jpg", caption: "Looking out from the bay · a flat wood ceiling with recessed lighting" },
      { src: "/demo/images/trackside-mezzanine-v03.jpg", caption: "Bay and mezzanine from the reverse angle · flat wood ceilings throughout" },
      { src: "/demo/plans/trackside-1st-floor.png", caption: "1st floor · main bay, 27 × 60 ft · roll-up doors front and trackside · stair up" },
      { src: "/demo/plans/trackside-2nd-floor.png", caption: "2nd floor · loft with lounge and restroom · patio trackside" },
      { src: "/demo/plans/trackside-sheet-a101-1.png", caption: "Sheet A-101.1 complete, with the architect's review notes on the loft" },
      { src: "/demo/model/trackside-03-whole-bay-cutaway.png", caption: "Whole-bay cutaway · both levels, the stair and the space open to below" },
      { src: "/demo/model/trackside-04-loft-axonometric.png", caption: "Loft axonometric · furniture and circulation" },
      { src: "/demo/model/trackside-06-loft-toward-patio.png", caption: "Loft toward the patio · the lounge and the trackside glazing" },
      { src: "/demo/site/aerial-10-garage-campus-pit-lane.jpg", caption: "Garage campus and pit lane" },
    ],
  },
  "condo-garages-g": {
    name: "Members' Car Storage: 40' Condo Garages (Type G)",
    images: [
      { src: "/demo/site/site-central-lake-garage-arc.jpg", caption: "Garage campus · the pit-lane row and condo clusters" },
      { src: "/demo/plans/masterplan-v5-unit-mix.jpg", caption: "Unit mix · Type G 40' condo garages, 94 bays" },
    ],
  },
  "paddock-garages-ph2": {
    name: "Paddock Garages & Condo Garages: Phase 2 (168 bays)",
    images: [
      { src: "/demo/concepts/flatrock-concept-01.jpg", caption: "Flatrock Paddock Garage at dusk · board-and-batten over a stone base" },
      { src: "/demo/images/flatrock-club-01.jpg", caption: "Exterior from the drive · glass garage doors and the two-storey stair hall" },
      { src: "/demo/model/flatrock-aerial.jpg", caption: "Exterior · six-position garage with the two-storey wing and rear porch" },
      { src: "/demo/model/flatrock-ground-plan.jpg", caption: "Ground floor · six-position garage, entertaining area, kitchen and rear porch" },
      { src: "/demo/model/flatrock-upper-plan.jpg", caption: "Upper floor · offices, two baths, upper hall and lounge" },
      { src: "/demo/plans/flatrock-base-1st-floor.png", caption: "Base · 1st floor six-car garage and entertaining area" },
      { src: "/demo/plans/flatrock-fitout-2nd-floor.png", caption: "Optional Fit Out · 2nd floor, two bedrooms and two baths" },
      { src: "/demo/site/aerial-06-central-lake-garage-arc.jpg", caption: "Central lake · the garage arc" },
    ],
  },
  "homesites": {
    name: "Homesite Development & Design Guidelines (54 parcels)",
    images: [
      { src: "/demo/site/aerial-12-eastern-lakefront.jpg", caption: "Eastern lakefront parcels · garages along the water" },
      { src: "/demo/site/site-eastern-lakefront.jpg", caption: "Eastern lakefront parcels · site model" },
    ],
  },
  "model-homes": {
    name: "Model Homes: Trackside Contemporary & Custom Home",
    images: [
      { src: "/demo/homes/trackside-contemporary-01.jpg", caption: "Trackside Contemporary · exterior at dusk" },
      { src: "/demo/homes/custom-home-exterior.jpg", caption: "Custom Home · arrival under the porte-cochère at dusk" },
      { src: "/demo/homes/custom-home-entry.jpg", caption: "Custom Home · pivot door, stone and wood ceiling" },
      { src: "/demo/homes/custom-home-kitchen.jpg", caption: "Custom Home · kitchen island toward the pines" },
      { src: "/demo/homes/custom-home-garage.jpg", caption: "Custom Home · flush garage door between stone piers" },
    ],
  },
  "landscape-irrigation": {
    name: "Landscape, Irrigation & Site Lighting",
    images: [
      { src: "/demo/site/site-full-hero.jpg", caption: "The whole property · circuit, paddock, lakes and the pines" },
    ],
  },
  "signage-wayfinding": { name: "Signage, Wayfinding & Brand Environment", images: [] },
  "ae-design": {
    name: "Architecture & Engineering Design Services",
    images: [
      { src: "/demo/plans/masterplan-v5.jpg", caption: "Masterplan V5 · architectural site plan" },
      { src: "/demo/plans/trackside-sheet-a101-1.png", caption: "Sheet A-101.1 · Trackside Garage" },
      { src: "/demo/plans/flatrock-fitout-1st-floor.png", caption: "Flatrock Optional Fit Out · 1st floor" },
    ],
  },
  "pm-cei-testing": { name: "Program Management, CEI & Materials Testing", images: [] },
  "legal-fees": { name: "Legal, Permit Fees, Impact Fees & Plan Review", images: [] },
  "insurance-risk": { name: "Builder's Risk, OCIP & Named-Storm Cover", images: [] },
  "financing": { name: "Construction Financing: Interest Reserve & Fees", images: [] },
  "contingency": { name: "Owner Contingency & Escalation Reserve", images: [] },
  "brand-content-merch": {
    name: "Brand, Content Engine & Merchandise",
    images: [
      { src: "/demo/film/livery-hero.jpg", caption: "The mark in motion · TA2 club car livery" },
      { src: "/demo/film/driver-hero.jpg", caption: "Film still · the driver" },
      { src: "/demo/merch/tshirt-satin-silver.jpg", caption: "T-shirt · satin silver" },
      { src: "/demo/merch/cap-satin-silver.jpg", caption: "Cap · satin silver" },
      { src: "/demo/merch/cap-race-day-redline.jpg", caption: "Race Day redline cap · limited" },
      { src: "/demo/merch/hoodie-sweatshirt-satin-silver.jpg", caption: "Hoodie · satin silver" },
      { src: "/demo/merch/jacket-satin-silver.jpg", caption: "Motorsport jacket · satin silver" },
      { src: "/demo/merch/sticker-decal-set.jpg", caption: "Sticker & decal set" },
      { src: "/demo/merch/keychain-satin-silver.jpg", caption: "Shield keychain" },
      { src: "/demo/merch/diecast-cars.jpg", caption: "Diecast cars · 1:64 and 1:24" },
    ],
  },
  "sales-gallery": {
    name: "Sales Gallery & Trackside Sales Center",
    images: [
      { src: "/demo/site/site-full-hero.jpg", caption: "Physical site model · the centerpiece of the sales gallery" },
      { src: "/demo/plans/masterplan-v5-unit-mix.jpg", caption: "Unit mix board · bays and parcels available" },
      { src: "/demo/images/trackside-connected-row.jpg", caption: "Trackside row · the lead sales image" },
    ],
  },
  "pre-opening": {
    name: "Pre-Opening Operations & Track Commissioning",
    images: [
      { src: "/demo/film/driver-hero.jpg", caption: "Track-day operations · the member experience" },
    ],
  },
  "site-services": { name: "Site Logistics, Security & Temporary Facilities", images: [] },
}

// ── helpers ────────────────────────────────────────────────────────────────

const MAT_ASPECTS: RpAspect[] = ['plan', 'sheet', 'masterplan']

/** Catalog key for a src: '/demo/…' paths, also inside absolute URLs. */
function catalogKey(src: string): string {
  const i = src.indexOf('/demo/')
  return i >= 0 ? src.slice(i).split(/[?#]/)[0] : src
}

/** Catalog meta for a src, if it is a known demo image. */
export function demoMeta(src: string | null | undefined): DemoMeta | undefined {
  if (!src) return undefined
  return DEMO_CATALOG[catalogKey(src)]
}

/**
 * RpImage for a src. Merges catalog meta (aspect, badge, provenance, mat for
 * drawings); a caption passed in wins over the catalog caption. Unknown srcs
 * get aspect 'aerial' and provenance 'Photo'.
 */
export function toRpImage(src: string, caption?: string | null): RpImage {
  const meta = demoMeta(src)
  const cap = (caption && caption.trim()) || meta?.caption || undefined
  if (!meta) {
    return { src, caption: cap, alt: cap ?? '', aspect: 'aerial', provenance: 'Photo' }
  }
  const img: RpImage = {
    src,
    caption: cap,
    alt: cap ?? '',
    aspect: meta.aspect,
    provenance: meta.provenance,
  }
  if (meta.badge) img.badge = meta.badge
  if (MAT_ASPECTS.includes(meta.aspect)) img.mat = true
  if (meta.aspect === 'film') img.objectPosition = 'center 30%'
  return img
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const GALLERY_INDEX: { key: string; n: string }[] = Object.entries(PROJECT_GALLERIES).map(([key, g]) => ({ key, n: norm(g.name) }))

/**
 * master.json key for a project name. Exact (normalised) match first, then a
 * startsWith on the first 24 characters either way. A key passed as the name
 * also resolves. null when nothing matches.
 */
export function matchProjectKey(name?: string | null): string | null {
  if (!name) return null
  if (PROJECT_GALLERIES[name]) return name
  const n = norm(name)
  if (!n) return null
  const exact = GALLERY_INDEX.find(g => g.n === n)
  if (exact) return exact.key
  const head = n.slice(0, 24)
  const loose = GALLERY_INDEX.find(g => g.n.startsWith(head) || n.startsWith(g.n.slice(0, 24)))
  return loose?.key ?? null
}

/** djb2 with a murmur3 finaliser — stable across server and client, well spread in the low bits. */
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

const D = (p: string) => `/demo/${p}`

// Ordered keyword rules (regex on lowercase text). First match wins; several
// candidates → hash(seed) % n so neighbouring fallbacks differ.
const SUBJECT_RULES: { re: RegExp; images: string[] }[] = [
  { re: /trackside garage/, images: [D('images/trackside-connected-row.jpg'), D('images/trackside-looking-out-v03.jpg')] },
  { re: /flatrock|paddock garage/, images: [D('images/flatrock-club-01.jpg'), D('concepts/flatrock-concept-01.jpg')] },
  { re: /condo garage|car storage|garage/, images: [D('site/aerial-10-garage-campus-pit-lane.jpg'), D('site/site-central-lake-garage-arc.jpg')] },
  { re: /clubhouse|pool|cabana|court|fitness|spa\b/, images: [D('site/aerial-05-clubhouse-pools-courts.jpg'), D('site/site-clubhouse-pools-courts.jpg')] },
  { re: /boardwalk|dock|lake pavilion|northeast shore/, images: [D('site/aerial-04-northeast-boardwalk.jpg')] },
  { re: /grandstand|events lawn|viewing terrace/, images: [D('site/aerial-02-north-pit-grandstand.jpg')] },
  { re: /race control|medical|fire-rescue|timing|scoring|cctv|flag panel|track lighting/, images: [D('site/aerial-02-north-pit-grandstand.jpg'), D('site/aerial-10-garage-campus-pit-lane.jpg')] },
  { re: /pit lane|hot pit|paddock apron|pit straight/, images: [D('site/aerial-10-garage-campus-pit-lane.jpg')] },
  { re: /barrier|guardrail|pit wall|runoff|gravel|marshal|debris|catch fenc|curb|rumble|track marking|esses|banked/, images: [D('site/site-southern-circuit.jpg'), D('site/aerial-08-southern-circuit.jpg'), D('site/aerial-03-south-grandstand-entry.jpg')] },
  { re: /geotech|karst/, images: [D('site/site-southern-circuit.jpg')] },
  { re: /driver academy|skid pad|karting|handling pad/, images: [D('film/driver-hero.jpg')] },
  { re: /airport|faa|noise|land acquisition|title|alta|survey|flum|pud|rezoning|entitlement/, images: [D('site/aerial-01-full-site.jpg'), D('plans/masterplan-v5.jpg')] },
  { re: /lake|wetland|mitigation|grading|stormwater|outfall|environmental|species|npdes|erosion/, images: [D('site/aerial-09-northern-lakes.jpg'), D('site/site-northern-lakes.jpg')] },
  { re: /track|circuit|road course|street course|paving|subgrade|south loop/, images: [D('site/aerial-08-southern-circuit.jpg'), D('site/site-southern-circuit.jpg')] },
  { re: /main entrance|gatehouse|gate|access control|badge canopy|signage|wayfinding/, images: [D('entrance/main-gate-v03.jpg')] },
  { re: /entry road|sr 100|turn lane|boulevard|sw entry|parking|west event|easement|logistics|temporary facilities/, images: [D('site/aerial-03-south-grandstand-entry.jpg')] },
  { re: /water|sewer|lift station|fire loop|power|fpl|fiber|duct bank|internal road|service road/, images: [D('site/site-central-lake-garage-arc.jpg'), D('site/site-northern-lakes.jpg')] },
  { re: /perimeter|security fence|sound wall/, images: [D('site/aerial-01-full-site.jpg')] },
  { re: /fuel|car wash|vehicle service|service compound/, images: [D('site/aerial-10-garage-campus-pit-lane.jpg')] },
  { re: /homesite|model home|residence|estate|eastern lakefront|parcel/, images: [D('homes/trackside-contemporary-01.jpg'), D('site/aerial-12-eastern-lakefront.jpg')] },
  { re: /landscape|irrigation|site lighting/, images: [D('site/aerial-09-northern-lakes.jpg'), D('site/aerial-01-full-site.jpg')] },
  { re: /brand|content|merch|marketing|sales gallery|sales center/, images: [D('film/livery-hero.jpg'), D('film/driver-hero.jpg')] },
  { re: /pre-opening|operations|commissioning/, images: [D('film/driver-hero.jpg')] },
  // Fees and approvals read best as the issued master plan.
  { re: /legal|permit|impact fee|plan review/, images: [D('plans/masterplan-v5.jpg'), D('plans/masterplan-v5-unit-mix.jpg')] },
  { re: /design|engineering|architecture|program management|cei|testing/, images: [D('plans/masterplan-v5.jpg'), D('plans/masterplan-v5-unit-mix.jpg'), D('plans/trackside-sheet-a101-1.png')] },
  { re: /insurance|builder's risk|builders risk|ocip|storm|financ|interest|contingency|escalation|reserve/, images: [D('site/site-full-hero.jpg'), D('site/site-eastern-lakefront.jpg')] },
]

const DEFAULT_SUBJECT = D('site/site-full-hero.jpg')

function matchRule(text: string | null | undefined): string[] | null {
  if (!text) return null
  const t = text.toLowerCase()
  for (const r of SUBJECT_RULES) if (r.re.test(t)) return r.images
  return null
}

function pick(images: string[], seed: string): string {
  return images.length === 1 ? images[0] : images[hash(seed) % images.length]
}

function representative(src: string): RpImage {
  return { ...toRpImage(src), qualifier: 'Representative view' }
}

/**
 * Keyword resolver for a subject with no imagery of its own. First matching
 * rule wins; several candidates → hash(seed ?? text) % n. Always carries
 * qualifier 'Representative view'. Default: the site-model hero.
 */
export function subjectImage(text: string, seed?: string): RpImage {
  const imgs = matchRule(text)
  return representative(imgs ? pick(imgs, seed ?? text) : DEFAULT_SUBJECT)
}

export interface ProjectImagery {
  hero: RpImage
  gallery: RpImage[]
  /** db = the project's own uploads; catalog = master.json gallery; fallback = keyword match. */
  source: 'db' | 'catalog' | 'fallback'
  /** master.json key, when the name matches one. */
  key: string | null
}

export interface ProjectLike {
  id?: string
  name?: string | null
  project_type?: string | null
  location?: string | null
}

export interface DbImageLike { url: string; caption?: string | null; position?: number | null }

function chooseHero(gallery: RpImage[]): RpImage {
  const nonPlan = gallery.find(img => {
    const k = demoMeta(img.src)?.kind
    return k !== 'plan' && k !== 'model-plan'
  })
  return nonPlan ?? gallery[0]
}

/**
 * Imagery for a project:
 *   1. dbImages (sorted by position)            → source 'db'
 *   2. PROJECT_GALLERIES[matchProjectKey(name)] → source 'catalog'
 *   3. keyword fallback over name, then project_type, then location
 *                                               → source 'fallback', qualifier 'Representative view'
 * The hero is the first image that is not a drawing, unless all are.
 */
export function getProjectImagery(p: ProjectLike, dbImages?: DbImageLike[] | null): ProjectImagery {
  const key = matchProjectKey(p.name)
  const db = (dbImages ?? []).filter(i => i && i.url)
  if (db.length) {
    const gallery = [...db]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(i => toRpImage(i.url, i.caption))
    return { hero: chooseHero(gallery), gallery, source: 'db', key }
  }
  const cat = key ? PROJECT_GALLERIES[key]?.images ?? [] : []
  if (cat.length) {
    const gallery = cat.map(i => toRpImage(i.src, i.caption))
    return { hero: chooseHero(gallery), gallery, source: 'catalog', key }
  }
  const seed = p.name || p.id || ''
  const imgs = matchRule(p.name) ?? matchRule(p.project_type) ?? matchRule(p.location)
  const hero = representative(imgs ? pick(imgs, seed) : DEFAULT_SUBJECT)
  return { hero, gallery: [hero], source: 'fallback', key }
}

/** The project's hero image (getProjectImagery(p).hero). */
export function projectHero(p: ProjectLike, dbImages?: DbImageLike[] | null): RpImage {
  return getProjectImagery(p, dbImages).hero
}

// One image per kind of trip, so the travel list does not repeat itself.
// Tested against the title first (route and purpose are the most specific
// words), then the notes, so a note that mentions a draw or recruitment does
// not pull every trip onto the same picture.
const TRIP_RULES: { re: RegExp; src: string; caption?: string }[] = [
  { re: /palatka|site week|site walk|oac|draw/, src: D('site/aerial-01-full-site.jpg') },
  { re: /daytona|rolex/, src: D('film/livery-hero.jpg') },
  { re: /sebring/, src: D('images/trackside-looking-out-v03.jpg') },
  { re: /concours|amelia/, src: D('merch/diecast-cars.jpg') },
  { re: /monterey|car week/, src: D('film/driver-hero.jpg') },
  { re: /factory|barrier|curbing|brescia/, src: D('site/aerial-02-north-pit-grandstand.jpg') },
  { re: /track design|workshop|frankfurt|n[uü]rburgring/, src: D('site/aerial-08-southern-circuit.jpg') },
  { re: /benchmark|thermal|monticello/, src: D('images/flatrock-club-01.jpg') },
  { re: /lender|new york|bank/, src: D('images/trackside-connected-row.jpg') },
  { re: /recruit|investor|member/, src: D('film/driver-hero.jpg') },
]

const TRIP_DEFAULT = D('entrance/main-gate-v03.jpg')

/** Image for a trip card or a map fallback: its title first, then its notes. */
export function tripImage(t: { id?: string; title?: string | null; notes?: string | null }): RpImage {
  const title = (t.title ?? '').toLowerCase()
  const notes = (t.notes ?? '').toLowerCase()
  const rule = TRIP_RULES.find(r => r.re.test(title)) ?? TRIP_RULES.find(r => r.re.test(notes))
  if (rule) return toRpImage(rule.src, rule.caption)
  return toRpImage(TRIP_DEFAULT, 'Arrival · main gate')
}

/** Every distinct trip image, in rule order: alternates for a list that would otherwise repeat. */
export const TRIP_IMAGE_POOL: string[] = Array.from(new Set([...TRIP_RULES.map(r => r.src), TRIP_DEFAULT]))

/** One concept image per section (and the clubhouse, settings, admin screens). */
export const SECTION_HERO: Record<SectionId | 'clubhouse' | 'settings' | 'admin', RpImage> = {
  overview: toRpImage(D('site/aerial-01-full-site.jpg')),
  dashboard: toRpImage(D('site/site-full-hero.jpg')),
  projects: toRpImage(D('site/aerial-10-garage-campus-pit-lane.jpg')),
  'site-map': toRpImage(D('site/aerial-06-central-lake-garage-arc.jpg')),
  financial: toRpImage(D('site/site-central-lake-garage-arc.jpg')),
  brief: toRpImage(D('film/driver-hero.jpg')),
  calendar: toRpImage(D('site/aerial-02-north-pit-grandstand.jpg')),
  tasks: toRpImage(D('site/aerial-03-south-grandstand-entry.jpg')),
  alerts: toRpImage(D('site/site-southern-circuit.jpg')),
  travel: toRpImage(D('entrance/main-gate-v03.jpg')),
  comms: toRpImage(D('film/livery-hero.jpg')),
  clubhouse: toRpImage(D('site/aerial-05-clubhouse-pools-courts.jpg')),
  settings: toRpImage(D('site/site-northern-lakes.jpg')),
  admin: toRpImage(D('site/site-full-hero.jpg')),
}

/** Every catalog image of one kind, in file order (e.g. the 10 aerials for the site map). */
export function demoImagesOfKind(kind: DemoKind): RpImage[] {
  return Object.entries(DEMO_CATALOG)
    .filter(([, m]) => m.kind === kind)
    .map(([src]) => toRpImage(src))
}
