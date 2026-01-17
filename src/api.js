// API Configuration and NFT Fetching Utilities
// 
// IMPORTANT: To use the OpenSea API in production, you'll need an API key.
// Get one at: https://docs.opensea.io/reference/api-keys
//
// For Railway deployment, set the VITE_OPENSEA_API_KEY environment variable.

const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';

// Your wallet address
export const WALLET_ADDRESS = '0x6f398e7872ac5f75121186678c4e6e015e83c49f';

// Collection slugs for Moments of The Unknown
export const COLLECTION_SLUGS = [
  'moments-of-the-unknown-polaroids',
  'moments-of-the-unknown-by-justin-aversano'
];

/**
 * Fetch NFTs owned by a wallet from OpenSea
 * @param {string} walletAddress - The wallet address to fetch NFTs for
 * @param {string[]} collectionSlugs - Array of collection slugs to filter by
 * @param {string} apiKey - OpenSea API key (optional for basic requests)
 * @returns {Promise<Array>} - Array of NFT objects
 */
export async function fetchWalletNFTs(walletAddress, collectionSlugs, apiKey = null) {
  const allNFTs = [];
  
  for (const slug of collectionSlugs) {
    try {
      const headers = {
        'Accept': 'application/json',
      };
      
      // Add API key if provided
      if (apiKey) {
        headers['X-API-KEY'] = apiKey;
      }
      
      const url = `${OPENSEA_API_BASE}/chain/ethereum/account/${walletAddress}/nfts?collection=${slug}&limit=50`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        console.warn(`Failed to fetch collection ${slug}:`, response.status);
        continue;
      }
      
      const data = await response.json();
      
      if (data.nfts && Array.isArray(data.nfts)) {
        allNFTs.push(...data.nfts);
      }
    } catch (error) {
      console.error(`Error fetching collection ${slug}:`, error);
    }
  }
  
  return allNFTs;
}

/**
 * Transform OpenSea NFT data to our gallery format
 * @param {Object} nft - Raw NFT data from OpenSea
 * @returns {Object} - Transformed NFT for gallery display
 */
export function transformNFT(nft, index) {
  // Extract date from name (format: "Month Day" or token metadata)
  const name = nft.name || `Moment #${nft.identifier}`;
  const description = nft.description || '';
  
  // Try to parse location from description or metadata
  let location = 'Unknown Location';
  let date = name;
  let continent = 'Unknown';
  
  // Parse metadata traits if available
  if (nft.traits && Array.isArray(nft.traits)) {
    for (const trait of nft.traits) {
      if (trait.trait_type?.toLowerCase() === 'location') {
        location = trait.value;
      }
      if (trait.trait_type?.toLowerCase() === 'continent') {
        continent = trait.value;
      }
      if (trait.trait_type?.toLowerCase() === 'date') {
        date = trait.value;
      }
    }
  }
  
  return {
    id: nft.identifier || index,
    tokenId: nft.identifier,
    name: name,
    date: date,
    location: location,
    description: description,
    image: nft.image_url || nft.display_image_url,
    animationUrl: nft.animation_url || nft.display_animation_url,
    continent: continent,
    openseaUrl: nft.opensea_url,
    collection: nft.collection
  };
}

/**
 * Get day number from a date string (1-366)
 * @param {string} dateStr - Date string like "April 8" or "April 8th"
 * @returns {number} - Day of year (1-366)
 */
export function getDayOfYear(dateStr) {
  const months = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3,
    'may': 4, 'june': 5, 'july': 6, 'august': 7,
    'september': 8, 'october': 9, 'november': 10, 'december': 11
  };
  
  // Extract month and day from string
  const cleanStr = dateStr.toLowerCase().replace(/(\d+)(st|nd|rd|th)/, '$1');
  const parts = cleanStr.split(/\s+/);
  
  if (parts.length >= 2) {
    const monthName = parts[0];
    const day = parseInt(parts[1]);
    
    if (months.hasOwnProperty(monthName) && !isNaN(day)) {
      const date = new Date(2024, months[monthName], day); // 2024 is a leap year
      const start = new Date(2024, 0, 1);
      const diff = date - start;
      return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    }
  }
  
  // Fallback: try to parse as token ID
  const numMatch = dateStr.match(/\d+/);
  if (numMatch) {
    return parseInt(numMatch[0]);
  }
  
  return 0;
}

/**
 * Group NFTs by continent
 * @param {Array} nfts - Array of NFT objects
 * @returns {Object} - Object with continent names as keys and NFT arrays as values
 */
export function groupByContinent(nfts) {
  return nfts.reduce((groups, nft) => {
    const continent = nft.continent || 'Unknown';
    if (!groups[continent]) {
      groups[continent] = [];
    }
    groups[continent].push(nft);
    return groups;
  }, {});
}

/**
 * Sort NFTs by day of year
 * @param {Array} nfts - Array of NFT objects
 * @returns {Array} - Sorted array
 */
export function sortByDate(nfts) {
  return [...nfts].sort((a, b) => {
    return getDayOfYear(a.date) - getDayOfYear(b.date);
  });
}
