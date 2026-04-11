-- ============================================================
-- NEXUS CELL — DEMO SEED DATA
-- Run this in Supabase SQL Editor after the schema is deployed
-- ============================================================

-- Get the org ID
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID := 'b145c581-1303-4ad9-ada6-f9dd006ab020';
  v_trip1 UUID;
  v_trip2 UUID;
  v_trip3 UUID;
  v_proj1 UUID;
  v_proj2 UUID;
  v_alert1 UUID;
  v_alert2 UUID;
  v_alert3 UUID;
BEGIN

SELECT id INTO v_org_id FROM organizations WHERE slug = 'nexus-cell' LIMIT 1;

-- ============================================================
-- BILLS (18 entries — mix of statuses)
-- ============================================================

INSERT INTO bills (organization_id, created_by, vendor, description, amount, status, category, due_date, paid_date, payment_method, notes) VALUES
(v_org_id, v_user_id, 'Atlantic Aviation', 'Fuel and handling — TEB', 12400.00, 'paid', 'Aviation', '2026-03-15', '2026-03-14', 'Wire', 'NetJets TEB base'),
(v_org_id, v_user_id, 'Evergreen Property Management', 'Monthly management fee — Palm Beach', 8500.00, 'pending', 'Property', '2026-04-20', NULL, NULL, 'Includes landscaping coordination'),
(v_org_id, v_user_id, 'Williams & Associates LLP', 'Q2 legal retainer', 15000.00, 'approved', 'Legal', '2026-04-25', NULL, NULL, 'Estate planning + trust review'),
(v_org_id, v_user_id, 'NetJets', 'Share program — Q2 management fee', 45000.00, 'pending', 'Aviation', '2026-05-01', NULL, NULL, 'Marquis Card 50-hour program'),
(v_org_id, v_user_id, 'Palm Beach Country Club', 'Annual membership dues', 24000.00, 'paid', 'Membership', '2026-01-15', '2026-01-12', 'ACH', NULL),
(v_org_id, v_user_id, 'Wine Access Club', 'Spring quarterly shipment', 890.00, 'paid', 'Lifestyle', '2026-03-01', '2026-02-28', 'Credit Card', '6 bottles — Napa reserve selection'),
(v_org_id, v_user_id, 'ADT Security', 'Monthly monitoring — all properties', 450.00, 'paid', 'Security', '2026-04-01', '2026-04-01', 'Auto-pay', 'Palm Beach + Aspen + NYC'),
(v_org_id, v_user_id, 'Landscape Design Co', 'Monthly grounds maintenance — Palm Beach', 3200.00, 'pending', 'Property', '2026-04-15', NULL, NULL, NULL),
(v_org_id, v_user_id, 'Capitol Insurance Group', 'Annual umbrella policy premium', 18750.00, 'overdue', 'Insurance', '2026-03-30', NULL, NULL, 'URGENT — 12 days overdue'),
(v_org_id, v_user_id, 'Marina Bay Yacht Club', 'Seasonal docking — summer slip', 6200.00, 'paid', 'Marine', '2026-04-01', '2026-03-28', 'Wire', 'Slip 47, 60ft'),
(v_org_id, v_user_id, 'Claridge''s London', 'Suite reservation — May business trip', 8900.00, 'paid', 'Travel', '2026-03-20', '2026-03-20', 'Credit Card', 'Brook Suite, 4 nights'),
(v_org_id, v_user_id, 'Range Rover Financial', 'Monthly lease — Autobiography LWB', 2850.00, 'pending', 'Vehicle', '2026-04-15', NULL, NULL, 'Auto-debit pending'),
(v_org_id, v_user_id, 'Sotheby''s', 'Auction commission — Basquiat acquisition', 125000.00, 'paid', 'Art', '2026-02-15', '2026-02-14', 'Wire', 'Lot 47, authenticated'),
(v_org_id, v_user_id, 'The Little Nell', 'Aspen winter trip — suite charges', 14200.00, 'paid', 'Travel', '2026-01-02', '2026-01-05', 'Credit Card', 'Dec 20-28, residence suite'),
(v_org_id, v_user_id, 'Addison Lee', 'London car service — 4 days', 2100.00, 'paid', 'Travel', '2026-03-25', '2026-03-25', 'Credit Card', 'Business trip ground transport'),
(v_org_id, v_user_id, 'Dr. James Morton', 'Annual executive physical', 4500.00, 'pending', 'Medical', '2026-05-10', NULL, NULL, 'Mount Sinai concierge medicine'),
(v_org_id, v_user_id, 'Hermès', 'Birkin repair and reconditioning', 1850.00, 'approved', 'Lifestyle', '2026-04-30', NULL, NULL, 'Gold hardware restoration'),
(v_org_id, v_user_id, 'Teterboro Airport Authority', 'Hangar storage fee — Q2', 9800.00, 'pending', 'Aviation', '2026-04-15', NULL, NULL, 'Shared hangar arrangement');

