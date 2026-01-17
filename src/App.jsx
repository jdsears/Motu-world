import React, { useState, useEffect, useCallback } from 'react';
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
async function fetchNFTsFromAlchemy(walletAddress, contractAddress, apiKey) {
  const baseUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey || 'demo'}/getNFTsForOwner`;
  let allNfts = [];
  let pageKey = null;

  try {
    // Paginate through all results
    do {
      let url = `${baseUrl}?owner=${walletAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&pageSize=100`;
      if (pageKey) {
        url += `&pageKey=${pageKey}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      allNfts = [...allNfts, ...(data.ownedNfts || [])];
      pageKey = data.pageKey || null;
    } while (pageKey);

    return allNfts;
  } catch (error) {
    console.error('Error fetching from Alchemy:', error);
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
  
  return {
    id: `${type}-${nft.tokenId}`,
    tokenId: nft.tokenId,
    name: name,
    date: date,
    location: location,
    description: metadata.description || '',
    image: nft.image?.cachedUrl || nft.image?.thumbnailUrl || metadata.image,
    animationUrl: metadata.animation_url || nft.raw?.metadata?.animation_url,
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
const getDayNumber = (dateStr) => {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  const parts = dateStr.split(' ');
  const month = months[parts[0]];
  const day = parseInt(parts[1]);
  const date = new Date(2024, month, day);
  const start = new Date(2024, 0, 1);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

// NFT Card Component
const NFTCard = ({ nft, onClick, index }) => {
  const dayNumber = getDayNumber(nft.date);
  const isVideo = nft.type === 'video';
  const hasMedia = nft.animationUrl || nft.image;
  
  return (
    <div 
      className="nft-card"
      onClick={() => onClick(nft)}
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
                  src={nft.animationUrl} 
                  muted 
                  loop 
                  playsInline
                  onMouseEnter={(e) => e.target.play()}
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

// Modal Component for detailed view
const NFTModal = ({ nft, onClose }) => {
  const dayNumber = getDayNumber(nft.date);
  const isVideo = nft.type === 'video';
  const hasMedia = nft.animationUrl || nft.image;
  const contractAddress = nft.contract || (isVideo ? CONFIG.contracts.videos : CONFIG.contracts.polaroids);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-media">
          <div className="film-grain"></div>
          {hasMedia ? (
            <div className="modal-video-container">
              {nft.animationUrl ? (
                <video 
                  src={nft.animationUrl} 
                  controls 
                  autoPlay 
                  loop 
                  muted
                  playsInline
                />
              ) : nft.image ? (
                <img src={nft.image} alt={nft.name} />
              ) : null}
            </div>
          ) : (
            <div className="modal-placeholder">
              <div className="super8-frame large">
                <div className="sprocket-holes left">
                  {[...Array(6)].map((_, i) => <div key={i} className="hole"></div>)}
                </div>
                <div className="frame-content">
                  <span className="play-icon large">{isVideo ? '▶' : '◻'}</span>
                  <p className="play-text">{isVideo ? '10-second Super 8 moment' : 'Polaroid photograph'}</p>
                </div>
                <div className="sprocket-holes right">
                  {[...Array(6)].map((_, i) => <div key={i} className="hole"></div>)}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-info">
          <div className="modal-header">
            <div className="day-display">
              <span className="day-big">{dayNumber || '?'}</span>
              <span className="day-total">/ 366</span>
            </div>
            <div className="date-location">
              <h2 className="modal-date">{nft.date}</h2>
              <p className="modal-location">
                <span className="location-pin">◉</span>
                {nft.location}
              </p>
            </div>
          </div>
          
          {nft.description && (
            <p className="modal-description">{nft.description.substring(0, 300)}{nft.description.length > 300 ? '...' : ''}</p>
          )}
          
          <div className="modal-meta">
            <div className="meta-item">
              <span className="meta-label">Type</span>
              <span className="meta-value">{isVideo ? 'Video Moment' : 'Polaroid'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Continent</span>
              <span className="meta-value">{nft.continent}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Token ID</span>
              <span className="meta-value">#{nft.tokenId}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Format</span>
              <span className="meta-value">{isVideo ? 'Super 8 Film' : 'Polaroid'}</span>
            </div>
          </div>
          
          <div className="modal-links">
            <a 
              href={nft.openseaUrl || `https://opensea.io/assets/ethereum/${contractAddress}/${nft.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="opensea-link"
            >
              View on OpenSea →
            </a>
            <a 
              href={`https://etherscan.io/token/${contractAddress}?a=${nft.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="etherscan-link"
            >
              Etherscan →
            </a>
          </div>
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

// Main App Component
function App() {
  const [nfts, setNfts] = useState(SAMPLE_NFTS);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'video', 'polaroid'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('placeholder');

  // Fetch NFTs from API on mount
  useEffect(() => {
    const loadNFTs = async () => {
      const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
      
      if (!apiKey) {
        console.log('No Alchemy API key found. Using placeholder data.');
        console.log('To load your actual NFTs, add VITE_ALCHEMY_API_KEY to your .env file');
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
    };
    
    loadNFTs();
  }, []);

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

  return (
    <div className="app">
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
            <h1 className="title">
              <span className="title-line">Moments of</span>
              <span className="title-line accent">The Unknown</span>
            </h1>
            <p className="subtitle">The jdsears Collection</p>
          </div>
          <div className="artist-credit">
            <span className="by">by</span>
            <span className="artist-name">Justin Aversano</span>
          </div>
        </div>
        <div className="header-decoration">
          <div className="film-strip">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="film-hole"></div>
            ))}
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
      />

      {/* Gallery Grid */}
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
          <div className="gallery-grid">
            {sortedNFTs.map((nft, index) => (
              <NFTCard 
                key={nft.id} 
                nft={nft} 
                onClick={setSelectedNFT}
                index={index}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedNFT && (
        <NFTModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />
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
        </div>
      </footer>
    </div>
  );
}

export default App;
