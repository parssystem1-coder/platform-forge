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
    
    $content = Get-Content $AmendmentsFile -Raw -Encoding UTF8
    $lines = $content -split "`r?`n"
    
    $results = @()
    $currentSprint = ""
    $inAmendments = $false
    $currentItem = $null
    $indentation = 0
    
    foreach ($line in $lines) {
        # Skip empty lines
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        
        # Calculate indentation level
        $spaces = $line.Length - $line.TrimStart().Length
        $indentLevel = [Math]::Floor($spaces / 2)
        
        # Match sprints section: - name: Sprint X
        if ($line -match '^\s+-\s+name:\s+(.+)$') {
            $currentSprint = $Matches[1].Trim()
            $inAmendments = $false
            $indentLevel = 0
        }
        # Match amendments header
        elseif ($line -match '^\s+amendments:\s*$') {
            $inAmendments = $true
        }
        # Match amendment entry: - id: AMEND-XXX
        elseif ($inAmendments -and $line -match '^\s+-\s+id:\s+([^$]+)$') {
            # Save previous item
            if ($currentItem) {
                $results += $currentItem
            }
            # Start new item
            $currentItem = @{
                sprint = $currentSprint
                id = $Matches[1].Trim()
                title = ""
                status = ""
                priority = ""
            }
        }
        # Match title (same indent as id)
        elseif ($currentItem -and $line -match '^\s{4,}title:\s*(.+)$') {
            $currentItem.title = $Matches[1].Trim()
        }
        # Match status
        elseif ($currentItem -and $line -match '^\s{4,}status:\s*(.+)$') {
            $currentItem.status = $Matches[1].Trim()
        }
        # Match priority
        elseif ($currentItem -and $line -match '^\s{4,}priority:\s*(.+)$') {
            $currentItem.priority = $Matches[1].Trim()
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
        $statusColor = switch ($item.status) {
            'completed' { 'Green' }
            'pending' { 'Yellow' }
            'in_progress' { 'Cyan' }
            default { 'White' }
        }
        Write-Host ("{0,-24} | {1,-10} | {2,-20} | {3,-11} | {4}" -f $item.sprint, $item.id, $item.title.Substring(0, [Math]::Min(20, $item.title.Length)), $item.status, $item.priority)
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
