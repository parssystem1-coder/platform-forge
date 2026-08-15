#Requires -Version 5.1
param(
    [Parameter()]
    [ValidateSet('production', 'staging', 'local')]
    [string]$Environment = 'local',
    
    [Parameter()]
    [ValidateSet('table', 'json', 'yaml')]
    [string]$OutputFormat = 'table'
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = "D:\pf-work"
$AmendmentsFile = Join-Path $ProjectRoot "handbook\60-delivery\amendments.yaml"

try {
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
    $currentItem = $null
    
    foreach ($line in $lines) {
        # Trim the line for easier matching
        $trimmed = $line.TrimStart()
        $leadingSpaces = $line.Length - $trimmed.Length
        
        # Skip empty lines
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        
        # Match sprint name: "  - name: xxx"
        if ($leadingSpaces -eq 2 -and $trimmed.StartsWith("- name:")) {
            $currentSprint = $trimmed.Substring(7).Trim()
            $currentItem = $null
        }
        # Match amendment id: "      - id: xxx"
        elseif ($leadingSpaces -eq 6 -and $trimmed.StartsWith("- id:")) {
            # Save previous item
            if ($currentItem) {
                $results += $currentItem
            }
            # Start new item
            $currentItem = @{
                sprint = $currentSprint
                id = $trimmed.Substring(5).Trim()
                title = ""
                status = ""
                priority = ""
            }
        }
        # Match title: "        title: xxx"
        elseif ($leadingSpaces -eq 8 -and $currentItem -and $trimmed.StartsWith("title:")) {
            $currentItem.title = $trimmed.Substring(6).Trim()
        }
        # Match status: "        status: xxx"
        elseif ($leadingSpaces -eq 8 -and $currentItem -and $trimmed.StartsWith("status:")) {
            $currentItem.status = $trimmed.Substring(7).Trim()
        }
        # Match priority: "        priority: xxx"
        elseif ($leadingSpaces -eq 8 -and $currentItem -and $trimmed.StartsWith("priority:")) {
            $currentItem.priority = $trimmed.Substring(9).Trim()
        }
    }
    
    # Add last item
    if ($currentItem) {
        $results += $currentItem
    }
    
    if ($results.Count -eq 0) {
        Write-Host "No amendments found" -ForegroundColor Yellow
        exit 0
    }
    
    # Display results
    foreach ($item in $results) {
        $statusDisplay = switch ($item.status) {
            'completed' { "completed" }
            'pending' { "pending" }
            'in_progress' { "in_progress" }
            default { $item.status }
        }
        
        # Truncate title if too long
        $titleDisplay = if ($item.title.Length -gt 20) { $item.title.Substring(0, 17) + "..." } else { $item.title }
        
        Write-Host ("{0,-24} | {1,-10} | {2,-22} | {3,-11} | {4}" -f $item.sprint, $item.id, $titleDisplay, $statusDisplay, $item.priority)
    }
    
    $total = $results.Count
    $completed = ($results | Where-Object { $_.status -eq 'completed' }).Count
    $pending = $total - $completed
    
    Write-Host ""
    Write-Host "--- Summary ---" -ForegroundColor Cyan
    Write-Host "Total: $total"
    Write-Host "Completed: $completed" -ForegroundColor Green
    Write-Host "Pending: $pending" -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}
