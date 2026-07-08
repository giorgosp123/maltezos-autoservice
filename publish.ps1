param(
  [string]$Message = "update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = 'Stop'

Write-Host "Checking repository status..." -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
  throw "This folder is not a git repository."
}

git add .

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host "No changes to publish." -ForegroundColor Yellow
  exit 0
}

git commit -m $Message
git push

Write-Host "Publish completed. GitHub Pages will update shortly." -ForegroundColor Green
