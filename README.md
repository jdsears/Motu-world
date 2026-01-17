# Moments of The Unknown Gallery

A beautiful, cinematic gallery for viewing your **Moments of The Unknown** NFT collection by Justin Aversano.

![Gallery Preview](https://momentsoftheunknown.com)

## About The Collection

Moments of The Unknown is a 366-day conceptual project by Justin Aversano, featuring 10-second Super 8 video artworks captured during a yearlong journey around the world. Each piece is tied to a specific calendar date, creating a living archive of global intimacy.

**Two Collection Types:**
- **Video Moments (ERC-721)**: 366 unique 10-second Super 8 video artworks
- **Polaroids (ERC-1155)**: Companion polaroid photographs

## Features

- 🎬 **Cinematic Design**: Super 8 film-inspired aesthetic with warm, sepia tones
- 📅 **Date-Based Organization**: NFTs displayed with their calendar day (1-366)
- 🌍 **Continent Filtering**: Filter your collection by geographic region
- 🎥 **Type Filtering**: Toggle between Videos and Polaroids
- 🖼️ **Beautiful Modal View**: Detailed view with full metadata and video playback
- 📱 **Fully Responsive**: Works beautifully on desktop, tablet, and mobile
- ⚡ **Fast & Lightweight**: Built with Vite and React

## Contract Addresses

- **Video Moments (ERC-721)**: `0xC2B9C77c9FE1a94A8D815Eec0aEC274f89Fe70ef`
- **Polaroids (ERC-1155)**: `0xADFa888bCeB4c1F356d8A75Ffa2027a61C91B1d5`

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Local Development

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Configuration

### Loading Your Actual NFTs

The gallery can automatically load your NFTs using the Alchemy API (free tier available).

1. **Get a free Alchemy API key** from [alchemy.com](https://www.alchemy.com/)

2. **Create a `.env` file** in the project root:
   ```
   VITE_ALCHEMY_API_KEY=your_api_key_here
   ```

3. **Restart the dev server** - your NFTs will load automatically!

### Customizing The Wallet Address

Edit `src/App.jsx` and update the `CONFIG` object:

```javascript
const CONFIG = {
  walletAddress: '0xYOUR_WALLET_ADDRESS_HERE',
  contracts: {
    videos: '0xC2B9C77c9FE1a94A8D815Eec0aEC274f89Fe70ef',
    polaroids: '0xADFa888bCeB4c1F356d8A75Ffa2027a61C91B1d5'
  },
  // ...
};
```

### Using Placeholder Data

If you don't have an API key, you can manually add your NFTs to the `PLACEHOLDER_NFTS` array in `src/App.jsx`:

```javascript
const PLACEHOLDER_NFTS = [
  {
    id: 'video-24',
    tokenId: '24',
    name: 'May 1st - 15:49',
    date: 'May 1',
    location: 'Paris, France',
    description: 'Your moment description...',
    image: null,
    animationUrl: 'https://your-video-url.mp4',
    continent: 'Europe',
    type: 'video' // or 'polaroid'
  },
  // Add more...
];
```

## Deployment to Railway

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/motu-gallery.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect the configuration and deploy

3. **Add Custom Domain** (Optional)
   - In Railway dashboard, go to Settings → Domains
   - Add your custom domain

### Method 2: Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

### Environment Variables (If Using OpenSea API)

In Railway dashboard:
1. Go to your project → Variables
2. Add: `VITE_OPENSEA_API_KEY` = your_api_key

## Project Structure

```
motu-gallery/
├── src/
│   ├── App.jsx        # Main React component
│   ├── App.css        # Styles with cinematic aesthetic
│   ├── api.js         # OpenSea API utilities
│   └── main.jsx       # Entry point
├── public/
│   └── favicon.svg    # Film-inspired favicon
├── index.html         # HTML template
├── package.json       # Dependencies
├── vite.config.js     # Vite configuration
├── railway.toml       # Railway deployment config
└── nixpacks.toml      # Build configuration
```

## Design Philosophy

The gallery design draws inspiration from:

- **Super 8 Film**: Sprocket holes, film frames, warm grain
- **Cinematic Warmth**: Sepia and gold tones reflecting analog photography
- **Global Journey**: Geographic organization honoring the 7-continent story
- **Intimate Viewing**: Modal design for focused appreciation of each moment

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **CSS Variables** - Theming
- **Google Fonts** - Cormorant Garamond & Space Mono

## License

This gallery template is MIT licensed. The NFT artwork is owned by the respective collectors and Justin Aversano.

---

Built with ❤️ for collectors of **Moments of The Unknown**

[Official Collection](https://momentsoftheunknown.com) | [Justin Aversano](https://twitter.com/justinaversano)
