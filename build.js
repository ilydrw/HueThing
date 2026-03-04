import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const ESM_BANNER = `// ESM shims for Node.js built-in modules
import { createRequire as DeskThingCreateRequire } from 'module';
import { fileURLToPath as DeskThingFileURLToPath } from 'url';
import { dirname as DeskThingDirname } from 'node:path';

const require = DeskThingCreateRequire(import.meta.url);
const __filename = DeskThingFileURLToPath(import.meta.url);
const __dirname = DeskThingDirname(__filename);
`

// Clean dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true })
}

// Build client into dist/client/
console.log('Building client...')
execSync('npx vite build --outDir dist/client', { stdio: 'inherit' })

// Build server (ESM bundle matching DeskThing's expected format, with sourcemap)
console.log('Building server...')
fs.mkdirSync('dist/server', { recursive: true })

// Only externalize @deskthing/server (provided at runtime)
// Bundle @deskthing/types (enums need to be inlined)
execSync(
  'npx esbuild server/index.ts --bundle --platform=node --format=esm --sourcemap --outfile=dist/server/index.tmp.js --external:@deskthing/server',
  { stdio: 'inherit' }
)

// Prepend ESM shim banner (matching the pattern used by working DeskThing apps)
const serverCode = fs.readFileSync('dist/server/index.tmp.js', 'utf8')
fs.writeFileSync('dist/server/index.js', ESM_BANNER + serverCode)
fs.unlinkSync('dist/server/index.tmp.js')

// Handle the sourcemap file renaming and path fixing
if (fs.existsSync('dist/server/index.tmp.js.map')) {
  const mapData = fs.readFileSync('dist/server/index.tmp.js.map', 'utf8')
  // Update the file reference inside the map
  const newMapData = mapData.replace(/"file":"index\.tmp\.js"/g, '"file":"index.js"')
  fs.writeFileSync('dist/server/index.js.map', newMapData)
  fs.unlinkSync('dist/server/index.tmp.js.map')
}

// Write server package.json (required)
fs.writeFileSync(
  path.resolve('dist/server/package.json'),
  JSON.stringify({ type: 'module' }, null, 2)
)

// Copy manifest and main icon
console.log('Copying assets...')
fs.copyFileSync(
  path.resolve('public/manifest.json'),
  path.resolve('dist/manifest.json')
)
if (fs.existsSync('public/icon.svg')) {
  fs.copyFileSync(
    path.resolve('public/icon.svg'),
    path.resolve('dist/icon.svg')
  )
}

// Generate colored icons for DeskThing UI
console.log('Generating colored icons...')
const iconsDir = path.resolve('dist/icons')
fs.mkdirSync(iconsDir, { recursive: true })
const srcIconsDir = path.resolve('public/icons')
const themeColors = {
  white: '#ffffff',
  orange: '#FFB84D',
  red: '#FF6B6B',
  green: '#4DFFB8',
  blue: '#4DA6FF',
  purple: '#9B6DFF',
  yellow: '#FFE66D'
}

if (fs.existsSync(srcIconsDir)) {
  for (const f of fs.readdirSync(srcIconsDir)) {
    if (f.endsWith('.svg')) {
      const srcPath = path.join(srcIconsDir, f)
      const baseName = f.replace('.svg', '')
      const svgContent = fs.readFileSync(srcPath, 'utf8')
      
      // Save default white one without flair
      fs.copyFileSync(srcPath, path.join(iconsDir, f))
      // It's white so saving a _white version is good too for consistency, or just color
      // Wait, deskthing updateIcon('like', 'active') looks for likeactive.svg
      // So if flair is "orange", it looks for actionNameorange.svg
      
      for (const [colorName, colorHex] of Object.entries(themeColors)) {
        const coloredSvg = svgContent.replace(/stroke="white"/g, 'stroke="' + colorHex + '"')
        fs.writeFileSync(path.join(iconsDir, baseName + colorName + '.svg'), coloredSvg)
      }
    }
  }
}

console.log('Build complete! Zip the dist/ folder and load into DeskThing.')
