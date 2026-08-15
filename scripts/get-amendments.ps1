#Requires -Version 5.1
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

# Read file
$content = Get-Content $AmendmentsFile -Raw -Encoding UTF8
$allLines = $content -split "`r?`n"

$results = @()
$currentSprint = ""
$currentItem = $null
$debugMode = $false  # Set to $true for debugging

foreach ($line in $allLines) {
    $cleanLine = $line.TrimEnd()
    
    # Skip empty lines
    if ([string]::IsNullOrWhiteSpace($cleanLine)) { continue }
    
    # Calculate leading spaces
    $spaces = 0
    for ($i = 0; $i -lt $cleanLine.Length; $i++) {
        if ($cleanLine[$i] -eq ' ') { $spaces++ } else { break }
    }
    
    $trimmed = $cleanLine.Trim()
    
    # Sprint name: "  - name:"
    if ($spaces -eq 2 -and $trimmed.StartsWith("- name:")) {
        $currentSprint = $trimmed.Substring(7).Trim()
        if ($debugMode) { Write-Host "[DEBUG] Sprint: $currentSprint" -ForegroundColor Gray }
    }
    # Amendment id: "      - id:"
    elseif ($spaces -eq 6 -and $trimmed.StartsWith("- id:")) {
        # Save previous
        if ($null -ne $currentItem) {
            $results += $currentItem
            if ($debugMode) { Write-Host "[DEBUG] Added: $($currentItem.id) status=$($currentItem.status)" -ForegroundColor Gray }
        }
        # New item
        $currentItem = @{
            sprint = $currentSprint
            id = $trimmed.Substring(5).Trim()
            title = ""
            status = ""
            priority = ""
        }
    }
    # Title
    elseif ($spaces -eq 8 -and $trimmed.StartsWith("title:")) {
        $currentItem.title = $trimmed.Substring(6).Trim()
    }
    # Status
    elseif ($spaces -eq 8 -and $trimmed.StartsWith("status:")) {
        $statusVal = $trimmed.Substring(7).Trim()
        $currentItem.status = $statusVal
        if ($debugMode) { Write-Host "[DEBUG] Status for $($currentItem.id): '$statusVal'" -ForegroundColor Gray }
    }
    # Priority
    elseif ($spaces -eq 8 -and $trimmed.StartsWith("priority:")) {
        $currentItem.priority = $trimmed.Substring(9).Trim()
    }
}

# Add last item
if ($null -ne $currentItem) {
    $results += $currentItem
    if ($debugMode) { Write-Host "[DEBUG] Added last: $($currentItem.id) status=$($currentItem.status)" -ForegroundColor Gray }
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

# Count by exact status value
$total = $results.Count
$completed = 0
$pending = 0

foreach ($item in $results) {
    if ($item.status -eq "completed") {
        $completed++
    } else {
        $pending++
    }
}

Write-Host ""
Write-Host "--- Summary ---" -ForegroundColor Cyan
Write-Host "Total: $total"
Write-Host "Completed: $completed" -ForegroundColor Green
Write-Host "Pending: $pending" -ForegroundColor Yellow
