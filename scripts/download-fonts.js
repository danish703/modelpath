import fs from 'fs';
import path from 'path';

const fontsDir = 'd:/modelpath/public/fonts';
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';

console.log('Fetching Google Fonts stylesheet...');
const cssRes = await fetch(googleFontsUrl, { headers: { 'User-Agent': userAgent } });
const cssText = await cssRes.text();

// Parse font-face blocks
const fontFaceBlocks = cssText.split('@font-face').slice(1);

const fontFaces = [];

for (const block of fontFaceBlocks) {
  // Only extract latin subset
  const isLatin = block.includes('/* latin */') || block.includes('unicode-range: U+0000-00FF') || !block.includes('unicode-range');
  if (!isLatin) continue;

  const familyMatch = block.match(/font-family:\s*['"]?([^'";]+)['"]?/);
  const weightMatch = block.match(/font-weight:\s*(\d+)/);
  const styleMatch = block.match(/font-style:\s*(\w+)/);
  const urlMatch = block.match(/url\((https:\/\/[^)]+\.woff2)\)/);
  const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);

  if (!familyMatch || !weightMatch || !urlMatch) continue;

  const family = familyMatch[1].trim();
  const weight = weightMatch[1].trim();
  const style = styleMatch ? styleMatch[1].trim() : 'normal';
  const url = urlMatch[1];
  const unicodeRange = rangeMatch ? rangeMatch[1].trim() : 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

  const slugName = family.toLowerCase().replace(/\s+/g, '-');
  const filename = `${slugName}-${weight}-${style}.woff2`;
  const filePath = path.join(fontsDir, filename);

  console.log(`Downloading ${filename} from ${url}...`);
  const fontRes = await fetch(url);
  const arrayBuffer = await fontRes.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  fontFaces.push(`@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${filename}') format('woff2');
  unicode-range: ${unicodeRange};
}`);
}

const localCss = `/* Self-hosted privacy-preserving fonts — Zero third-party runtime requests */
${fontFaces.join('\n\n')}
`;

fs.writeFileSync('d:/modelpath/src/styles/fonts.css', localCss);
console.log('Saved src/styles/fonts.css with local font definitions!');
console.log(`Total fonts downloaded: ${fontFaces.length}`);
