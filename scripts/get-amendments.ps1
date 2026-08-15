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

function Write-Amendment-Table {
    param($Data)
    
    $tableData = @()
    foreach ($item in $Data) {
        $statusColor = switch ($item.status) {
            'completed' { 'Green' }
            'pending' { 'Yellow' }
            'in_progress' { 'Cyan' }
            default { 'White' }
        }
        $tableData += [PSCustomObject]@{
            Sprint = $item.sprint
            ID = $item.id
            Title = $item.title
            Status = $item.status
            Priority = $item.priority
        }
    }
    
    $tableData | Format-Table -AutoSize
}

function Write-Amendment-Json {
    param($Data)
    @{ sprints = $Data } | ConvertTo-Json -Depth 10
}

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
    
    foreach ($line in $lines) {
        # Match sprint name: - name: Sprint X
        if ($line -match '^\s*-\s*name:\s*(.+)$') {
            $currentSprint = $Matches[1].Trim()
            $inAmendments = $false
        }
        # Match amendments: section header
        elseif ($line -match '^\s*amendments:\s*$') {
            $inAmendments = $true
        }
        # Match amendment: - id: AMEND-XXX
        elseif ($inAmendments -and $line -match '^\s*-\s*id:\s*(.+)$') {
            if ($currentItem) {
                $results += $currentItem
            }
            $currentItem = @{
                sprint = $currentSprint
                id = $Matches[1].Trim()
                title = ""
                status = ""
                priority = ""
            }
        }
        # Match title: title: xxx
        elseif ($currentItem -and $line -match '^\s+title:\s*(.+)$') {
            $currentItem.title = $Matches[1].Trim() -replace '^["'']|["'']$', ''
        }
        # Match status: status: xxx
        elseif ($currentItem -and $line -match '^\s+status:\s*(.+)$') {
            $currentItem.status = $Matches[1].Trim()
        }
        # Match priority: priority: xxx
        elseif ($currentItem -and $line -match '^\s+priority:\s*(.+)$') {
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
    
    switch ($OutputFormat) {
        'table' { Write-Amendment-Table $results }
        'json'  { Write-Amendment-Json $results }
        'yaml'  { Get-Content $AmendmentsFile -Encoding UTF8 }
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
