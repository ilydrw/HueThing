import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import * as esbuild from 'esbuild'

const ESM_BANNER = `// ESM shims for Node.js built-in modules
import { createRequire as DeskThingCreateRequire } from 'module';
import { fileURLToPath as DeskThingFileURLToPath } from 'url';
import { dirname as DeskThingDirname } from 'node:path';

const require = DeskThingCreateRequire(import.meta.url);
const __filename = DeskThingFileURLToPath(import.meta.url);
const __dirname = DeskThingDirname(__filename);
`

if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true })
}

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))

console.log('Building client...')
execSync('npx vite build --outDir dist/client', { stdio: 'inherit' })

console.log('Building server...')
fs.mkdirSync('dist/server', { recursive: true })

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  sourcemap: true,
  outfile: 'dist/server/index.js',
  // Externalizing native modules to prevent esbuild loader errors
  external: [
    'node-dtls-client', 
    'node-aead-crypto', 
    'multicast-dns'
  ],
  banner: {
    js: ESM_BANNER 
  }
})

fs.writeFileSync(
  path.resolve('dist/server/package.json'),
  JSON.stringify({ type: 'module' }, null, 2)
)

console.log('Copying assets...')
const manifestSource = fs.existsSync(path.resolve('manifest.json'))
  ? path.resolve('manifest.json')
  : path.resolve('public/manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestSource, 'utf8'))
manifest.version = packageJson.version
fs.writeFileSync(path.resolve('dist/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
const iconFiles = ['icon.png', 'icon.svg']
for (const iconFile of iconFiles) {
  if (fs.existsSync(`public/${iconFile}`)) {
    fs.copyFileSync(
      path.resolve(`public/${iconFile}`),
      path.resolve(`dist/${iconFile}`)
    )
  }
}

console.log('Generating colored icons...')
const iconsDir = path.resolve('dist/icons')
fs.mkdirSync(iconsDir, { recursive: true })
const srcIconsDir = path.resolve('public/icons')

if (fs.existsSync('public/icon.svg')) {
  fs.copyFileSync('public/icon.svg', path.join(iconsDir, 'huething.svg'))
}

// --- Premium Adobe/iOS System Color Palette ---
const themeColors = {
  white: '#F5F5F7',  // iOS Off-white
  orange: '#FF9500', // iOS System Orange
  red: '#FF3B30',    // iOS System Red
  green: '#34C759',  // iOS System Green
  blue: '#007AFF',   // iOS System Blue (San Francisco)
  purple: '#AF52DE', // iOS System Purple
  yellow: '#FFCC00', // iOS System Yellow
  adobe: '#FA0F00'   // Adobe Signature Red
}

if (fs.existsSync(srcIconsDir)) {
  for (const f of fs.readdirSync(srcIconsDir)) {
    if (f.endsWith('.svg')) {
      const srcPath = path.join(srcIconsDir, f)
      const baseName = f.replace('.svg', '')
      const svgContent = fs.readFileSync(srcPath, 'utf8')
      
      fs.copyFileSync(srcPath, path.join(iconsDir, f))
      
      for (const [colorName, colorHex] of Object.entries(themeColors)) {
        const coloredSvg = svgContent
          .replace(/stroke="(white|#ffffff|#fff)"/gi, `stroke="${colorHex}"`)
          .replace(/fill="(white|#ffffff|#fff)"/gi, `fill="${colorHex}"`)
          
        fs.writeFileSync(path.join(iconsDir, baseName + colorName + '.svg'), coloredSvg)
      }
    }
  }
}

console.log('Zipping dist folder into huething.zip...')
const zip = new AdmZip()
zip.addLocalFolder(path.resolve('dist'))
zip.writeZip(path.resolve('huething.zip'))

console.log('Build complete! huething.zip has been successfully generated.')
