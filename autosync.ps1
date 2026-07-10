param(
  [int]$DebounceSeconds = 6,
  [int]$PollSeconds = 8,
  [string]$MessagePrefix = "autosync"
)

$script:AutosyncVersion = "2026-07-10.1"
$script:LogFile = Join-Path (Get-Location) "autosync.log"

$ErrorActionPreference = 'Stop'

if (-not (Test-Path ".git")) {
  throw "This folder is not a git repository."
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch -or $branch -eq "HEAD") {
  throw "Checkout a branch before starting autosync."
}

$script:lastSeenChangeSignature = ""
$script:lastRemoteCheck = (Get-Date).AddSeconds(-$PollSeconds)
$script:lastLocalPublishAttempt = [datetime]::MinValue

function Test-RebaseInProgress {
  return (Test-Path ".git\rebase-merge") -or (Test-Path ".git\rebase-apply")
}

function Test-HasLocalChanges {
  $status = git status --porcelain
  return -not [string]::IsNullOrWhiteSpace(($status -join "`n"))
}

function Get-LocalChangeSignature {
  $status = git status --porcelain
  if (-not $status) {
    return ""
  }

  return (($status | Sort-Object) -join "`n")
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

function Write-Info {
  param(
    [string]$Message,
    [ConsoleColor]$Color = [ConsoleColor]::Gray
  )

  $stamp = Get-Date -Format 'HH:mm:ss'
  $line = "[$stamp] $Message"
  Write-Host $line -ForegroundColor $Color
  Add-Content -Path $script:LogFile -Value $line
}

function Sync-RemoteIfNeeded {
  if (Test-RebaseInProgress) {
    return
  }

  if (Test-HasLocalChanges) {
    Write-Info "Skipping pull because this PC has local changes waiting to be published." Yellow
    return
  }

  Write-Info "Checking for remote updates..." Cyan
  Invoke-Git -Args @("fetch", "origin", $branch) -ErrorMessage "Fetch failed."

  $counts = (git rev-list --left-right --count "$branch...origin/$branch").Trim() -split '\s+'
  if ($counts.Length -lt 2) {
    return
  }

  $ahead = [int]$counts[0]
  $behind = [int]$counts[1]

  if ($behind -gt 0 -and $ahead -eq 0) {
    Invoke-Git -Args @("pull", "--rebase", "origin", $branch) -ErrorMessage "Pull failed."
    Write-Info "Remote updates pulled to this PC." Green
  }
}

function Publish-LocalChanges {
  param(
    [string]$ChangeSignature
  )

  if (Test-RebaseInProgress) {
    throw "Resolve the active rebase before autosync continues."
  }

  if (-not $ChangeSignature) {
    return
  }

  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $message = "$MessagePrefix $timestamp"

  Write-Info "Publishing local changes..." Cyan
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
    Write-Info "Autosync stopped because a conflict needs manual resolution." Red
    throw
  }

  Invoke-Git -Args @("push", "origin", $branch) -ErrorMessage "Push failed."
  $script:lastSeenChangeSignature = ""
  $script:lastLocalPublishAttempt = Get-Date
  Write-Info "Changes pushed and available to the other PC." Green
}

Write-Info "Autosync version $script:AutosyncVersion" Green
Write-Info "Autosync started on branch '$branch'." Green
Write-Info "Keep this window open on both PCs." Yellow

try {
  Sync-RemoteIfNeeded

  while ($true) {
    $now = Get-Date

    $changeSignature = Get-LocalChangeSignature
    if ($changeSignature) {
      if ($changeSignature -ne $script:lastSeenChangeSignature) {
        $script:lastSeenChangeSignature = $changeSignature
        $script:lastLocalPublishAttempt = $now
      }

      if (($now - $script:lastLocalPublishAttempt).TotalSeconds -ge $DebounceSeconds) {
        Publish-LocalChanges -ChangeSignature $changeSignature
      }
    }

    if (($now - $script:lastRemoteCheck).TotalSeconds -ge $PollSeconds) {
      Sync-RemoteIfNeeded
      $script:lastRemoteCheck = Get-Date
    }

    Start-Sleep -Seconds 2
  }
} finally {
}