-- ============================================================
-- TRIPS (3 trips with segments)
-- ============================================================

INSERT INTO trips (id, organization_id, created_by, title, start_date, end_date, status, notes)
VALUES (gen_random_uuid(), v_org_id, v_user_id, 'Aspen Winter Trip', '2025-12-20', '2025-12-28', 'completed', 'Annual ski trip — family')
RETURNING id INTO v_trip1;

INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, depart_at, arrive_at, carrier, confirmation_code, seat_info, sort_order) VALUES
(v_trip1, 'flight', 'Teterboro (TEB)', 'Aspen (ASE)', '2025-12-20 08:00:00-05', '2025-12-20 11:30:00-07', 'NetJets', 'NJ-48291', 'Citation X — Seats 1A/1B', 1);
INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, check_in, check_out, carrier, confirmation_code, sort_order) VALUES
(v_trip1, 'hotel', 'The Little Nell, Aspen', NULL, '2025-12-20', '2025-12-28', 'The Little Nell', 'LN-992847', 2);
INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, depart_at, arrive_at, carrier, confirmation_code, sort_order) VALUES
(v_trip1, 'car', 'Aspen Airport', 'The Little Nell', '2025-12-20 11:45:00-07', '2025-12-20 12:15:00-07', 'Enterprise', 'ENT-773920', 3);
INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, depart_at, arrive_at, carrier, confirmation_code, seat_info, sort_order) VALUES
(v_trip1, 'flight', 'Aspen (ASE)', 'Teterboro (TEB)', '2025-12-28 14:00:00-07', '2025-12-28 20:30:00-05', 'NetJets', 'NJ-48455', 'Citation X', 4);

INSERT INTO trips (id, organization_id, created_by, title, start_date, end_date, status, notes)
VALUES (gen_random_uuid(), v_org_id, v_user_id, 'Miami — Art Basel Week', '2026-05-15', '2026-05-19', 'confirmed', 'Art Basel VIP preview + collector dinners')
RETURNING id INTO v_trip2;

INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, depart_at, arrive_at, carrier, confirmation_code, seat_info, sort_order) VALUES
(v_trip2, 'flight', 'Teterboro (TEB)', 'Opa-Locka (OPF)', '2026-05-15 09:00:00-04', '2026-05-15 12:15:00-04', 'NetJets', 'NJ-50112', 'Challenger 350', 1);
INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, check_in, check_out, carrier, confirmation_code, sort_order) VALUES
(v_trip2, 'hotel', 'Four Seasons Surf Club, Miami', NULL, '2026-05-15', '2026-05-19', 'Four Seasons', 'FS-228471', 2);
INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, depart_at, arrive_at, carrier, confirmation_code, sort_order) VALUES
(v_trip2, 'ground_transport', 'Opa-Locka Executive', 'Four Seasons Surf Club', '2026-05-15 12:30:00-04', '2026-05-15 13:15:00-04', 'Blacklane', 'BL-91003', 3);
INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, depart_at, arrive_at, carrier, confirmation_code, seat_info, sort_order) VALUES
(v_trip2, 'flight', 'Opa-Locka (OPF)', 'Teterboro (TEB)', '2026-05-19 16:00:00-04', '2026-05-19 19:15:00-04', 'NetJets', 'NJ-50298', 'Challenger 350', 4);

INSERT INTO trips (id, organization_id, created_by, title, start_date, end_date, status, notes)
VALUES (gen_random_uuid(), v_org_id, v_user_id, 'London — Business & Advisory', '2026-06-10', '2026-06-14', 'planning', 'Board meeting + private bank review at Coutts')
RETURNING id INTO v_trip3;

INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, depart_at, arrive_at, carrier, confirmation_code, seat_info, sort_order) VALUES
(v_trip3, 'flight', 'JFK', 'London Heathrow (LHR)', '2026-06-10 19:00:00-04', '2026-06-11 07:00:00+01', 'British Airways', 'BA-CLB-7829', 'First — Suite 2A', 1);
INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, check_in, check_out, carrier, confirmation_code, sort_order) VALUES
(v_trip3, 'hotel', 'Claridge''s, Mayfair', NULL, '2026-06-11', '2026-06-14', 'Claridge''s', 'CLG-40291', 2);
INSERT INTO trip_segments (trip_id, segment_type, from_location, to_location, depart_at, arrive_at, carrier, confirmation_code, sort_order) VALUES
(v_trip3, 'car', 'Heathrow T5', 'Claridge''s', '2026-06-11 07:30:00+01', '2026-06-11 08:45:00+01', 'Addison Lee', 'AL-88201', 3);

-- ============================================================
-- LOYALTY PROGRAMS
-- ============================================================

INSERT INTO loyalty_programs (organization_id, program_name, provider, member_number, tier_status, points_balance, notes) VALUES
(v_org_id, 'NetJets Marquis Card', 'NetJets', 'MQ-4829103', 'Marquis 50-Hour', '32 hours remaining', 'Renews annually in September'),
(v_org_id, 'British Airways Executive Club', 'British Airways', 'BA-92847120', 'Gold', '284,000 Avios', 'Status valid through Mar 2027'),
(v_org_id, 'Marriott Bonvoy', 'Marriott', 'MBV-38291047', 'Ambassador Elite', '1,240,000 points', 'Lifetime status achieved'),
(v_org_id, 'American Express Centurion', 'Amex', 'CENTURION', 'Black Card', '2,100,000 MR points', 'Concierge: 800-525-3355');

-- ============================================================
-- ALERTS (6 alerts — mix of types and statuses)
-- ============================================================

INSERT INTO alerts (id, organization_id, created_by, alert_type, title, body, priority, status, target_role, related_type, related_id)
VALUES (gen_random_uuid(), v_org_id, v_user_id, 'approval', 'Payment authorization: $15,000 to Williams & Associates', 'Q2 legal retainer for estate planning and trust review. This is a recurring quarterly expense. Williams & Associates has been retained since 2019.', 'high', 'open', 'principal', 'bill', (SELECT id FROM bills WHERE vendor = 'Williams & Associates LLP' AND organization_id = v_org_id LIMIT 1))
RETURNING id INTO v_alert1;

INSERT INTO alerts (id, organization_id, created_by, alert_type, title, body, priority, status, target_role)
VALUES (gen_random_uuid(), v_org_id, v_user_id, 'approval', 'Renewal: NetJets share program Q2 — $45,000', 'Quarterly management fee for the Marquis 50-hour card program. 32 hours remaining this cycle. Recommend renewal to maintain availability for Miami and London trips.', 'high', 'open', 'principal')
RETURNING id INTO v_alert2;

INSERT INTO alerts (id, organization_id, created_by, alert_type, title, body, priority, status, target_role)
VALUES (gen_random_uuid(), v_org_id, v_user_id, 'urgent', 'Insurance premium overdue — Capitol Insurance Group', 'Annual umbrella policy premium of $18,750 is now 12 days overdue. Lapse in coverage creates significant personal liability exposure. Recommend immediate payment authorization.', 'urgent', 'open', 'principal')
RETURNING id INTO v_alert3;

INSERT INTO alerts (organization_id, created_by, alert_type, title, body, priority, status, target_role) VALUES
(v_org_id, v_user_id, 'fyi', 'Miami Art Basel trip confirmed', 'All bookings finalized for May 15-19. NetJets confirmed Challenger 350, Four Seasons Surf Club suite reserved, Blacklane ground transport arranged. VIP preview passes secured for May 16.', 'normal', 'resolved', 'all'),
(v_org_id, v_user_id, 'info', 'Q1 spending report available', 'Total Q1 expenditure: $284,390. Aviation: 42%, Property: 18%, Legal: 11%, Travel: 9%, Lifestyle: 8%, Other: 12%. Full breakdown available in the Financial module.', 'normal', 'resolved', 'all'),
(v_org_id, v_user_id, 'action_required', 'Passport renewal required', 'Primary passport expires August 2026. Recommend initiating expedited renewal process now — current processing time is 6-8 weeks. Need to schedule photos and gather documentation.', 'high', 'open', 'ea');

