#Requires -Version 5.1
# Amendments Tracker Script
param(
    [string]$Environment = 'local'
)

$ProjectRoot = "D:\pf-work"
$AmendmentsFile = Join-Path $ProjectRoot "handbook\60-delivery\amendments.yaml"

Write-Host ""
Write-Host "=== Amendments List ===" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host ""

$lines = Get-Content $AmendmentsFile -Encoding UTF8
$results = @()
$currentSprint = ""
$currentId = ""
$currentTitle = ""
$currentStatus = ""
$currentPriority = ""

foreach ($line in $lines) {
    $cleanLine = $line
    if ([string]::IsNullOrWhiteSpace($cleanLine)) { continue }
    
    $leadingSpaces = 0
    for ($i = 0; $i -lt $cleanLine.Length; $i++) {
        if ($cleanLine[$i] -eq ' ') { $leadingSpaces++ } else { break }
    }
    
    $trimmed = $cleanLine.Trim()
    
    # Sprint name
    if ($leadingSpaces -eq 2 -and $trimmed.StartsWith("- name:")) {
        # SAVE previous amendment BEFORE resetting
        if ($currentId -ne "") {
            $results += @{
                sprint = $currentSprint
                id = $currentId
                title = $currentTitle
                status = $currentStatus
                priority = $currentPriority
            }
        }
        $currentSprint = $trimmed.Substring(7).Trim()
        $currentId = ""
        $currentTitle = ""
        $currentStatus = ""
        $currentPriority = ""
    }
    # Amendment id
    elseif ($leadingSpaces -eq 6 -and $trimmed.StartsWith("- id:")) {
        if ($currentId -ne "") {
            $results += @{
                sprint = $currentSprint
                id = $currentId
                title = $currentTitle
                status = $currentStatus
                priority = $currentPriority
            }
        }
        $currentId = $trimmed.Substring(5).Trim()
        $currentTitle = ""
        $currentStatus = ""
        $currentPriority = ""
    }
    # Title
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
    $results += @{
        sprint = $currentSprint
        id = $currentId
        title = $currentTitle
        status = $currentStatus
        priority = $currentPriority
    }
}

# Display
foreach ($item in $results) {
    $titleDisplay = if ($item.title.Length -gt 18) { $item.title.Substring(0, 15) + "..." } else { $item.title }
    Write-Host ("{0,-24} | {1,-10} | {2,-21} | {3,-11} | {4}" -f $item.sprint, $item.id, $titleDisplay, $item.status, $item.priority)
}

# Count
$total = $results.Count
$compCount = 0
$pendCount = 0
foreach ($r in $results) {
    if ($r.status -eq "completed") { $compCount++ }
    if ($r.status -eq "pending") { $pendCount++ }
}

Write-Host ""
Write-Host "--- Summary ---" -ForegroundColor Cyan
Write-Host "Total: $total"
Write-Host "Completed: $compCount" -ForegroundColor Green
Write-Host "Pending: $pendCount" -ForegroundColor Yellow
