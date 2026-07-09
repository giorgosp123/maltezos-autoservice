$ErrorActionPreference = 'Stop'

if (-not (Test-Path ".git")) {
  throw "This folder is not a git repository."
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch -or $branch -eq "HEAD") {
  throw "Checkout a branch before syncing."
}

Write-Host "Syncing branch '$branch' with origin..." -ForegroundColor Cyan

git fetch origin $branch
if ($LASTEXITCODE -ne 0) {
  throw "Fetch failed."
}

git pull --rebase origin $branch
if ($LASTEXITCODE -ne 0) {
  Write-Host "Sync failed (possible conflict)." -ForegroundColor Red
  Write-Host "Use: git status, resolve conflicts, git add <files>, git rebase --continue" -ForegroundColor Yellow
  throw "Rebase pull failed."
}

Write-Host "Sync complete. This PC is up to date." -ForegroundColor Green
