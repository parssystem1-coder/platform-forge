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

# Project base path
$ProjectRoot = "D:\pf-work"
$AmendmentsFile = Join-Path $ProjectRoot "handbook\60-delivery\amendments.yaml"

function Write-Amendment-Table {
    param($Amendments)
    
    $tableData = @()
    foreach ($sprint in $Amendments.sprints) {
        foreach ($amendment in $sprint.amendments) {
            $tableData += [PSCustomObject]@{
                'Sprint' = $sprint.name
                'ID' = $amendment.id
                'Title' = $amendment.title
                'Status' = $amendment.status
                'Priority' = $amendment.priority
            }
        }
    }
    
    $tableData | Format-Table -AutoSize
}

function Write-Amendment-Json {
    param($Amendments)
    $Amendments | ConvertTo-Json -Depth 10
}

function Write-Amendment-Yaml {
    param($Amendments)
    $output = @()
    foreach ($sprint in $Amendments.sprints) {
        $output += "`n# $($sprint.name)"
        foreach ($amendment in $sprint.amendments) {
            $output += "- id: $($amendment.id)"
            $output += "  title: `"$($amendment.title)`""
            $output += "  status: $($amendment.status)"
            $output += "  priority: $($amendment.priority)"
            if ($amendment.description) {
                $output += "  description: `"$($amendment.description)`""
            }
        }
    }
    $output -join "`n"
}

try {
    Write-Host ""
    Write-Host "=== Amendments List ===" -ForegroundColor Cyan
    Write-Host "Environment: $Environment"
    Write-Host ""
    
    if (-not (Test-Path $AmendmentsFile)) {
        Write-Host "WARNING: amendments.yaml not found" -ForegroundColor Yellow
        Write-Host "Path: $AmendmentsFile" -ForegroundColor Gray
        
        $HandbookDir = Split-Path $AmendmentsFile
        if (-not (Test-Path $HandbookDir)) {
            New-Item -ItemType Directory -Path $HandbookDir -Force | Out-Null
            Write-Host "Created: $HandbookDir" -ForegroundColor Green
        }
        
        $sampleContent = @"
sprints:
  - name: Sprint 3 (P-IDENTITY)
    amendments:
      - id: AMEND-001
        title: Add MFA with TOTP
        status: completed
        priority: P1
        description: Implement multi-factor auth using otplib
      - id: AMEND-002
        title: Improve backup codes
        status: pending
        priority: P2
      - id: AMEND-003
        title: Test MFA flow
        status: pending
        priority: P1
"@
        Set-Content -Path $AmendmentsFile -Value $sampleContent -Encoding UTF8
        Write-Host "Created sample file" -ForegroundColor Green
        Write-Host ""
    }
    
    $content = Get-Content $AmendmentsFile -Raw -Encoding UTF8
    
    $amendments = @{
        sprints = @()
    }
    
    $currentSprint = $null
    $inAmendments = $false
    
    foreach ($line in ($content -split "`r?`n")) {
        if ($line -match '^\s*-\s*name:\s*(.+)$') {
            $currentSprint = @{ name = $Matches[1].Trim(); amendments = @() }
            $amendments.sprints += $currentSprint
            $inAmendments = $false
        }
        elseif ($line -match '^\s*amendments:') {
            $inAmendments = $true
        }
        elseif ($inAmendments -and $currentSprint -and $line -match '^\s*-\s*id:\s*(.+)$') {
            $currentAmendment = @{ id = $Matches[1].Trim() }
            $currentSprint.amendments += $currentAmendment
        }
        elseif ($currentSprint -and $currentSprint.amendments.Count -gt 0) {
            $currentAmendment = $currentSprint.amendments[-1]
            if ($line -match '^\s*title:\s*(.+)$') {
                $currentAmendment.title = $Matches[1].Trim() -replace '^["'']|["'']$', ''
            }
            elseif ($line -match '^\s*status:\s*(.+)$') {
                $currentAmendment.status = $Matches[1].Trim()
            }
            elseif ($line -match '^\s*priority:\s*(.+)$') {
                $currentAmendment.priority = $Matches[1].Trim()
            }
            elseif ($line -match '^\s*description:\s*(.+)$') {
                $currentAmendment.description = $Matches[1].Trim() -replace '^["'']|["'']$', ''
            }
        }
    }
    
    switch ($OutputFormat) {
        'table' { Write-Amendment-Table $amendments }
        'json'  { Write-Amendment-Json $amendments }
        'yaml'  { Write-Amendment-Yaml $amendments }
    }
    
    $totalAmendments = ($amendments.sprints | ForEach-Object { $_.amendments }).Count
    $completedCount = ($amendments.sprints | ForEach-Object { $_.amendments } | Where-Object { $_.status -eq 'completed' }).Count
    $pendingCount = $totalAmendments - $completedCount
    
    Write-Host "`n--- Summary ---" -ForegroundColor Cyan
    Write-Host "Total amendments: $totalAmendments"
    Write-Host "Completed: $completedCount" -ForegroundColor Green
    Write-Host "Pending: $pendingCount" -ForegroundColor Yellow
    
} catch {
    Write-Host "`nERROR: $_" -ForegroundColor Red
    exit 1
}
