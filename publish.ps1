param(
  [string]$Message = "update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = 'Stop'

Write-Host "Checking repository status..." -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
  throw "This folder is not a git repository."
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Args,
    [string]$ErrorMessage = "Git command failed."
  )

  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw $ErrorMessage
  }
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch) {
  throw "Could not detect current git branch."
}

if ($branch -eq "HEAD") {
  throw "Detached HEAD state detected. Checkout a branch first."
}

git add .

$staged = git diff --cached --name-only
if ($staged) {
  Invoke-Git -Args @("commit", "-m", $Message) -ErrorMessage "Commit failed."
  Write-Host "Commit created on '$branch'." -ForegroundColor Green
} else {
  Write-Host "No local changes to commit. Continuing with sync..." -ForegroundColor Yellow
}

Write-Host "Syncing with remote branch '$branch'..." -ForegroundColor Cyan

Invoke-Git -Args @("fetch", "origin", $branch) -ErrorMessage "Fetch failed."

try {
  Invoke-Git -Args @("rebase", "origin/$branch") -ErrorMessage "Rebase pull failed."
} catch {
  Write-Host "Rebase failed (likely conflict). Resolve conflicts and run publish again." -ForegroundColor Red
  Write-Host "Helpful commands:" -ForegroundColor Yellow
  Write-Host "  git status"
  Write-Host "  git add <resolved-files>"
  Write-Host "  git rebase --continue"
  Write-Host "  # or abort with: git rebase --abort"
  throw
}

Invoke-Git -Args @("push", "origin", $branch) -ErrorMessage "Push failed."

Write-Host "Publish completed. GitHub Pages will update shortly." -ForegroundColor Green
