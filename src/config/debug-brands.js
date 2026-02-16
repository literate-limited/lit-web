export function debugBrandDetection() {
  if (typeof window === 'undefined') {
    console.log('[Brand] SSR environment detected');
    return 'lit';
  }
  
  const hostname = window.location.hostname;
  console.log('[Brand] Hostname:', hostname);
  
  const domainMap = {
    'mathmadness.app': 'mat',
    'www.mathmadness.app': 'mat',
    'playliterate.app': 'lit',
    'debatica.art': 'deb',
    'law.litsuite.app': 'law',
    'signphony.litsuite.app': 'signphony',
    'teleprompttv.tv': 'ttv'
  };
  
  const detectedBrand = domainMap[hostname] || 'lit';
  console.log('[Brand] Detected brand:', detectedBrand);
  
  return detectedBrand;
}
