const fs = require('fs');

const generateSvg = (idx) => {
  const hue = 110 + (idx * 3); // Varying green hues
  const isHealthy = idx % 3 === 0; // Some are healthy, some have issues
  const hasSevere = idx % 2 !== 0;
  
  const boxHtml = [];
  if (!isHealthy) {
    if (hasSevere) {
      boxHtml.push(`<rect x="${100 + idx * 10}" y="${150 + idx * 20}" width="180" height="120" fill="rgba(255, 0, 0, 0.2)" stroke="red" stroke-width="4" stroke-dasharray="8,4" />`);
      boxHtml.push(`<text x="${110 + idx * 10}" y="${140 + idx * 20}" font-family="monospace" font-size="20" fill="red" font-weight="bold">SEVERE_BLIGHT</text>`);
    } else {
      boxHtml.push(`<rect x="${400 - idx * 10}" y="${300 - idx * 15}" width="200" height="150" fill="rgba(255, 165, 0, 0.2)" stroke="orange" stroke-width="4" stroke-dasharray="8,4" />`);
      boxHtml.push(`<text x="${410 - idx * 10}" y="${290 - idx * 15}" font-family="monospace" font-size="20" fill="orange" font-weight="bold">MODERATE_STRESS</text>`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="100%" height="100%" fill="hsl(${hue}, 45%, 35%)"/>
    <!-- Grid -->
    <g stroke="hsl(${hue}, 50%, 25%)" stroke-width="8">
      ${Array.from({length: 20}).map((_, i) => `<line x1="0" y1="${i * 35}" x2="800" y2="${i * 35 + (idx * 5)}" />`).join('')}
      ${Array.from({length: 20}).map((_, i) => `<line x1="${i * 45}" y1="0" x2="${i * 45 + (idx * 8)}" y2="600" />`).join('')}
    </g>
    <!-- Tractor paths -->
    <path d="M ${50 + idx * 25} 0 C ${100 + idx * 30} 300, ${80 + idx * 20} 600, ${150 + idx * 15} 600" stroke="rgba(100, 80, 50, 0.6)" stroke-width="12" fill="none" />
    <path d="M ${80 + idx * 25} 0 C ${130 + idx * 30} 300, ${110 + idx * 20} 600, ${180 + idx * 15} 600" stroke="rgba(100, 80, 50, 0.6)" stroke-width="12" fill="none" />
    
    <!-- Disease Clusters -->
    ${boxHtml.join('\\n    ')}
    
    <!-- Vignette / Lighting -->
    <radialGradient id="grad1" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="white" stop-opacity="0" />
      <stop offset="100%" stop-color="black" stop-opacity="0.5" />
    </radialGradient>
    <rect width="100%" height="100%" fill="url(#grad1)" pointer-events="none" />
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

let content = fs.readFileSync('src/data/droneData.ts', 'utf-8');

// The file currently has SVG data URIs, we need to replace them.
const regex = /imageUrl:\s*'data:image\/svg\+xml[^']+'/g;

let count = 0;
content = content.replace(regex, (match) => {
  const svgUrl = generateSvg(count);
  count++;
  return `imageUrl: '${svgUrl}'`;
});

fs.writeFileSync('src/data/droneData.ts', content);
console.log('Advanced Images replaced!');
