import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import GlobeView from './GlobeView';
import TimelineView from './TimelineView';

// ============================================
// CONFIGURATION - Your wallet and contracts
// ============================================
const CONFIG = {
  walletAddress: '0x6F398e7872AC5F75121186678c4E6e015E83C49F', // jdsears_Vault
  contracts: {
    videos: '0xC2B9C77c9FE1a94A8D815Eec0aEC274f89Fe70ef',    // ERC-721 Video Moments
    polaroids: '0xADFa888bCeB4c1F356d8A75Ffa2027a61C91B1d5'  // ERC-1155 Polaroids
  },
  // For OpenSea links
  collectionSlugs: {
    videos: 'moments-of-the-unknown-by-justin-aversano',
    polaroids: 'moments-of-the-unknown-polaroids'
  }
};

// ============================================
// NFT FETCHING - Uses Alchemy API (free tier)
// Get your free API key at: https://www.alchemy.com/
// Set VITE_ALCHEMY_API_KEY in your .env file
// ============================================
async function fetchNFTsFromAlchemy(walletAddress, contractAddress, apiKey) {
  const baseUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey || 'demo'}/getNFTsForOwner`;
  let allNfts = [];
  let pageKey = null;

  try {
    do {
      let url = `${baseUrl}?owner=${walletAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&pageSize=100`;
      if (pageKey) {
        url += `&pageKey=${pageKey}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}`);
      }

      const data = await response.json();
      allNfts = [...allNfts, ...(data.ownedNfts || [])];
      pageKey = data.pageKey || null;
    } while (pageKey);

    return allNfts;
  } catch (error) {
    console.error('Error fetching from Alchemy:', error);
    return allNfts;
  }
}

// Transform Alchemy NFT data to our gallery format
function transformAlchemyNFT(nft, type = 'video') {
  const metadata = nft.raw?.metadata || {};
  const attributes = metadata.attributes || [];
  
  // Extract attributes
  const getAttr = (name) => {
    const attr = attributes.find(a => 
      a.trait_type?.toLowerCase() === name.toLowerCase()
    );
    return attr?.value || '';
  };
  
  const city = getAttr('City');
  const country = getAttr('Country');
  const state = getAttr('State');
  const continent = getAttr('Continent') || 'Unknown';
  const month = getAttr('Month');
  
  // Build location string
  let location = city;
  if (state) location += `, ${state}`;
  if (country && country !== 'United States of America') location += `, ${country}`;
  else if (country === 'United States of America' && !state) location += ', USA';
  if (!location) location = country || 'Unknown Location';
  
  // Extract date from name (e.g., "May 1st - 15:49" -> "May 1")
  const name = nft.name || metadata.name || `Token #${nft.tokenId}`;
  const dateMatch = name.match(/^(\w+)\s+(\d+)/);
  const date = dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : name;
  
  // Convert IPFS URLs to HTTP gateway URLs (fallback only)
  const toHttpUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('ipfs://')) {
      const hash = url.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${hash}`;
    }
    return url;
  };

  // Try multiple sources for animation/video URL
  // PRIORITY: Alchemy cached gateway URLs first (fast!), then fall back to IPFS
  const rawAnimationUrl =
    nft.media?.[0]?.gateway ||  // Alchemy's cached gateway - fastest
    nft.media?.[0]?.raw ||      // Alchemy's raw URL
    metadata.animation_url ||    // Metadata IPFS URL (fallback)
    nft.raw?.metadata?.animation_url ||
    null;

  // Get image - prefer Alchemy's cached URLs
  const rawImageUrl = nft.image?.cachedUrl || nft.image?.pngUrl || nft.image?.thumbnailUrl || nft.image?.originalUrl || metadata.image;
  const imageUrl = toHttpUrl(rawImageUrl);
  const animationUrl = toHttpUrl(rawAnimationUrl);
  const isImageVideo = imageUrl && /\.(mp4|webm|mov|ogv)(\?|$)/i.test(imageUrl);

  return {
    id: `${type}-${nft.tokenId}`,
    tokenId: nft.tokenId,
    name: name,
    date: date,
    location: location,
    description: metadata.description || '',
    image: isImageVideo ? null : imageUrl,
    animationUrl: animationUrl || (isImageVideo ? imageUrl : null),
    continent: continent,
    type: type, // 'video' or 'polaroid'
    contract: type === 'video' ? CONFIG.contracts.videos : CONFIG.contracts.polaroids,
    openseaUrl: `https://opensea.io/assets/ethereum/${type === 'video' ? CONFIG.contracts.videos : CONFIG.contracts.polaroids}/${nft.tokenId}`
  };
}

