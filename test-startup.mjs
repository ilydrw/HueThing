process.env.DESKTHING_ROOT_PATH ||= process.cwd()

try {
  await import('./dist/server/index.js')
  console.log('SERVER IMPORT SUCCESS')
} catch (err) {
  console.error('SERVER IMPORT FAILED:', err)
  process.exitCode = 1
}
