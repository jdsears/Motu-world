import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';

// City coordinates database
const CITY_COORDS = {
  // Europe
  'paris': { lat: 48.8566, lng: 2.3522 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'berlin': { lat: 52.52, lng: 13.405 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'zurich': { lat: 47.3769, lng: 8.5417 },
  'zug': { lat: 47.1724, lng: 8.5173 },
  'munich': { lat: 48.1351, lng: 11.582 },
  'milan': { lat: 45.4642, lng: 9.19 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'dublin': { lat: 53.3498, lng: -6.2603 },
  'copenhagen': { lat: 55.6761, lng: 12.5683 },
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'oslo': { lat: 59.9139, lng: 10.7522 },
  'helsinki': { lat: 60.1699, lng: 24.9384 },
  'athens': { lat: 37.9838, lng: 23.7275 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'moscow': { lat: 55.7558, lng: 37.6173 },
  'venice': { lat: 45.4408, lng: 12.3155 },
  'florence': { lat: 43.7696, lng: 11.2558 },
  'brussels': { lat: 50.8503, lng: 4.3517 },
  'geneva': { lat: 46.2044, lng: 6.1432 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'nice': { lat: 43.7102, lng: 7.262 },
  'monaco': { lat: 43.7384, lng: 7.4246 },

  // Asia
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'kyoto': { lat: 35.0116, lng: 135.7681 },
  'osaka': { lat: 34.6937, lng: 135.5023 },
  'seoul': { lat: 37.5665, lng: 126.978 },
  'beijing': { lat: 39.9042, lng: 116.4074 },
  'shanghai': { lat: 31.2304, lng: 121.4737 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'mumbai': { lat: 19.076, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'tel aviv': { lat: 32.0853, lng: 34.7818 },
  'jerusalem': { lat: 31.7683, lng: 35.2137 },
  'mt. fuji': { lat: 35.3606, lng: 138.7274 },
  'bali': { lat: -8.3405, lng: 115.092 },
  'hanoi': { lat: 21.0285, lng: 105.8542 },
  'ho chi minh': { lat: 10.8231, lng: 106.6297 },
  'kuala lumpur': { lat: 3.139, lng: 101.6869 },
  'manila': { lat: 14.5995, lng: 120.9842 },
  'taipei': { lat: 25.033, lng: 121.5654 },

  // North America
  'new york': { lat: 40.7128, lng: -74.006 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'washington': { lat: 38.9072, lng: -77.0369 },
  'austin': { lat: 30.2672, lng: -97.7431 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'las vegas': { lat: 36.1699, lng: -115.1398 },
  'portland': { lat: 45.5152, lng: -122.6784 },
  'phoenix': { lat: 33.4484, lng: -112.074 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'montreal': { lat: 45.5017, lng: -73.5673 },
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  'hawaii': { lat: 19.8968, lng: -155.5828 },
  'kauai': { lat: 22.0964, lng: -159.5261 },
  'maui': { lat: 20.7984, lng: -156.3319 },
  'oahu': { lat: 21.4389, lng: -158.0001 },
  'honolulu': { lat: 21.3069, lng: -157.8583 },
  'nashville': { lat: 36.1627, lng: -86.7816 },
  'new orleans': { lat: 29.9511, lng: -90.0715 },
  'atlanta': { lat: 33.749, lng: -84.388 },
  'dallas': { lat: 32.7767, lng: -96.797 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 },
  'san diego': { lat: 32.7157, lng: -117.1611 },

  // South America
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'lima': { lat: -12.0464, lng: -77.0428 },
  'bogota': { lat: 4.711, lng: -74.0721 },
  'santiago': { lat: -33.4489, lng: -70.6693 },
  'caracas': { lat: 10.4806, lng: -66.9036 },
  'medellin': { lat: 6.2442, lng: -75.5812 },

  // Africa
  'cairo': { lat: 30.0444, lng: 31.2357 },
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'johannesburg': { lat: -26.2041, lng: 28.0473 },
  'nairobi': { lat: -1.2921, lng: 36.8219 },
  'marrakech': { lat: 31.6295, lng: -7.9811 },
  'casablanca': { lat: 33.5731, lng: -7.5898 },
  'lagos': { lat: 6.5244, lng: 3.3792 },
  'accra': { lat: 5.6037, lng: -0.187 },

  // Oceania
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'auckland': { lat: -36.8509, lng: 174.7645 },
  'brisbane': { lat: -27.4705, lng: 153.026 },
  'perth': { lat: -31.9505, lng: 115.8605 },
  'wellington': { lat: -41.2866, lng: 174.7756 },
  'fiji': { lat: -17.7134, lng: 178.065 },

  // Antarctica
  'antarctica': { lat: -82.8628, lng: 135.0 },
  'mcmurdo': { lat: -77.8419, lng: 166.6863 },
};

// Get coordinates from location string
function getCoordinates(location) {
  if (!location) return null;

  const locationLower = location.toLowerCase();

  // Try to find a matching city
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (locationLower.includes(city)) {
      return coords;
    }
  }

  // Try country-level fallbacks
  if (locationLower.includes('japan')) return CITY_COORDS['tokyo'];
  if (locationLower.includes('france')) return CITY_COORDS['paris'];
  if (locationLower.includes('italy')) return CITY_COORDS['rome'];
  if (locationLower.includes('germany')) return CITY_COORDS['berlin'];
  if (locationLower.includes('spain')) return CITY_COORDS['barcelona'];
  if (locationLower.includes('netherlands')) return CITY_COORDS['amsterdam'];
  if (locationLower.includes('switzerland')) return CITY_COORDS['zurich'];
  if (locationLower.includes('uk') || locationLower.includes('england') || locationLower.includes('united kingdom')) return CITY_COORDS['london'];
  if (locationLower.includes('australia')) return CITY_COORDS['sydney'];
  if (locationLower.includes('brazil')) return CITY_COORDS['rio de janeiro'];
  if (locationLower.includes('china')) return CITY_COORDS['beijing'];
  if (locationLower.includes('india')) return CITY_COORDS['mumbai'];
  if (locationLower.includes('korea')) return CITY_COORDS['seoul'];
  if (locationLower.includes('usa') || locationLower.includes('united states')) return CITY_COORDS['new york'];
  if (locationLower.includes('canada')) return CITY_COORDS['toronto'];
  if (locationLower.includes('mexico')) return CITY_COORDS['mexico city'];

  return null;
}

// Get day number from date string (same logic as main app)
const getDayNumber = (dateStr) => {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  const parts = dateStr.split(' ');
  const month = months[parts[0]];
  const day = parseInt(parts[1]);
  const date = Date.UTC(2024, month, day);
  const yearStart = Date.UTC(2024, 0, 1);
  const dayIndex = Math.floor((date - yearStart) / (1000 * 60 * 60 * 24));
  let motuDay = dayIndex - 97;
  if (motuDay <= 0) motuDay += 366;
  return motuDay;
};

// Globe View Component
const GlobeView = ({ videos, onSelectVideo }) => {
  const globeRef = useRef();
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Process videos into points with coordinates
  const points = useMemo(() => {
    return videos
      .filter(v => v.type === 'video')
      .map(video => {
        const coords = getCoordinates(video.location);
        if (!coords) return null;
        return {
          ...video,
          lat: coords.lat,
          lng: coords.lng,
          dayNumber: getDayNumber(video.date),
        };
      })
      .filter(Boolean);
  }, [videos]);

  // Auto-rotate globe
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.controls().enableZoom = true;
      globeRef.current.controls().minDistance = 150;
      globeRef.current.controls().maxDistance = 500;

      // Set initial view
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  // Stop rotation when point is selected
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = !selectedPoint;
    }
  }, [selectedPoint]);

  const handlePointClick = (point) => {
    setSelectedPoint(point);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
    }
  };

  const handleCloseDetail = () => {
    setSelectedPoint(null);
    if (globeRef.current) {
      globeRef.current.pointOfView({ altitude: 2.5 }, 1000);
    }
  };

  return (
    <div className="globe-container">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

        // Points layer - gold/warm color to match site theme
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#ff4444'}
        pointAltitude={0.02}
        pointRadius={0.6}
        pointsMerge={false}
        onPointClick={handlePointClick}
        onPointHover={setHoveredPoint}

        // Rings layer (pulsing effect) - warm gold rings
        ringsData={points}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => t => `rgba(255, 68, 68, ${1 - t})`}
        ringMaxRadius={4}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1200}

        // Atmosphere - soft blue glow
        atmosphereColor="#4da6ff"
        atmosphereAltitude={0.2}

        // Styling
        width={window.innerWidth}
        height={window.innerHeight - 200}
      />

      {/* Hover tooltip */}
      {hoveredPoint && !selectedPoint && (
        <div className="globe-tooltip">
          <span className="tooltip-day">Day {hoveredPoint.dayNumber}</span>
          <span className="tooltip-date">{hoveredPoint.date}</span>
          <span className="tooltip-location">{hoveredPoint.location}</span>
        </div>
      )}

      {/* Selected video detail panel */}
      {selectedPoint && (
        <div className="globe-detail-panel">
          <button className="detail-close" onClick={handleCloseDetail}>✕</button>

          <div className="detail-header">
            <span className="detail-day">Day {selectedPoint.dayNumber}/366</span>
            <h2 className="detail-date">{selectedPoint.date}</h2>
            <p className="detail-location">{selectedPoint.location}</p>
          </div>

          <div className="detail-media">
            {selectedPoint.animationUrl ? (
              <video
                src={selectedPoint.animationUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div className="no-video">Video unavailable</div>
            )}
          </div>

          {selectedPoint.description && (
            <div className="detail-description">
              <p>{selectedPoint.description}</p>
            </div>
          )}

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">Continent</span>
              <span className="meta-value">{selectedPoint.continent}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Token ID</span>
              <span className="meta-value">#{selectedPoint.tokenId}</span>
            </div>
          </div>

          <a
            href={selectedPoint.openseaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-opensea-link"
          >
            View on OpenSea →
          </a>
        </div>
      )}

      {/* Stats overlay */}
      <div className="globe-stats">
        <span className="globe-stat">{points.length} Locations</span>
        <span className="globe-stat-divider">•</span>
        <span className="globe-stat">7 Continents</span>
      </div>

      {/* Instructions */}
      <div className="globe-instructions">
        Drag to rotate • Scroll to zoom • Click a marker for details
      </div>
    </div>
  );
};

export default GlobeView;