-- ============================================================
-- TASKS (8 tasks)
-- ============================================================

INSERT INTO tasks (organization_id, created_by, assigned_to, title, description, status, priority, due_date) VALUES
(v_org_id, v_user_id, v_user_id, 'Confirm Art Basel dinner reservations', 'Reserve Carbone Miami for May 16 (6 guests), Zuma for May 17 (4 guests). Request private dining room if available.', 'in_progress', 'high', '2026-04-25'),
(v_org_id, v_user_id, v_user_id, 'Renew passport — expires August', 'Schedule appointment at passport agency. Need expedited processing. Current passport #: [see vault]. Photos needed.', 'todo', 'high', '2026-05-15'),
(v_org_id, v_user_id, v_user_id, 'Review Q1 budget vs actual with CFO', 'Schedule 30-min call to review Q1 financials. Key variance: aviation came in 18% over budget due to additional Aspen trip.', 'waiting', 'normal', '2026-04-30'),
(v_org_id, v_user_id, v_user_id, 'Compile holiday gift list', 'Begin assembling list for year-end gifting. Need: client list (12), staff list (8), family (6), professional contacts (15). Budget TBD.', 'todo', 'normal', '2026-10-01'),
(v_org_id, v_user_id, v_user_id, 'Update vehicle registration — Range Rover', 'Registration renewal due May 30. Need updated insurance card from Capitol Insurance Group before filing.', 'todo', 'low', '2026-05-25'),
(v_org_id, v_user_id, v_user_id, 'Schedule annual executive physical', 'Contact Mt. Sinai concierge medicine to schedule. Preferred dates: late May or early June. Full day appointment.', 'todo', 'normal', '2026-05-01'),
(v_org_id, v_user_id, v_user_id, 'London trip — arrange Coutts meeting', 'Coordinate with private banker at Coutts for portfolio review meeting June 12. Need to send agenda items in advance.', 'in_progress', 'high', '2026-05-30'),
(v_org_id, v_user_id, v_user_id, 'Follow up: Hermès Birkin repair', 'Repair submitted Feb 15. Estimated 8-10 week turnaround. Call Hermès Madison Ave for status update.', 'waiting', 'low', '2026-04-30');

-- ============================================================
-- GIFTS (5 entries)
-- ============================================================

INSERT INTO gifts (organization_id, created_by, recipient, occasion, description, amount, date, status, notes) VALUES
(v_org_id, v_user_id, 'Robert Chen', 'Client appreciation', 'Opus One 2019 Magnum + Riedel crystal set', 1200.00, '2026-03-15', 'delivered', 'Sent via Wine.com — delivered to office'),
(v_org_id, v_user_id, 'Sarah Mitchell', 'Birthday — April 22', 'Hermès Carré 90 silk scarf — Cavalcadour', 680.00, '2026-04-18', 'purchased', 'Gift wrap requested, shipping to residence'),
(v_org_id, v_user_id, 'Office Staff (8)', 'Holiday 2026', 'Custom gift baskets — gourmet + spa items', 2400.00, NULL, 'idea', 'Budget $300/person, need vendor recommendations'),
(v_org_id, v_user_id, 'Dr. James Morton', 'Thank you', 'Per Se gift certificate', 500.00, '2026-04-05', 'shipped', 'Mailed to Mt. Sinai office'),
(v_org_id, v_user_id, 'Grandchildren (3)', 'Easter', 'FAO Schwarz curated toy boxes', 900.00, '2026-04-12', 'delivered', '$300 each — age appropriate selections');

-- ============================================================
-- SUBSCRIPTIONS (7 entries)
-- ============================================================

