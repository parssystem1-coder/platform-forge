#Requires -Version 5.1
<#
.SYNOPSIS
    دریافت اصلاحات (amendments) از مخزن
.DESCRIPTION
    این اسکریپت اصلاحات را از فایل amendments.yaml دریافت و نمایش می‌دهد
.PARAMETER Environment
    محیط: production, staging, local
.PARAMETER OutputFormat
    فرمت خروجی: table, json, yaml
.EXAMPLE
    .\get-amendments.ps1
    .\get-amendments.ps1 -Environment staging -OutputFormat json
#>

param(
    [Parameter()]
    [ValidateSet('production', 'staging', 'local')]
    [string]$Environment = 'local',
    
    [Parameter()]
    [ValidateSet('table', 'json', 'yaml')]
    [string]$OutputFormat = 'table'
)

$ErrorActionPreference = 'Stop'

# مسیر پایه پروژه
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
    
    # ساده‌ترین فرمت YAML بدون نیاز به ماژول خارجی
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

# Main
try {
    Write-Host "`n=== دریافت اصلاحات (Amendments) ===" -ForegroundColor Cyan
    Write-Host "محیط: $Environment" -ForegroundColor Gray
    Write-Host ""
    
    if (-not (Test-Path $AmendmentsFile)) {
        Write-Host "⚠️  فایل amendments.yaml یافت نشد" -ForegroundColor Yellow
        Write-Host "   مسیر: $AmendmentsFile" -ForegroundColor Gray
        
        # بررسی وجود پوشه handbook
        $HandbookDir = Split-Path $AmendmentsFile
        if (-not (Test-Path $HandbookDir)) {
            New-Item -ItemType Directory -Path $HandbookDir -Force | Out-Null
            Write-Host "   ✓ پوشه handbook ایجاد شد" -ForegroundColor Green
        }
        
        # ایجاد فایل نمونه
        $sampleContent = @"
sprints:
  - name: Sprint 3 (P-IDENTITY)
    amendments:
      - id: AMEND-001
        title: افزودن MFA با TOTP
        status: completed
        priority: P1
        description: پیاده‌سازی احراز هویت چندعاملی با استفاده از otplib
      - id: AMEND-002
        title: بهبود backup codes
        status: pending
        priority: P2
        description: افزودن قابلیت تولید و تأیید backup codes
      - id: AMEND-003
        title: تست MFA flow
        status: pending
        priority: P1
        description: نوشتن تست‌های واحد برای MFA
"@
        Set-Content -Path $AmendmentsFile -Value $sampleContent -Encoding UTF8
        Write-Host "   ✓ فایل نمونه ایجاد شد" -ForegroundColor Green
        Write-Host ""
    }
    
    # خواندن فایل YAML (ساده‌شده)
    $content = Get-Content $AmendmentsFile -Raw -Encoding UTF8
    
    # پارس کردن ساده YAML
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
    
    # نمایش بر اساس فرمت
    switch ($OutputFormat) {
        'table' { Write-Amendment-Table $amendments }
        'json'  { Write-Amendment-Json $amendments }
        'yaml'  { Write-Amendment-Yaml $amendments }
    }
    
    # آمار
    $totalAmendments = ($amendments.sprints | ForEach-Object { $_.amendments }).Count
    $completedCount = ($amendments.sprints | ForEach-Object { $_.amendments } | Where-Object { $_.status -eq 'completed' }).Count
    $pendingCount = $totalAmendments - $completedCount
    
    Write-Host "`n--- خلاصه ---" -ForegroundColor Cyan
    Write-Host "تعداد کل اصلاحات: $totalAmendments"
    Write-Host "تکمیل شده: $completedCount" -ForegroundColor Green
    Write-Host "در انتظار: $pendingCount" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ خطا: $_" -ForegroundColor Red
    exit 1
}