// ============================================
// PLACEHOLDER DATA - Replace with your actual holdings
// or use the API fetching above
// ============================================
const PLACEHOLDER_NFTS = [
  // These are example entries - update with your actual token IDs
  // Token IDs correspond to days: April 8 = Token 1, April 9 = Token 2, etc.
  {
    id: 'video-24',
    tokenId: '24',
    name: 'May 1st - 15:49',
    date: 'May 1',
    location: 'Paris, France',
    description: 'An emblematic shot documenting a protest at Place de la République with two women holding signs about tax evasion.',
    image: null,
    animationUrl: 'https://verse.works/image/source/static%2Fuploads%2F0xc2b9c77c9fe1a94a8d815eec0aec274f89fe70ef%2Fe995c6b3-e8ba-4181-934c-a1e13b5cdaa8.mp4',
    continent: 'Europe',
    type: 'video',
    special: 'Landmark'
  },
  {
    id: 'video-59',
    tokenId: '59',
    name: 'June 5th - 11:55',
    date: 'June 5',
    location: 'Kauai, Hawaii',
    description: 'A helicopter ride over the island with pilot Samantha, facing fears of heights while flying through extinct volcano hulls.',
    image: null,
    animationUrl: 'https://verse.works/image/source/static%2Fuploads%2F0xc2b9c77c9fe1a94a8d815eec0aec274f89fe70ef%2Fea271827-0c84-49e0-9519-7ecfdc8e317a.mp4',
    continent: 'North America',
    type: 'video'
  },
  {
    id: 'video-200',
    tokenId: '200',
    name: 'October 24th - 19:21',
    date: 'October 24',
    location: 'Zug, Switzerland',
    description: 'A moment captured in the heart of Crypto Valley.',
    image: null,
    animationUrl: null,
    continent: 'Europe',
    type: 'video'
  }
];

// The actual sample data - this will be replaced by API data when available
const SAMPLE_NFTS = PLACEHOLDER_NFTS;

// Generate day number from date string
// MOTU collection starts April 8 = Day 1, ends April 7 = Day 366
const getDayNumber = (dateStr) => {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  const parts = dateStr.split(' ');
  const month = months[parts[0]];
  const day = parseInt(parts[1]);

  // Use UTC to avoid DST issues affecting day calculation
  // April 8, 2024 = day index 98 (Jan has 31, Feb has 29, Mar has 31, Apr 1-7 = 7)
  const date = Date.UTC(2024, month, day);
  const yearStart = Date.UTC(2024, 0, 1);
  const dayIndex = Math.floor((date - yearStart) / (1000 * 60 * 60 * 24));

  // April 8 has dayIndex 98, should be MOTU Day 1
  let motuDay = dayIndex - 97;

  // Wrap around: Jan 1-Apr 7 become days 269-366
  if (motuDay <= 0) {
    motuDay += 366;
  }

  return motuDay;
};