INSERT INTO subscriptions (organization_id, name, provider, amount, frequency, next_renewal, category, auto_renew, status, notes) VALUES
(v_org_id, 'Netflix Premium', 'Netflix', 22.99, 'monthly', '2026-05-01', 'Entertainment', true, 'active', '4K Ultra HD, 4 screens'),
(v_org_id, 'Wall Street Journal', 'Dow Jones', 38.99, 'monthly', '2026-05-01', 'News', true, 'active', 'Digital + print delivery'),
(v_org_id, 'Wine Access Reserve', 'Wine Access', 249.00, 'quarterly', '2026-04-20', 'Lifestyle', true, 'active', 'Premium allocation — renewing soon'),
(v_org_id, 'Peloton All-Access', 'Peloton', 44.00, 'monthly', '2026-05-01', 'Fitness', true, 'active', 'Bike + Tread access'),
(v_org_id, 'ADT Smart Security', 'ADT', 149.97, 'monthly', '2026-05-01', 'Security', true, 'active', '3 properties — $49.99 each'),
(v_org_id, 'Spotify Family', 'Spotify', 16.99, 'monthly', '2026-05-01', 'Entertainment', true, 'active', '6 accounts'),
(v_org_id, 'Bloomberg Terminal', 'Bloomberg LP', 2700.00, 'monthly', '2026-05-01', 'Financial', true, 'active', 'Home office installation');

-- ============================================================
-- MEMBERSHIPS (5 entries)
-- ============================================================

INSERT INTO memberships (organization_id, name, organization_name, member_id, tier, expiry_date, renewal_amount, category, status, notes) VALUES
(v_org_id, 'Palm Beach Country Club', 'PBCC', 'PBCC-1847', 'Platinum', '2026-12-31', 24000.00, 'Social', 'active', 'Golf, tennis, dining, spa. Guest passes: 12/year'),
(v_org_id, 'NetJets Marquis Card', 'NetJets Inc.', 'MQ-4829103', '50-Hour Card', '2026-09-30', 180000.00, 'Aviation', 'active', '32 hours remaining. Heavy/super-mid access'),
(v_org_id, 'MoMA Patron Circle', 'Museum of Modern Art', 'MoMA-PC-2291', 'Patron', '2027-03-31', 12000.00, 'Arts & Culture', 'active', 'VIP previews, curator events, 2 guest passes'),
(v_org_id, 'Soho House', 'Soho House & Co', 'SH-Global-8847', 'Global', '2026-12-31', 4500.00, 'Social', 'active', 'All houses worldwide. NYC, London, Miami primary'),
(v_org_id, 'Core Club', 'Core Club NYC', 'CORE-1192', 'Full Member', '2027-01-31', 18000.00, 'Business', 'active', 'Private business and social club, Midtown');

-- ============================================================
-- PROJECTS (2 projects with budgets)
-- ============================================================

INSERT INTO projects (id, organization_id, created_by, name, project_type, status, location, description, notes)
VALUES (gen_random_uuid(), v_org_id, v_user_id, 'Palm Beach Estate Renovation', 'Real Estate', 'active', 'Palm Beach, FL', 'Full interior renovation of primary residence. Architect: Thomas Kligerman. GC: Turtle Beach Construction. Target completion: Q4 2026.', 'Phase 2 (kitchen + primary suite) begins May 2026')
RETURNING id INTO v_proj1;

INSERT INTO budgets (project_id, category, budgeted, actual, period, notes) VALUES
(v_proj1, 'Architectural & Design', 120000.00, 98000.00, '2026', 'Kligerman Architects — 82% complete'),
(v_proj1, 'General Construction', 450000.00, 380000.00, '2026', 'Turtle Beach — Phase 1 complete, Phase 2 starting'),
(v_proj1, 'Fixtures & Finishes', 80000.00, 45000.00, '2026', 'Holly Hunt selections ordered, 60% received'),
(v_proj1, 'Landscaping', 60000.00, 0.00, '2026', 'Deferred to Phase 3, after construction dust settles'),
(v_proj1, 'Permits & Fees', 15000.00, 14200.00, '2026', 'Town of Palm Beach — all Phase 1 permits secured'),
(v_proj1, 'Contingency', 50000.00, 12000.00, '2026', 'Used for unexpected plumbing reroute');

INSERT INTO projects (id, organization_id, created_by, name, project_type, status, location, description, notes)
VALUES (gen_random_uuid(), v_org_id, v_user_id, 'Yacht Annual Maintenance', 'Marine', 'active', 'Marina Bay, FL', '62ft Sunseeker Manhattan — Annual service and systems overhaul. Marina Bay Yacht Service handling all work.', 'Haul-out scheduled for May 5-19')
RETURNING id INTO v_proj2;

