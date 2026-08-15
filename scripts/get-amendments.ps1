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
    $trimmed = $line.TrimStart()
    $leadingSpaces = $line.Length - $trimmed.Length
    
    # Sprint name: starts at position 2 (for "- name:")
    if ($leadingSpaces -eq 2 -and $trimmed.StartsWith("- name:")) {
        $currentSprint = $trimmed.Substring(7).Trim()
    }
    # Amendment id: starts at position 6 (for "    - id:")
    elseif ($leadingSpaces -eq 6 -and $trimmed.StartsWith("- id:")) {
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
        $currentId = $trimmed.Substring(5).Trim()
        $currentTitle = ""
        $currentStatus = ""
        $currentPriority = ""
    }
    # Title: starts at position 8 (for "        title:")
    elseif ($leadingSpaces -eq 8 -and $trimmed.StartsWith("title:")) {
        $currentTitle = $trimmed.Substring(6).Trim()
    }
    # Status
    elseif ($leadingSpaces -eq 8 -and $trimmed.StartsWith("status:")) {
        $currentStatus = $trimmed.Substring(7).Trim()
    }
    # Priority
    elseif ($leadingSpaces -eq 8 -and $trimmed.StartsWith("priority:")) {
        $currentPriority = $trimmed.Substring(9).Trim()
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
