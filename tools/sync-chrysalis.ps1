[CmdletBinding()]
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

function Invoke-Git([string[]]$Arguments) {
    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Arguments -join ' ')"
    }
}

Write-Host "Chrysalis Studio synchronisation" -ForegroundColor Cyan
Write-Host "---------------------------------"

$currentBranch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($currentBranch)) {
    throw 'Unable to determine the current Git branch.'
}

if ($currentBranch -ne 'main') {
    throw "Synchronisation stopped: you are on '$currentBranch'. Switch to main before running this script."
}

$status = @(git status --porcelain)
if ($status.Count -gt 0) {
    Write-Host 'Synchronisation stopped: you have uncommitted local changes.' -ForegroundColor Yellow
    git status --short
    Write-Host ''
    Write-Host 'Commit, stash, or otherwise preserve your changes before retrying.'
    exit 1
}

Write-Host 'Fetching updates from origin...' -ForegroundColor Gray
Invoke-Git @('fetch', 'origin', '--prune')

$localSha = (& git rev-parse HEAD).Trim()
$remoteSha = (& git rev-parse origin/main).Trim()

if ($localSha -eq $remoteSha) {
    Write-Host 'Already synchronised with origin/main.' -ForegroundColor Green
} else {
    Write-Host 'Updating local main using fast-forward only...' -ForegroundColor Gray
    Invoke-Git @('pull', '--ff-only', 'origin', 'main')
    Write-Host 'Local main updated successfully.' -ForegroundColor Green
}

if (-not $SkipBuild) {
    Write-Host 'Running production build...' -ForegroundColor Gray
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw 'The production build failed. Review the output before continuing.'
    }
    Write-Host 'Production build passed.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Synchronisation complete.' -ForegroundColor Green
& git log -1 --oneline
