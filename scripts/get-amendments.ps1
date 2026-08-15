#Requires -Version 5.1
# Amendments Tracker Script
# Usage: .\get-amendments.ps1 [-Environment local|staging|production] [-OutputFormat table|json|yaml]

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

$content = Get-Content $AmendmentsFile -Raw -Encoding UTF8
$allLines = $content -split "`r?`n"

$results = @()
$currentSprint = ""
$currentItem = $null

foreach ($line in $allLines) {
    $cleanLine = $line.TrimEnd()
    if ([string]::IsNullOrWhiteSpace($cleanLine)) { continue }
    
    $spaces = 0
    for ($i = 0; $i -lt $cleanLine.Length; $i++) {
        if ($cleanLine[$i] -eq ' ') { $spaces++ } else { break }
    }
    
    $trimmed = $cleanLine.Trim()
    
    # Sprint name: "  - name:"
    if ($spaces -eq 2 -and $trimmed.StartsWith("- name:")) {
        $currentSprint = $trimmed.Substring(7).Trim()
    }
    # Amendment id: "      - id:"
    elseif ($spaces -eq 6 -and $trimmed.StartsWith("- id:")) {
        if ($null -ne $currentItem) {
            $results += $currentItem
        }
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
        $currentItem.status = $trimmed.Substring(7).Trim()
    }
    # Priority
    elseif ($spaces -eq 8 -and $trimmed.StartsWith("priority:")) {
        $currentItem.priority = $trimmed.Substring(9).Trim()
    }
}

if ($null -ne $currentItem) {
    $results += $currentItem
}

if ($results.Count -eq 0) {
    Write-Host "No amendments found" -ForegroundColor Yellow
    exit 0
}

foreach ($item in $results) {
    $titleDisplay = if ($item.title.Length -gt 18) { $item.title.Substring(0, 15) + "..." } else { $item.title }
    $statusDisplay = switch ($item.status) {
        'completed' { "completed" }
        'pending' { "pending" }
        'in_progress' { "in_progress" }
        default { $item.status }
    }
    Write-Host ("{0,-24} | {1,-10} | {2,-21} | {3,-11} | {4}" -f $item.sprint, $item.id, $titleDisplay, $statusDisplay, $item.priority)
}

$total = $results.Count
$completed = ($results | Where-Object { $_.status -eq 'completed' }).Count
$pending = $total - $completed

Write-Host ""
Write-Host "--- Summary ---" -ForegroundColor Cyan
Write-Host "Total: $total"
Write-Host "Completed: $completed" -ForegroundColor Green
Write-Host "Pending: $pending" -ForegroundColor Yellow
Write-Host ""
