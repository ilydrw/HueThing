#!/usr/bin/env pwsh
# HueThing 1.0.0 Release Cleanup Script
# Run from project root: powershell -File cleanup.ps1

Write-Host "HueThing Release Cleanup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Dead component files (never imported anywhere)
$deadComponents = @(
    "src/components/Clock.tsx",
    "src/components/FullKeyboard.tsx",
    "src/components/LightCard.tsx",
    "src/components/LightControl.tsx",
    "src/components/ScenePicker.tsx",
    "src/components/SpatialAwareCanvas.tsx"
)

# Dead utility/lib files
$deadUtils = @(
    "src/lib/useGestures.ts",
    "src/utils/gestures.ts",
    "src/utils/interaction_framework.md",
    "src/theme/index.ts"
)

# Dead duplicate pairing/layout directories
$deadDirs = @(
    "src/components/pairing",
    "src/components/layout"
)

# Stale dev/debug files in repo root
$devFiles = @(
    "old_pairing.txt",
    "recovered_css_chunk.txt",
    "server-check.txt",
    "test-discovery.cjs",
    "test-startup.mjs",
    "finalize.js",
    "build-error.log",
    "build-log.txt",
    "build-output.txt",
    "dev-output.log",
    "debug.log"
)

Write-Host "`nDeleting dead component files..." -ForegroundColor Yellow
foreach ($f in $deadComponents) {
    if (Test-Path $f) { Remove-Item $f -Force; Write-Host "  Deleted: $f" -ForegroundColor Red }
    else { Write-Host "  Skipped (not found): $f" -ForegroundColor DarkGray }
}

Write-Host "`nDeleting dead utility files..." -ForegroundColor Yellow
foreach ($f in $deadUtils) {
    if (Test-Path $f) { Remove-Item $f -Force; Write-Host "  Deleted: $f" -ForegroundColor Red }
    else { Write-Host "  Skipped (not found): $f" -ForegroundColor DarkGray }
}

Write-Host "`nDeleting dead directories..." -ForegroundColor Yellow
foreach ($d in $deadDirs) {
    if (Test-Path $d) { Remove-Item $d -Recurse -Force; Write-Host "  Deleted: $d/" -ForegroundColor Red }
    else { Write-Host "  Skipped (not found): $d/" -ForegroundColor DarkGray }
}

Write-Host "`nDeleting stale dev/debug files..." -ForegroundColor Yellow
foreach ($f in $devFiles) {
    if (Test-Path $f) { Remove-Item $f -Force; Write-Host "  Deleted: $f" -ForegroundColor Red }
    else { Write-Host "  Skipped (not found): $f" -ForegroundColor DarkGray }
}

# Clean empty parent dirs
if ((Test-Path "src/utils") -and ((Get-ChildItem "src/utils" | Measure-Object).Count -eq 0)) {
    Remove-Item "src/utils" -Force; Write-Host "  Cleaned empty: src/utils/" -ForegroundColor DarkYellow
}
if ((Test-Path "src/theme") -and ((Get-ChildItem "src/theme" | Measure-Object).Count -eq 0)) {
    Remove-Item "src/theme" -Force; Write-Host "  Cleaned empty: src/theme/" -ForegroundColor DarkYellow
}

Write-Host "`nCleanup complete!" -ForegroundColor Green
Write-Host "Run 'npm run build' to verify the release build." -ForegroundColor Cyan
