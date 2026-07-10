param(
  [int]$DebounceSeconds = 6,
  [int]$PollSeconds = 20,
  [string]$MessagePrefix = "autosync"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path ".git")) {
  throw "This folder is not a git repository."
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch -or $branch -eq "HEAD") {
  throw "Checkout a branch before starting autosync."
}

$script:pendingLocalChanges = $false
$script:lastLocalEvent = Get-Date
$script:lastRemoteCheck = (Get-Date).AddSeconds(-$PollSeconds)
$script:isSyncRunning = $false

function Test-RebaseInProgress {
  return (Test-Path ".git\rebase-merge") -or (Test-Path ".git\rebase-apply")
}

function Test-HasLocalChanges {
  $status = git status --porcelain
  return -not [string]::IsNullOrWhiteSpace(($status -join "`n"))
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Args,
    [Parameter(Mandatory = $true)]
    [string]$ErrorMessage
  )

  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw $ErrorMessage
  }
}

function Sync-RemoteIfNeeded {
  if (Test-RebaseInProgress) {
    return
  }

  if (Test-HasLocalChanges) {
    return
  }

  Write-Host "Checking for remote updates..." -ForegroundColor Cyan
  Invoke-Git -Args @("fetch", "origin", $branch) -ErrorMessage "Fetch failed."

  $counts = (git rev-list --left-right --count "$branch...origin/$branch").Trim() -split '\s+'
  if ($counts.Length -lt 2) {
    return
  }

  $ahead = [int]$counts[0]
  $behind = [int]$counts[1]

  if ($behind -gt 0 -and $ahead -eq 0) {
    Invoke-Git -Args @("pull", "--rebase", "origin", $branch) -ErrorMessage "Pull failed."
    Write-Host "Remote updates pulled to this PC." -ForegroundColor Green
  }
}

function Publish-LocalChanges {
  if (Test-RebaseInProgress) {
    throw "Resolve the active rebase before autosync continues."
  }

  if (-not (Test-HasLocalChanges)) {
    return
  }

  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $message = "$MessagePrefix $timestamp"

  Write-Host "Publishing local changes..." -ForegroundColor Cyan
  Invoke-Git -Args @("add", ".") -ErrorMessage "git add failed."

  $staged = git diff --cached --name-only
  if (-not $staged) {
    return
  }

  Invoke-Git -Args @("commit", "-m", $message) -ErrorMessage "Commit failed."
  Invoke-Git -Args @("fetch", "origin", $branch) -ErrorMessage "Fetch failed."

  try {
    Invoke-Git -Args @("pull", "--rebase", "origin", $branch) -ErrorMessage "Rebase pull failed."
  } catch {
    Write-Host "Autosync stopped because a conflict needs manual resolution." -ForegroundColor Red
    throw
  }

  Invoke-Git -Args @("push", "origin", $branch) -ErrorMessage "Push failed."
  Write-Host "Changes pushed and available to the other PC." -ForegroundColor Green
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = (Get-Location).Path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$onChange = {
  $path = $Event.SourceEventArgs.FullPath
  if ($path -like "*\.git\*") {
    return
  }

  $script:pendingLocalChanges = $true
  $script:lastLocalEvent = Get-Date
}

$subscriptions = @(
  Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $onChange
  Register-ObjectEvent -InputObject $watcher -EventName Created -Action $onChange
  Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $onChange
  Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $onChange
)

Write-Host "Autosync started on branch '$branch'." -ForegroundColor Green
Write-Host "Keep this window open on both PCs." -ForegroundColor Yellow

try {
  Sync-RemoteIfNeeded

  while ($true) {
    $now = Get-Date

    if (-not $script:isSyncRunning -and $script:pendingLocalChanges -and (($now - $script:lastLocalEvent).TotalSeconds -ge $DebounceSeconds)) {
      $script:isSyncRunning = $true
      try {
        Publish-LocalChanges
        $script:pendingLocalChanges = $false
      } finally {
        $script:isSyncRunning = $false
      }
    }

    if (-not $script:isSyncRunning -and (($now - $script:lastRemoteCheck).TotalSeconds -ge $PollSeconds)) {
      $script:isSyncRunning = $true
      try {
        Sync-RemoteIfNeeded
      } finally {
        $script:lastRemoteCheck = Get-Date
        $script:isSyncRunning = $false
      }
    }

    Start-Sleep -Seconds 2
  }
} finally {
  foreach ($subscription in $subscriptions) {
    Unregister-Event -SubscriptionId $subscription.Id -ErrorAction SilentlyContinue
    $subscription | Remove-Job -Force -ErrorAction SilentlyContinue
  }

  $watcher.Dispose()
}