INSERT INTO budgets (project_id, category, budgeted, actual, period, notes) VALUES
(v_proj2, 'Hull & Bottom', 25000.00, 22000.00, '2026', 'Bottom paint + zinc replacement complete'),
(v_proj2, 'Engine Service', 40000.00, 35000.00, '2026', 'Twin MAN V8 — 1000hr service + impeller replacement'),
(v_proj2, 'Electronics & Navigation', 15000.00, 8000.00, '2026', 'Garmin chartplotter upgrade ordered, awaiting install'),
(v_proj2, 'Interior Refresh', 20000.00, 12000.00, '2026', 'Salon upholstery complete, galley counters pending'),
(v_proj2, 'Safety Equipment', 8000.00, 7500.00, '2026', 'Life rafts recertified, new flares, EPIRB battery');

-- ============================================================
-- NOTES (4 internal notes)
-- ============================================================

INSERT INTO notes (organization_id, created_by, title, body, pinned) VALUES
(v_org_id, v_user_id, 'Principal preferences — dining', 'Preferred tables: Carbone NYC (booth 7), Le Bernardin (window), Per Se (salon). Allergies: none. Wine preference: Burgundy and Barolo. Always request still water, no ice.', true),
(v_org_id, v_user_id, 'Travel preferences', 'Window seat always. NetJets preferred over commercial. If commercial: First Class only, BA or Singapore preferred. Hotels: Claridge''s (London), Four Seasons (Miami, preferred Surf Club), Aman (anywhere). Early check-in always requested.', true),
(v_org_id, v_user_id, 'Key contacts quick reference', 'Attorney: Michael Williams — 212-555-0147. Private banker: Sarah Thornton (Coutts) — +44 20 7957 XXXX. Insurance: David Park (Capitol) — 561-555-0189. NetJets concierge: 866-538-5387.', true),
(v_org_id, v_user_id, 'Vehicle information', 'Range Rover Autobiography LWB — Black/Tan — Plate: FL XXXX. Porsche 911 Turbo S — Guards Red — Plate: FL XXXX. Both garaged at Palm Beach. Range Rover: 10k mile service due June. Porsche: annual service due August. SunPass transponder account: login in vault.', false);

-- ============================================================
-- AUDIT LOG (seed some recent activity)
-- ============================================================

INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id, metadata) VALUES
(v_org_id, v_user_id, 'created', 'trip', v_trip2, '{"title": "Miami — Art Basel Week"}'),
(v_org_id, v_user_id, 'paid', 'bill', (SELECT id FROM bills WHERE vendor = 'Atlantic Aviation' AND organization_id = v_org_id LIMIT 1), '{"vendor": "Atlantic Aviation", "amount": 12400}'),
(v_org_id, v_user_id, 'paid', 'bill', (SELECT id FROM bills WHERE vendor = 'Claridge''s London' AND organization_id = v_org_id LIMIT 1), '{"vendor": "Claridge''s London", "amount": 8900}'),
(v_org_id, v_user_id, 'created', 'alert', v_alert3, '{"title": "Insurance premium overdue"}'),
(v_org_id, v_user_id, 'updated', 'task', (SELECT id FROM tasks WHERE title LIKE '%Art Basel dinner%' AND organization_id = v_org_id LIMIT 1), '{"title": "Confirm Art Basel dinner reservations", "status": "in_progress"}'),
(v_org_id, v_user_id, 'paid', 'bill', (SELECT id FROM bills WHERE vendor = 'Sotheby''s' AND organization_id = v_org_id LIMIT 1), '{"vendor": "Sotheby''s", "amount": 125000}'),
(v_org_id, v_user_id, 'created', 'gift', (SELECT id FROM gifts WHERE recipient = 'Robert Chen' AND organization_id = v_org_id LIMIT 1), '{"recipient": "Robert Chen", "description": "Opus One 2019 Magnum"}'),
(v_org_id, v_user_id, 'resolved', 'alert', (SELECT id FROM alerts WHERE title LIKE '%Art Basel trip%' AND organization_id = v_org_id LIMIT 1), '{"title": "Miami Art Basel trip confirmed"}');

END $$;
