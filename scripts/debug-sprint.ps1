$ProjectRoot = "D:\pf-work"
$AmendmentsFile = Join-Path $ProjectRoot "handbook\60-delivery\amendments.yaml"

Write-Host "=== Debug Sprint Detection ==="
Write-Host ""

$lines = Get-Content $AmendmentsFile -Encoding UTF8
$currentSprint = ""

foreach ($line in $lines) {
    $cleanLine = $line
    if ([string]::IsNullOrWhiteSpace($cleanLine)) { continue }
    
    $leadingSpaces = 0
    for ($i = 0; $i -lt $cleanLine.Length; $i++) {
        if ($cleanLine[$i] -eq ' ') { $leadingSpaces++ } else { break }
    }
    
    $trimmed = $cleanLine.Trim()
    
    # Sprint name detection
    if ($leadingSpaces -eq 2 -and $trimmed.StartsWith("- name:")) {
        $currentSprint = $trimmed.Substring(7).Trim()
        Write-Host "[SPRINT] Line '$line'" -ForegroundColor Green
        Write-Host "         Leading spaces: $leadingSpaces"
        Write-Host "         Trimmed: '$trimmed'"
        Write-Host "         Sprint name: '$currentSprint'"
        Write-Host ""
    }
    
    # Amendment id detection
    if ($leadingSpaces -eq 6 -and $trimmed.StartsWith("- id:")) {
        $amendId = $trimmed.Substring(5).Trim()
        Write-Host "[AMEND]  Line '$line'" -ForegroundColor Yellow
        Write-Host "         Leading spaces: $leadingSpaces"
        Write-Host "         Trimmed: '$trimmed'"
        Write-Host "         Amendment ID: '$amendId'"
        Write-Host "         Current Sprint: '$currentSprint'"
        Write-Host ""
    }
}
