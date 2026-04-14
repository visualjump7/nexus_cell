-- Add coordinate columns to trip_segments for Mapbox map
ALTER TABLE trip_segments ADD COLUMN IF NOT EXISTS from_lat DOUBLE PRECISION;
ALTER TABLE trip_segments ADD COLUMN IF NOT EXISTS from_lng DOUBLE PRECISION;
ALTER TABLE trip_segments ADD COLUMN IF NOT EXISTS to_lat DOUBLE PRECISION;
ALTER TABLE trip_segments ADD COLUMN IF NOT EXISTS to_lng DOUBLE PRECISION;

-- Seed coordinates for demo trip segments
-- Aspen Winter Trip
UPDATE trip_segments SET from_lat = 40.8501, from_lng = -74.0608, to_lat = 39.2232, to_lng = -106.8688
  WHERE from_location LIKE '%TEB%' AND to_location LIKE '%ASE%';
UPDATE trip_segments SET from_lat = 39.2232, from_lng = -106.8688, to_lat = 39.1869, to_lng = -106.8186
  WHERE segment_type = 'hotel' AND from_location LIKE '%Little Nell%';
UPDATE trip_segments SET from_lat = 39.2232, from_lng = -106.8688, to_lat = 39.1869, to_lng = -106.8186
  WHERE segment_type = 'car' AND from_location LIKE '%Aspen Airport%';
UPDATE trip_segments SET from_lat = 39.2232, from_lng = -106.8688, to_lat = 40.8501, to_lng = -74.0608
  WHERE from_location LIKE '%ASE%' AND to_location LIKE '%TEB%';

-- Miami Art Basel
UPDATE trip_segments SET from_lat = 40.8501, from_lng = -74.0608, to_lat = 25.9070, to_lng = -80.2784
  WHERE from_location LIKE '%TEB%' AND to_location LIKE '%OPF%';
UPDATE trip_segments SET from_lat = 25.8867, from_lng = -80.1209, to_lat = 25.8867, to_lng = -80.1209
  WHERE segment_type = 'hotel' AND from_location LIKE '%Four Seasons%';
UPDATE trip_segments SET from_lat = 25.9070, from_lng = -80.2784, to_lat = 25.8867, to_lng = -80.1209
  WHERE segment_type = 'ground_transport' AND from_location LIKE '%Opa-Locka%';
UPDATE trip_segments SET from_lat = 25.9070, from_lng = -80.2784, to_lat = 40.8501, to_lng = -74.0608
  WHERE from_location LIKE '%OPF%' AND to_location LIKE '%TEB%';

-- London Business
UPDATE trip_segments SET from_lat = 40.6413, from_lng = -73.7781, to_lat = 51.4700, to_lng = -0.4543
  WHERE from_location LIKE '%JFK%' AND to_location LIKE '%LHR%';
UPDATE trip_segments SET from_lat = 51.5120, from_lng = -0.1470, to_lat = 51.5120, to_lng = -0.1470
  WHERE segment_type = 'hotel' AND from_location LIKE '%Claridge%';
UPDATE trip_segments SET from_lat = 51.4700, from_lng = -0.4543, to_lat = 51.5120, to_lng = -0.1470
  WHERE segment_type = 'car' AND from_location LIKE '%Heathrow%';
