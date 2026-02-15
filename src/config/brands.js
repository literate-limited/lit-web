/**
 * Brand Configuration
 *
 * Defines metadata, themes, and settings for each brand in the multi-tenant platform.
 */

export const BRAND_MAP = {
  lit: {
    code: 'lit',
    name: 'LIT Lang',
    fullName: 'Language Immersion Technology',
    theme: 'lit',
    logo: '/lit-logo.svg',
    logoMark: '/lit-mark.svg',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    defaultLanguage: 'fr',
    features: ['classes', 'chat', 'curriculum', 'adaptive-learning'],
    meta: {
      title: 'LIT Lang - Language Immersion Technology',
      description: 'AI-powered language learning through immersive conversation',
      ogImage: '/lit-og-image.png'
    }
  },
  ttv: {
    code: 'ttv',
    name: 'TeleprompTV',
    fullName: 'TeleprompTV - AI Video Production',
    theme: 'ttv',
    logo: '/ttv-logo.svg',
    logoMark: '/ttv-mark.svg',
    primaryColor: '#10B981',
    secondaryColor: '#3B82F6',
    accentColor: '#8B5CF6',
    defaultLanguage: 'en',
    features: ['teleprompt', 'video-editing', 'transcription', 'ai-enhancement'],
    meta: {
      title: 'TeleprompTV - AI-Powered Video Production',
      description: 'Create professional videos with AI-assisted teleprompter and editing tools',
      ogImage: '/ttv-og-image.png'
    }
  },
  deb: {
    code: 'deb',
    name: 'Debatica',
    fullName: 'Debatica - Debate Training Arena',
    theme: 'debatica',
    logo: '/debatica/logo.svg',
    logoMark: '/debatica/logo-mark.svg',
    primaryColor: '#f59e0b',
    secondaryColor: '#22d3ee',
    accentColor: '#fb923c',
    defaultLanguage: 'en',
    features: ['debates', 'attempts', 'grading', 'lit-currency'],
    meta: {
      title: 'Debatica - Train Like a Champion Debater',
      description: 'Practice structured debates with AI grading, coaching, ratings, and Lit rewards.',
      ogImage: '/debatica/landing-page.png'
    }
  },
  signphony: {
    code: 'signphony',
    name: 'Signphony',
    fullName: 'Signphony - AI-Powered Sign Language Learning',
    theme: 'signphony',
    logo: '/signphony-logo.svg',
    logoMark: '/signphony-mark.svg',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    accentColor: '#F59E0B',
    defaultLanguage: 'en',
    features: ['sign-learning', 'pose-recognition', 'ml-scoring', 'progress-tracking'],
    meta: {
      title: 'Signphony - Master Sign Language with AI',
      description: 'Learn Auslan and other sign languages with AI-powered pose recognition and real-time feedback',
      ogImage: '/signphony-og-image.png'
    },
    apiUrl: import.meta.env.VITE_SIGNPHONY_API_URL || 'http://localhost:5000',
    wsUrl: import.meta.env.VITE_SIGNPHONY_WS_URL || 'ws://localhost:5000'
  },
  law: {
    code: 'law',
    name: 'Lawlore',
    fullName: 'Lawlore - Australian Legal Research & Learning',
    theme: 'law',
    logo: '/lawlore-logo.svg',
    logoMark: '/lawlore-mark.svg',
    primaryColor: '#1e3a8a',
    secondaryColor: '#0f766e',
    accentColor: '#3b82f6',
    defaultLanguage: 'en',
    features: ['law-search', 'law-curriculum', 'law-assessment', 'citations'],
    meta: {
      title: 'Lawlore - Australian Legal Research & Education',
      description: 'Search Commonwealth legislation, High Court cases, and learn Australian law with structured curriculum and assessments',
      ogImage: '/lawlore-og-image.png'
    },
    apiUrl: import.meta.env.VITE_LAW_API_URL || 'http://localhost:3001',
    wsUrl: import.meta.env.VITE_LAW_WS_URL || 'ws://localhost:3001'
  },
  mat: {
    code: 'mat',
    name: 'Math Madness',
    fullName: 'Math Madness - Learn Math Through Games',
    theme: 'mat',
    logo: '/mat/logo.png',
    logoMark: '/mat/logo.ico',
    primaryColor: '#EAB308',
    secondaryColor: '#F59E0B',
    accentColor: '#F97316',
    defaultLanguage: 'en',
    features: ['math-practice', 'interactive-visualizations', 'adaptive-learning'],
    meta: {
      title: 'Math Madness - Master Math with AI',
      description: 'Math practice with fast feedback and real progress.',
      ogImage: '/mat/logo.png'
    }
  }
};

