#Requires -Version 5.1
# Amendments Tracker Script
param(
    [Parameter()]
    [ValidateSet('production', 'staging', 'local')]
    [string]$Environment = 'local',
    
    [Parameter()]
    [ValidateSet('table', 'json', 'yaml')]
    [string]$OutputFormat = 'table'
)

$ProjectRoot = "D:\pf-work"
$AmendmentsFile = Join-Path $ProjectRoot "handbook\60-delivery\amendments.yaml"

Write-Host ""
Write-Host "=== Amendments List ===" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host ""

if (-not (Test-Path $AmendmentsFile)) {
    Write-Host "WARNING: amendments.yaml not found at $AmendmentsFile" -ForegroundColor Yellow
    exit 0
}

$lines = Get-Content $AmendmentsFile -Encoding UTF8
$results = @()
$currentSprint = ""
$currentId = ""
$currentTitle = ""
$currentStatus = ""
$currentPriority = ""

foreach ($line in $lines) {
    # Sprint name
    if ($line -match '^\s+-\s+name:\s+(.+)') {
        $currentSprint = $Matches[1].Trim()
    }
    # Amendment id
    if ($line -match '^\s+-\s+id:\s+(\S+)') {
        # Save previous
        if ($currentId -ne "") {
            $results = $results + @(@{
                sprint = $currentSprint
                id = $currentId
                title = $currentTitle
                status = $currentStatus
                priority = $currentPriority
            })
        }
        $currentId = $Matches[1]
        $currentTitle = ""
        $currentStatus = ""
        $currentPriority = ""
    }
    # Title
    if ($line -match '^\s+title:\s+(.+)') {
        $currentTitle = $Matches[1].Trim()
    }
    # Status
    if ($line -match '^\s+status:\s+(\S+)') {
        $currentStatus = $Matches[1]
    }
    # Priority
    if ($line -match '^\s+priority:\s+(\S+)') {
        $currentPriority = $Matches[1]
    }
}

# Save last item
if ($currentId -ne "") {
    $results = $results + @(@{
        sprint = $currentSprint
        id = $currentId
        title = $currentTitle
        status = $currentStatus
        priority = $currentPriority
    })
}

if ($results.Count -eq 0) {
    Write-Host "No amendments found" -ForegroundColor Yellow
    exit 0
}

# Display
foreach ($item in $results) {
    $titleDisplay = if ($item.title.Length -gt 18) { $item.title.Substring(0, 15) + "..." } else { $item.title }
    Write-Host ("{0,-24} | {1,-10} | {2,-21} | {3,-11} | {4}" -f $item.sprint, $item.id, $titleDisplay, $item.status, $item.priority)
}

# Count explicitly
$total = $results.Count
$compCount = 0
$pendCount = 0
foreach ($r in $results) {
    if ($r.status -eq "completed") {
        $compCount = $compCount + 1
    }
    if ($r.status -eq "pending") {
        $pendCount = $pendCount + 1
    }
}

Write-Host ""
Write-Host "--- Summary ---" -ForegroundColor Cyan
Write-Host "Total: $total"
Write-Host "Completed: $compCount" -ForegroundColor Green
Write-Host "Pending: $pendCount" -ForegroundColor Yellow
Write-Host ""
