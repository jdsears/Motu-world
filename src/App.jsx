import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

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
async function fetchNFTsFromAlchemy(walletAddress, contractAddress, apiKey, addLog) {
  const logPrefix = `[Alchemy:${contractAddress.slice(0, 8)}...]`;
  const baseUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey || 'demo'}/getNFTsForOwner`;
  let allNfts = [];
  let pageKey = null;
  let pageCount = 0;

  addLog?.(`${logPrefix} Starting fetch for contract ${contractAddress}`);
  addLog?.(`${logPrefix} Wallet: ${walletAddress}`);
  addLog?.(`${logPrefix} API Key present: ${apiKey ? 'YES (' + apiKey.slice(0, 4) + '...)' : 'NO'}`);

  try {
    // Paginate through all results
    do {
      pageCount++;
      let url = `${baseUrl}?owner=${walletAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&pageSize=100`;
      if (pageKey) {
        url += `&pageKey=${pageKey}`;
      }

      addLog?.(`${logPrefix} Fetching page ${pageCount}...`);
      console.log(`${logPrefix} Fetching:`, url.replace(apiKey, 'API_KEY_HIDDEN'));

      const response = await fetch(url);

      addLog?.(`${logPrefix} Response status: ${response.status} ${response.statusText}`);
      console.log(`${logPrefix} Response:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        addLog?.(`${logPrefix} ERROR: ${errorText.slice(0, 200)}`);
        console.error(`${logPrefix} Error response body:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}`);
      }

      const data = await response.json();
      const nftsInPage = data.ownedNfts?.length || 0;
      addLog?.(`${logPrefix} Page ${pageCount}: Got ${nftsInPage} NFTs`);
      console.log(`${logPrefix} Page ${pageCount} data:`, { nftsInPage, hasMore: !!data.pageKey });

      allNfts = [...allNfts, ...(data.ownedNfts || [])];
      pageKey = data.pageKey || null;
    } while (pageKey);

    addLog?.(`${logPrefix} DONE: Total ${allNfts.length} NFTs fetched`);
    return allNfts;
  } catch (error) {
    addLog?.(`${logPrefix} FETCH ERROR: ${error.message}`);
    console.error(`${logPrefix} Error fetching from Alchemy:`, error);
    return allNfts; // Return what we have so far
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
  
  // Convert IPFS URLs to HTTP gateway URLs
  const toHttpUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('ipfs://')) {
      // Convert ipfs:// to HTTP gateway
      const hash = url.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${hash}`;
    }
    return url;
  };

  // Try multiple sources for animation/video URL
  const rawAnimationUrl =
    metadata.animation_url ||
    nft.raw?.metadata?.animation_url ||
    nft.media?.[0]?.gateway ||
    nft.media?.[0]?.raw ||
    null;

  // Get image, checking if it might actually be a video
  const rawImageUrl = nft.image?.cachedUrl || nft.image?.thumbnailUrl || nft.image?.originalUrl || metadata.image;
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
                  muted
                  loop
                  playsInline
                  autoPlay
                  onMouseEnter={(e) => e.target.play().catch(() => {})}
                  onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
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
              controls
              autoPlay
              loop
              muted
              playsInline
              className="modal-media-full"
              onError={(e) => console.error('Modal video load error:', nft.animationUrl, e)}
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
const FilterBar = ({ continents, activeFilter, setActiveFilter, typeFilter, setTypeFilter, totalCount, hasVideos, hasPolaroids }) => {
  return (
    <div className="filter-bar">
      <div className="filter-info">
        <span className="collection-count">{totalCount} Moments</span>
      </div>
      <div className="filter-groups">
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

// Debug Panel Component
const DebugPanel = ({ logs, isOpen, onToggle, onClear, apiKeyStatus, dataSource }) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '8px 12px',
          background: apiKeyStatus === 'found' ? '#2a5a2a' : '#5a2a2a',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      >
        API: {apiKeyStatus} | Source: {dataSource} | Show Debug
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '500px',
      maxHeight: '400px',
      background: 'rgba(0,0,0,0.95)',
      color: '#0f0',
      padding: '10px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 9999,
      border: '1px solid #333'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <strong>Debug Log (API: {apiKeyStatus} | Source: {dataSource})</strong>
        <div>
          <button onClick={onClear} style={{ marginRight: '5px', cursor: 'pointer' }}>Clear</button>
          <button onClick={onToggle} style={{ cursor: 'pointer' }}>Close</button>
        </div>
      </div>
      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {logs.length === 0 ? (
          <div style={{ color: '#666' }}>No logs yet. Click Refresh to load NFTs.</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{
              borderBottom: '1px solid #222',
              padding: '2px 0',
              color: log.msg.includes('ERROR') ? '#f55' : log.msg.includes('SUCCESS') || log.msg.includes('DONE') ? '#5f5' : '#0f0'
            }}>
              <span style={{ color: '#666' }}>[{log.time}]</span> {log.msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// View Switcher Component
const ViewSwitcher = ({ currentView, setCurrentView, hasVideos }) => {
  return (
    <div className="view-switcher">
      <button
        className={`view-btn ${currentView === 'gallery' ? 'active' : ''}`}
        onClick={() => setCurrentView('gallery')}
        title="Gallery View"
      >
        <span className="view-icon">▦</span>
        <span className="view-label">Gallery</span>
      </button>
      <button
        className={`view-btn ${currentView === 'tunnel' ? 'active' : ''}`}
        onClick={() => setCurrentView('tunnel')}
        title="Tunnel View"
      >
        <span className="view-icon">◎</span>
        <span className="view-label">Tunnel</span>
      </button>
      {hasVideos && (
        <button
          className={`view-btn ${currentView === 'map' ? 'active' : ''}`}
          onClick={() => setCurrentView('map')}
          title="Map View (Videos)"
        >
          <span className="view-icon">◐</span>
          <span className="view-label">Map</span>
        </button>
      )}
    </div>
  );
};

// Tunnel View Component - 3D scrolling experience
const TunnelView = ({ nfts, onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % nfts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlay, nfts.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentIndex(i => Math.min(nfts.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentIndex(i => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nfts.length]);

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      setCurrentIndex(i => Math.min(nfts.length - 1, i + 1));
    } else {
      setCurrentIndex(i => Math.max(0, i - 1));
    }
  };

  const currentNft = nfts[currentIndex];
  const dayNumber = getDayNumber(currentNft?.date);

  return (
    <div className="tunnel-view" ref={containerRef} onWheel={handleWheel}>
      <div className="tunnel-controls">
        <button
          className={`tunnel-autoplay ${isAutoPlay ? 'active' : ''}`}
          onClick={() => setIsAutoPlay(!isAutoPlay)}
        >
          {isAutoPlay ? '⏸ Pause' : '▶ Auto'}
        </button>
        <span className="tunnel-counter">{currentIndex + 1} / {nfts.length}</span>
      </div>

      <div className="tunnel-stage">
        {/* Previous items (fading into distance) */}
        {[-3, -2, -1].map(offset => {
          const idx = currentIndex + offset;
          if (idx < 0) return null;
          const nft = nfts[idx];
          return (
            <div
              key={nft.id}
              className="tunnel-item"
              style={{
                transform: `translateZ(${offset * 200}px) scale(${1 + offset * 0.15})`,
                opacity: 0.3 + (offset + 3) * 0.2,
                zIndex: offset
              }}
            >
              {nft.image && <img src={nft.image} alt={nft.name} />}
            </div>
          );
        })}

        {/* Current item */}
        <div
          className="tunnel-item current"
          onClick={() => onSelect(currentIndex)}
        >
          {currentNft?.animationUrl ? (
            <video src={currentNft.animationUrl} autoPlay muted loop playsInline />
          ) : currentNft?.image ? (
            <img src={currentNft.image} alt={currentNft.name} />
          ) : (
            <div className="tunnel-placeholder">Day {dayNumber}</div>
          )}
        </div>

        {/* Next items (coming from distance) */}
        {[1, 2, 3].map(offset => {
          const idx = currentIndex + offset;
          if (idx >= nfts.length) return null;
          const nft = nfts[idx];
          return (
            <div
              key={nft.id}
              className="tunnel-item"
              style={{
                transform: `translateZ(${offset * -200}px) scale(${1 - offset * 0.15})`,
                opacity: 0.7 - offset * 0.2,
                zIndex: -offset
              }}
            >
              {nft.image && <img src={nft.image} alt={nft.name} />}
            </div>
          );
        })}
      </div>

      <div className="tunnel-info">
        <div className="tunnel-day">Day {dayNumber}/366</div>
        <div className="tunnel-date">{currentNft?.date}</div>
        <div className="tunnel-location">{currentNft?.location}</div>
      </div>

      <div className="tunnel-nav">
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          ←
        </button>
        <button
          onClick={() => setCurrentIndex(i => Math.min(nfts.length - 1, i + 1))}
          disabled={currentIndex === nfts.length - 1}
        >
          →
        </button>
      </div>

      <div className="tunnel-hint">Use arrow keys or scroll to navigate • Click to view details</div>
    </div>
  );
};

// Map View Component - World map with video locations
const MapView = ({ nfts, onSelect }) => {
  // Filter to only videos with valid locations
  const videoNfts = nfts.filter(n => n.type === 'video' && n.location && n.location !== 'Unknown Location');

  // Group by continent for stats
  const continentCounts = videoNfts.reduce((acc, nft) => {
    acc[nft.continent] = (acc[nft.continent] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="map-view">
      <div className="map-header">
        <h2>Video Moments Around the World</h2>
        <p>{videoNfts.length} videos captured across {Object.keys(continentCounts).length} continents</p>
      </div>

      <div className="map-container">
        <svg viewBox="0 0 1000 500" className="world-map">
          {/* Simplified world map paths */}
          <path className="continent" d="M150,120 Q200,100 250,120 L280,180 Q250,220 200,200 L150,160 Z" /> {/* North America */}
          <path className="continent" d="M200,250 Q230,240 260,260 L270,350 Q240,380 210,360 L190,300 Z" /> {/* South America */}
          <path className="continent" d="M420,100 Q500,80 580,100 L600,200 Q550,240 480,220 L420,160 Z" /> {/* Europe */}
          <path className="continent" d="M450,220 Q520,200 600,230 L620,380 Q560,420 480,400 L440,300 Z" /> {/* Africa */}
          <path className="continent" d="M620,100 Q720,80 820,120 L850,280 Q780,320 680,280 L620,180 Z" /> {/* Asia */}
          <path className="continent" d="M750,350 Q800,330 850,350 L860,420 Q820,450 770,430 L750,380 Z" /> {/* Oceania */}
          <path className="continent" d="M350,450 Q450,440 550,460 L560,480 Q450,490 350,480 Z" /> {/* Antarctica */}
        </svg>

        {/* Continent labels with counts */}
        <div className="map-markers">
          {Object.entries({
            'North America': { x: 20, y: 25 },
            'South America': { x: 25, y: 55 },
            'Europe': { x: 48, y: 22 },
            'Africa': { x: 50, y: 45 },
            'Asia': { x: 70, y: 25 },
            'Oceania': { x: 80, y: 70 }
          }).map(([continent, pos]) => (
            continentCounts[continent] && (
              <div
                key={continent}
                className="map-marker"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <span className="marker-count">{continentCounts[continent]}</span>
                <span className="marker-label">{continent}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Video list by continent */}
      <div className="map-video-list">
        {Object.entries(continentCounts).sort((a, b) => b[1] - a[1]).map(([continent, count]) => (
          <div key={continent} className="continent-section">
            <h3>{continent} <span>({count} videos)</span></h3>
            <div className="continent-videos">
              {videoNfts
                .filter(n => n.continent === continent)
                .map((nft, idx) => (
                  <div
                    key={nft.id}
                    className="map-video-card"
                    onClick={() => onSelect(nfts.findIndex(n => n.id === nft.id))}
                  >
                    {nft.image ? (
                      <img src={nft.image} alt={nft.name} />
                    ) : (
                      <div className="video-placeholder">▶</div>
                    )}
                    <div className="video-info">
                      <span className="video-date">{nft.date}</span>
                      <span className="video-location">{nft.location}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        ))}
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
  const [currentView, setCurrentView] = useState('gallery'); // 'gallery', 'tunnel', 'map'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('placeholder');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [debugOpen, setDebugOpen] = useState(false);

  // Add a log entry
  const addLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[DEBUG ${time}]`, msg);
    setDebugLogs(prev => [...prev, { time, msg }]);
  }, []);

  // Check API key status
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  const apiKeyStatus = apiKey ? 'found' : 'missing';

  // Reusable function to load NFTs
  const loadNFTs = useCallback(async () => {
    setDebugLogs([]); // Clear previous logs
    addLog('=== Starting NFT Load ===');
    addLog(`Environment: ${import.meta.env.MODE}`);
    addLog(`API Key Status: ${apiKey ? 'FOUND (' + apiKey.slice(0, 4) + '...' + apiKey.slice(-4) + ')' : 'NOT FOUND'}`);
    addLog(`All env vars: ${JSON.stringify(Object.keys(import.meta.env))}`);

    if (!apiKey) {
      addLog('ERROR: No Alchemy API key found!');
      addLog('Make sure VITE_ALCHEMY_API_KEY is set in Railway environment variables');
      console.log('No Alchemy API key found. Using placeholder data.');
      setDataSource('placeholder');
      return;
    }

    setLoading(true);
    setError(null);
    addLog('Loading started...');

    try {
      // Fetch video moments (ERC-721)
      addLog('--- Fetching Video Moments (ERC-721) ---');
      const videoNFTs = await fetchNFTsFromAlchemy(
        CONFIG.walletAddress,
        CONFIG.contracts.videos,
        apiKey,
        addLog
      );

      // Fetch polaroids (ERC-1155)
      addLog('--- Fetching Polaroids (ERC-1155) ---');
      const polaroidNFTs = await fetchNFTsFromAlchemy(
        CONFIG.walletAddress,
        CONFIG.contracts.polaroids,
        apiKey,
        addLog
      );

      // Transform and combine
      addLog(`Transforming: ${videoNFTs.length} videos, ${polaroidNFTs.length} polaroids`);
      const transformedVideos = videoNFTs.map(nft => transformAlchemyNFT(nft, 'video'));
      const transformedPolaroids = polaroidNFTs.map(nft => transformAlchemyNFT(nft, 'polaroid'));

      const allNFTs = [...transformedVideos, ...transformedPolaroids];

      if (allNFTs.length > 0) {
        setNfts(allNFTs);
        setDataSource('api');
        setLastUpdated(new Date());
        addLog(`SUCCESS: Loaded ${allNFTs.length} total NFTs`);
        console.log(`Loaded ${transformedVideos.length} videos and ${transformedPolaroids.length} polaroids`);
      } else {
        addLog('WARNING: No NFTs found for this wallet');
        console.log('No NFTs found for this wallet. Using placeholder data.');
        setDataSource('placeholder');
      }
    } catch (err) {
      addLog(`FATAL ERROR: ${err.message}`);
      console.error('Error loading NFTs:', err);
      setError('Failed to load NFTs. Showing placeholder data.');
      setDataSource('placeholder');
    } finally {
      setLoading(false);
      addLog('=== Load Complete ===');
    }
  }, [apiKey, addLog]);

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
      {/* Film Borders - Sprocket holes on left & right */}
      <div className="film-border left">
        {[...Array(sprocketCount)].map((_, i) => (
          <div key={`l-${i}`} className="sprocket"></div>
        ))}
      </div>
      <div className="film-border right">
        {[...Array(sprocketCount)].map((_, i) => (
          <div key={`r-${i}`} className="sprocket"></div>
        ))}
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
          <div className="logo-section">
            <p className="artist-name">JUSTIN AVERSANO</p>
            <h1 className="title">
              <span className="title-main">Moments</span>
              <span className="title-sub"><span className="title-muted">OF THE </span>Unknown</span>
            </h1>
          </div>
          <div className="artist-credit">
            <span className="collector-tag">The jdsears Collection</span>
          </div>
        </div>
      </header>

      {/* Collection Info */}
      <section className="collection-intro">
        <div className="intro-content">
          <p className="intro-text">
            My collection from Justin Aversano's cinematic portrait of humanity,
            captured over 366 days across all seven continents.
            Each 10-second Super 8 moment is tied to a specific calendar date.
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

      {/* View Switcher */}
      <ViewSwitcher
        currentView={currentView}
        setCurrentView={setCurrentView}
        hasVideos={hasVideos}
      />

      {/* Filter Bar - only show for gallery view */}
      {currentView === 'gallery' && (
        <FilterBar
          continents={continents}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          totalCount={sortedNFTs.length}
          hasVideos={hasVideos}
          hasPolaroids={hasPolaroids}
        />
      )}

      {/* Main Content */}
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
        ) : currentView === 'gallery' ? (
          <div className="gallery-grid">
            {sortedNFTs.map((nft, index) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onClick={() => setSelectedIndex(index)}
                index={index}
              />
            ))}
          </div>
        ) : currentView === 'tunnel' ? (
          <TunnelView
            nfts={sortedNFTs}
            onSelect={(index) => setSelectedIndex(index)}
          />
        ) : currentView === 'map' ? (
          <MapView
            nfts={sortedNFTs}
            onSelect={(index) => setSelectedIndex(index)}
          />
        ) : null}
      </main>

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

      {/* Debug Panel */}
      <DebugPanel
        logs={debugLogs}
        isOpen={debugOpen}
        onToggle={() => setDebugOpen(!debugOpen)}
        onClear={() => setDebugLogs([])}
        apiKeyStatus={apiKeyStatus}
        dataSource={dataSource}
      />
    </div>
  );
}

export default App;