/**
 * Get brand configuration
 * @param {string} brandCode - Brand code ('lit', 'ttv', etc.)
 * @returns {object} - Brand configuration object
 */
export function getBrandConfig(brandCode = 'lit') {
  return BRAND_MAP[brandCode] || BRAND_MAP.lit;
}

/**
 * Detect brand from hostname/domain
 * Maps subdomains to brand codes
 * @returns {string} - Brand code
 */
export function getBrandFromDomain() {
  if (typeof window === 'undefined') return 'lit'; // SSR fallback

  const hostname = window.location.hostname;

  // Domain to brand mapping
  const domainMap = {
    // Lawlore
    'law.litsuite.app': 'law',
    'www.law.litsuite.app': 'law',
    'lawlore.art': 'law',
    'www.lawlore.art': 'law',
    'lawlore.litsuite.app': 'law',
    'lawlore.localhost': 'law',
    // Signphony
    'signphony.litsuite.app': 'signphony',
    'signphony.localhost': 'signphony',
    'signsymposium.litsuite.app': 'signphony', // legacy domain
    // Math Madness
    'math.litsuite.app': 'mat',
    'mathmadness.app': 'mat',
    'www.mathmadness.app': 'mat',
    // TeleprompTV
    'teleprompttv.tv': 'ttv',
    'www.teleprompttv.tv': 'ttv',
    'teleprompttv.vercel.app': 'ttv',
    // Debatica
    'debatica.art': 'deb',
    'www.debatica.art': 'deb',
    'deb.litsuite.app': 'deb',
    // LIT (explicit — catch-all is already 'lit')
    'playliterate.app': 'lit',
    'www.playliterate.app': 'lit',
    'lit-mvp.vercel.app': 'lit',
    'litsuite.app': 'lit',
    'www.litsuite.app': 'lit',
  };

  // Check exact matches first
  if (domainMap[hostname]) {
    return domainMap[hostname];
  }

  // Check Vercel preview URLs (e.g. teleprompttv-abc123.vercel.app)
  if (hostname.endsWith('.vercel.app')) {
    const prefix = hostname.replace('.vercel.app', '');
    if (prefix.startsWith('teleprompttv')) return 'ttv';
    if (prefix.startsWith('lawlore')) return 'law';
    if (prefix.startsWith('debatica')) return 'deb';
    if (prefix.startsWith('mathmadness')) return 'mat';
    if (prefix.startsWith('signphony')) return 'signphony';
    if (prefix.startsWith('lit-mvp')) return 'lit';
  }

  // Check subdomain pattern: lawlore.* -> law, signphony.* -> signphony
  const subdomain = hostname.split('.')[0];
  const subdomainMap = {
    law: 'law',
    lawlore: 'law',
    signphony: 'signphony',
    math: 'mat',
    mathmadness: 'mat',
    ttv: 'ttv',
    teleprompttv: 'ttv',
    deb: 'deb',
    debatica: 'deb',
    lit: 'lit',
  };

  return subdomainMap[subdomain] || 'lit';
}

/**
 * Get current brand from domain or environment.
 *
 * Priority:
 *   1. Runtime domain detection (always — works for multi-domain single build)
 *   2. VITE_BRAND env var as fallback (local dev on localhost)
 *   3. Default 'lit'
 *
 * Domain detection runs first so that a single Vercel build can serve
 * many brands. VITE_BRAND is only used on localhost where there's no
 * meaningful hostname to detect from.
 *
 * @returns {object} - Current brand configuration
 */
export function getCurrentBrand() {
  // 1. Runtime domain detection (works in production with any domain)
  //    Skip on localhost — there's no meaningful domain to detect
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) {
      const domainBrand = getBrandFromDomain();
      if (domainBrand) {
        return getBrandConfig(domainBrand);
      }
    }
  }

  // 2. Build-time env var fallback (local dev with VITE_BRAND=xxx)
  const envBrand = import.meta.env.VITE_BRAND;
  if (envBrand) {
    return getBrandConfig(envBrand);
  }

  // 3. Default
  return getBrandConfig('lit');
}

/**
 * Check if current brand has a feature
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
export function hasFeature(feature) {
  const brand = getCurrentBrand();
  return brand.features.includes(feature);
}

export default BRAND_MAP;