// NFT Card Component
const NFTCard = ({ nft, onClick, index }) => {
  const dayNumber = getDayNumber(nft.date);
  const isVideo = nft.type === 'video';
  const hasMedia = nft.animationUrl || nft.image;

  // Handle video autoplay
  const handleVideoRef = (video) => {
    if (video) {
      video.muted = true; // Ensure muted for autoplay policy
      video.play().catch(() => {
        // Autoplay blocked - will play on hover instead
      });
    }
  };

  return (
    <div
      className="nft-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="nft-card-inner">
        <div className="nft-media">
          <div className="day-badge">
            <span className="day-number">{dayNumber || '?'}</span>
            <span className="day-label">/ 366</span>
          </div>
          <div className="type-badge" data-type={nft.type}>
            {isVideo ? '🎬 Video' : '📸 Polaroid'}
          </div>
          <div className="film-grain"></div>
          {hasMedia ? (
            <div className="nft-preview">
              {nft.animationUrl ? (
                <video
                  ref={handleVideoRef}
                  src={nft.animationUrl}
                  preload="auto"
                  muted
                  loop
                  playsInline
                  autoPlay
                  onMouseEnter={(e) => e.target.play().catch(() => {})}
                />
              ) : nft.image ? (
                <img src={nft.image} alt={nft.name} loading="lazy" />
              ) : null}
            </div>
          ) : (
            <div className="nft-placeholder">
              <div className="super8-frame">
                <div className="sprocket-holes left">
                  {[...Array(4)].map((_, i) => <div key={i} className="hole"></div>)}
                </div>
                <div className="frame-content">
                  <span className="play-icon">{isVideo ? '▶' : '◻'}</span>
                </div>
                <div className="sprocket-holes right">
                  {[...Array(4)].map((_, i) => <div key={i} className="hole"></div>)}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="nft-info">
          <h3 className="nft-date">{nft.date}</h3>
          <p className="nft-location">
            <span className="location-pin">◉</span>
            {nft.location}
          </p>
        </div>
        <div className="continent-tag">{nft.continent}</div>
      </div>
    </div>
  );
};

// Parse structured description into clean format
const parseDescription = (description) => {
  if (!description) return null;

  // Common field patterns in MOTU metadata
  const fields = {};
  const fieldPatterns = [
    { key: 'title', pattern: /Title:\s*([^:]+?)(?=\s*(?:Medium|Dimensions|Comments|$))/i },
    { key: 'medium', pattern: /Medium:\s*([^:]+?)(?=\s*(?:Dimensions|Comments|$))/i },
    { key: 'dimensions', pattern: /Dimensions\s*:\s*([^:]+?)(?=\s*(?:Comments|$))/i },
    { key: 'comments', pattern: /Comments:\s*(.+)$/i }
  ];

  for (const { key, pattern } of fieldPatterns) {
    const match = description.match(pattern);
    if (match) {
      fields[key] = match[1].trim();
    }
  }

  // If we found structured fields, return them
  if (Object.keys(fields).length > 0) {
    return fields;
  }

  // Otherwise return the raw description as comments
  return { comments: description };
};

// Modal Component for detailed view
const NFTModal = ({ nft, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  const dayNumber = getDayNumber(nft.date);
  const isVideo = nft.type === 'video';
  const hasMedia = nft.animationUrl || nft.image;
  const contractAddress = nft.contract || (isVideo ? CONFIG.contracts.videos : CONFIG.contracts.polaroids);

  // Handle video autoplay
  const handleVideoRef = (video) => {
    if (video) {
      video.muted = true; // Ensure muted for autoplay
      video.play().catch(() => {
        // Autoplay blocked - user can use controls
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Navigation arrows */}
      <button
        className="modal-nav prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        disabled={!hasPrev}
        aria-label="Previous"
      >
        ←
      </button>
      <button
        className="modal-nav next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        disabled={!hasNext}
        aria-label="Next"
      >
        →
      </button>

      <div className="modal-content simple" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Main media display */}
        {hasMedia ? (
          nft.animationUrl ? (
            <video
              ref={handleVideoRef}
              src={nft.animationUrl}
              preload="auto"
              controls
              autoPlay
              loop
              muted
              playsInline
              className="modal-media-full"
            />
          ) : (
            <img src={nft.image} alt={nft.name} className="modal-media-full" />
          )
        ) : (
          <div className="modal-no-media">
            <span>{isVideo ? '▶ Video' : '◻ Polaroid'}</span>
          </div>
        )}

        {/* Simple caption */}
        <div className="modal-caption">
          <span className="caption-day">Day {dayNumber}/366</span>
          <span className="caption-date">{nft.date}</span>
          <span className="caption-location">{nft.location}</span>
        </div>
      </div>
    </div>
  );
};

// Filter Component
const FilterBar = ({ continents, activeFilter, setActiveFilter, typeFilter, setTypeFilter, totalCount, hasVideos, hasPolaroids, columns, setColumns, viewMode, setViewMode }) => {
  const columnOptions = [5, 10, 25, 50];

  return (
    <div className="filter-bar">
      <div className="filter-info">
        <span className="collection-count">{totalCount} Moments</span>
      </div>
      <div className="filter-groups">
        {/* View toggle */}
        <div className="filter-group view-toggle">
          <span className="filter-label">View</span>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${viewMode === 'gallery' ? 'active' : ''}`}
              onClick={() => setViewMode('gallery')}
            >
              Gallery
            </button>
            <button
              className={`filter-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </button>
            <button
              className={`filter-btn globe-btn ${viewMode === 'globe' ? 'active' : ''}`}
              onClick={() => setViewMode('globe')}
            >
              <span className="globe-icon">🌍</span> Globe
            </button>
          </div>
        </div>

        {/* Column count - only show in gallery mode */}
        {viewMode === 'gallery' && (
          <div className="filter-group">
            <span className="filter-label">Grid</span>
            <div className="filter-buttons">
              {columnOptions.map(num => (
                <button
                  key={num}
                  className={`filter-btn ${columns === num ? 'active' : ''}`}
                  onClick={() => setColumns(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Type filter */}
        {(hasVideos || hasPolaroids) && (
          <div className="filter-group">
            <span className="filter-label">Type</span>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All
              </button>
              {hasVideos && (
                <button 
                  className={`filter-btn ${typeFilter === 'video' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('video')}
                >
                  Videos
                </button>
              )}
              {hasPolaroids && (
                <button 
                  className={`filter-btn ${typeFilter === 'polaroid' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('polaroid')}
                >
                  Polaroids
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Continent filter */}
        <div className="filter-group">
          <span className="filter-label">Continent</span>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            {continents.map(continent => (
              <button 
                key={continent}
                className={`filter-btn ${activeFilter === continent ? 'active' : ''}`}
                onClick={() => setActiveFilter(continent)}
              >
                {continent}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [nfts, setNfts] = useState(SAMPLE_NFTS);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'video', 'polaroid'
  const [columns, setColumns] = useState(25); // 5, 10, 25, 50
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or 'globe'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('placeholder');
  const [lastUpdated, setLastUpdated] = useState(null);

  // API key
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

  // Load NFTs from API
  const loadNFTs = useCallback(async () => {
    if (!apiKey) {
      console.log('No Alchemy API key found. Using placeholder data.');
      setDataSource('placeholder');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch video moments (ERC-721)
      const videoNFTs = await fetchNFTsFromAlchemy(
        CONFIG.walletAddress,
        CONFIG.contracts.videos,
        apiKey
      );

      // Fetch polaroids (ERC-1155)
      const polaroidNFTs = await fetchNFTsFromAlchemy(
        CONFIG.walletAddress,
        CONFIG.contracts.polaroids,
        apiKey
      );

      // Transform and combine
      const transformedVideos = videoNFTs.map(nft => transformAlchemyNFT(nft, 'video'));
      const transformedPolaroids = polaroidNFTs.map(nft => transformAlchemyNFT(nft, 'polaroid'));

      const allNFTs = [...transformedVideos, ...transformedPolaroids];

      if (allNFTs.length > 0) {
        setNfts(allNFTs);
        setDataSource('api');
        setLastUpdated(new Date());
        console.log(`Loaded ${transformedVideos.length} videos and ${transformedPolaroids.length} polaroids`);
      } else {
        console.log('No NFTs found for this wallet. Using placeholder data.');
        setDataSource('placeholder');
      }
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError('Failed to load NFTs. Showing placeholder data.');
      setDataSource('placeholder');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Fetch NFTs from API on mount
  useEffect(() => {
    loadNFTs();
  }, [loadNFTs]);

  // Get unique continents for filtering
  const continents = [...new Set(nfts.map(nft => nft.continent))].filter(Boolean).sort();

  // Filter NFTs based on active filters
  const filteredNFTs = nfts.filter(nft => {
    const continentMatch = activeFilter === 'all' || nft.continent === activeFilter;
    const typeMatch = typeFilter === 'all' || nft.type === typeFilter;
    return continentMatch && typeMatch;
  });

  // Sort by day number
  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    return getDayNumber(a.date) - getDayNumber(b.date);
  });

  // Check if we have both types
  const hasVideos = nfts.some(n => n.type === 'video');
  const hasPolaroids = nfts.some(n => n.type === 'polaroid');

  // Generate sprocket holes for film borders
  const sprocketCount = 50;

  return (
    <div className="app">
      {/* Elegant Edge Borders */}
      <div className="edge-border left">
        <div className="edge-line"></div>
        <div className="edge-glow"></div>
      </div>
      <div className="edge-border right">
        <div className="edge-line"></div>
        <div className="edge-glow"></div>
      </div>

      {/* Atmospheric Background */}
      <div className="bg-atmosphere">
        <div className="bg-gradient"></div>
        <div className="bg-grain"></div>
        <div className="bg-vignette"></div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          {/* Monogram Logo */}
          <div className="monogram">
            <span className="monogram-letter">J</span>
            <span className="monogram-letter">S</span>
          </div>

          <div className="logo-section">
            <p className="artist-name">JUSTIN AVERSANO</p>
            <h1 className="title">
              <span className="title-main">Moments</span>
              <span className="title-sub"><span className="title-muted">of the </span>Unknown</span>
            </h1>
          </div>

          <div className="collector-brand">
            <span className="collector-name">jdsears</span>
            <span className="collector-label">Collection</span>
          </div>
        </div>
      </header>

      {/* Personal Connection Section */}
      <section className="personal-connection">
        <div className="connection-content">
          <h2 className="connection-title">On Collecting Humanity</h2>

          <div className="connection-quote">
            <p className="quote-text">
              "In a world that moves so fast, Justin taught me to pause.
              Each ten-second moment is a meditation on what it means to be human—
              a stranger's laugh in Tokyo, rain falling on cobblestones in Paris,
              the quiet reverence of a mountain at dawn.
            </p>
            <p className="quote-text">
              These aren't just NFTs in my wallet. They're reminders that
              somewhere on this spinning earth, at that exact moment,
              life was happening. And it was beautiful."
            </p>
          </div>

          <div className="meaningful-moments">
            <h3 className="moments-title">Moments That Move Me</h3>
            <div className="moments-grid">
              <div className="moment-card">
                <span className="moment-icon">🌸</span>
                <span className="moment-place">Tokyo, Japan</span>
                <span className="moment-why">Where I first fell in love with street photography</span>
              </div>
              <div className="moment-card">
                <span className="moment-icon">🗼</span>
                <span className="moment-place">Paris, France</span>
                <span className="moment-why">The city that taught me to slow down</span>
              </div>
              <div className="moment-card">
                <span className="moment-icon">🌊</span>
                <span className="moment-place">Kauai, Hawaii</span>
                <span className="moment-why">Nature's reminder of how small we are</span>
              </div>
              <div className="moment-card">
                <span className="moment-icon">🏔️</span>
                <span className="moment-place">Mt. Fuji, Japan</span>
                <span className="moment-why">Sacred ground, sacred moments</span>
              </div>
            </div>
          </div>

          <div className="connection-footer">
            <p className="connection-philosophy">
              "We are all just walking each other home."
            </p>
            <span className="connection-signature">jdsears</span>
          </div>
        </div>
      </section>

      {/* Collection Info */}
      <section className="collection-intro">
        <div className="intro-content">
          <p className="intro-text">
            A personal journey through Justin Aversano's cinematic portrait of humanity,
            captured over 366 days across all seven continents.
            Each moment is a 10-second window into our shared human experience.
          </p>
          <div className="collection-stats">
            <div className="stat">
              <span className="stat-number">{nfts.length}</span>
              <span className="stat-label">In Collection</span>
            </div>
            <div className="stat">
              <span className="stat-number">{nfts.filter(n => n.type === 'video').length}</span>
              <span className="stat-label">Videos</span>
            </div>
            <div className="stat">
              <span className="stat-number">{nfts.filter(n => n.type === 'polaroid').length}</span>
              <span className="stat-label">Polaroids</span>
            </div>
            <div className="stat">
              <span className="stat-number">{continents.length}</span>
              <span className="stat-label">Continents</span>
            </div>
          </div>
          {dataSource === 'placeholder' && (
            <p className="data-notice">
              Showing placeholder data. Add VITE_ALCHEMY_API_KEY to load your actual holdings.
            </p>
          )}
        </div>
      </section>

      {/* Collector Info */}
      <section className="collector-section">
        <div className="collector-badge">
          <span className="collector-label">Collected by</span>
          <span className="collector-name">jdsears_Vault</span>
          <a
            href={`https://opensea.io/jdsears_Vault`}
            target="_blank"
            rel="noopener noreferrer"
            className="collector-link"
          >
            View Full Collection →
          </a>
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar
        continents={continents}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        totalCount={sortedNFTs.length}
        hasVideos={hasVideos}
        hasPolaroids={hasPolaroids}
        columns={columns}
        setColumns={setColumns}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Content - Gallery, Timeline, or Globe */}
      {viewMode === 'globe' ? (
        <GlobeView
          videos={nfts}
          onSelectVideo={(video) => {
            const index = sortedNFTs.findIndex(n => n.id === video.id);
            if (index !== -1) setSelectedIndex(index);
          }}
        />
      ) : viewMode === 'timeline' ? (
        <TimelineView
          nfts={sortedNFTs}
          onSelectNFT={(nft) => {
            const index = sortedNFTs.findIndex(n => n.id === nft.id);
            if (index !== -1) setSelectedIndex(index);
          }}
        />
      ) : (
        <main className="gallery">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading your moments...</p>
            </div>
          ) : error ? (
            <div className="error">
              <p>{error}</p>
            </div>
          ) : (
            <div className="gallery-grid" style={{ '--columns': columns }}>
              {sortedNFTs.map((nft, index) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onClick={() => setSelectedIndex(index)}
                  index={index}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* Modal */}
      {selectedIndex !== null && sortedNFTs[selectedIndex] && (
        <NFTModal
          nft={sortedNFTs[selectedIndex]}
          onClose={() => setSelectedIndex(null)}
          onPrev={() => setSelectedIndex(i => Math.max(0, i - 1))}
          onNext={() => setSelectedIndex(i => Math.min(sortedNFTs.length - 1, i + 1))}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < sortedNFTs.length - 1}
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-quote">
            "What I discovered while shooting is that love has so many forms.
            It became about unity, closeness, intimacy.
            The love of humanity and recognizing we are one human family."
          </div>
          <div className="footer-credit">— Justin Aversano</div>
        </div>
        <div className="footer-links">
          <a href="https://momentsoftheunknown.com" target="_blank" rel="noopener noreferrer">
            Official Site
          </a>
          <span className="divider">•</span>
          <a href="https://twitter.com/justinaversano" target="_blank" rel="noopener noreferrer">
            @justinaversano
          </a>
          <span className="divider">•</span>
          <button
            className="footer-refresh-btn"
            onClick={loadNFTs}
            disabled={loading}
          >
            {loading ? '...' : 'Refresh'}
          </button>
          {lastUpdated && (
            <span className="footer-updated">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </footer>

    </div>
  );
}

export default App;
