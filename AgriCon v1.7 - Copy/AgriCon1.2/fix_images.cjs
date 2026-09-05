const fs = require('fs');

const generateSvg = (idx) => {
  const hue = 110 + (idx * 5);
  const isHealthy = idx % 3 !== 0;
  const pathColor = !isHealthy ? '#bc4749' : 'transparent';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" fill="hsl(${hue}, 40%, 30%)"/>
    ${Array.from({length: 20}).map((_, i) => `<line x1="0" y1="${i * 30}" x2="800" y2="${i * 30 + (idx * 10)}" stroke="hsl(${hue}, 50%, 25%)" stroke-width="15" />`).join('')}
    <path d="M ${100 + idx * 20} 0 L ${200 + idx * 30} 600" stroke="#5c4d3c" stroke-width="6" opacity="0.7"/>
    <path d="M ${120 + idx * 20} 0 L ${220 + idx * 30} 600" stroke="#5c4d3c" stroke-width="6" opacity="0.7"/>
    ${!isHealthy ? `<circle cx="${200 + idx * 40}" cy="${300 - idx * 20}" r="120" fill="${pathColor}" opacity="0.4" />` : ''}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

let content = fs.readFileSync('src/data/droneData.ts', 'utf-8');

const regex = /imageUrl:\s*'(https:\/\/images\.unsplash\.com[^']+)'/g;

let count = 0;
content = content.replace(regex, (match, url) => {
  const svgUrl = generateSvg(count);
  count++;
  return `imageUrl: '${svgUrl}'`;
});

fs.writeFileSync('src/data/droneData.ts', content);
console.log('Images replaced!');
