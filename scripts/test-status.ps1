$ProjectRoot = "D:\pf-work"
$AmendmentsFile = Join-Path $ProjectRoot "handbook\60-delivery\amendments.yaml"

Write-Host "Reading: $AmendmentsFile"
Write-Host ""

$lines = Get-Content $AmendmentsFile -Encoding UTF8
$results = @()

foreach ($line in $lines) {
    if ($line -match '^\s+-\s+id:\s+(\S+)') {
        $currentId = $Matches[1]
    }
    if ($line -match '^\s+status:\s+(\S+)') {
        $currentStatus = $Matches[1]
        Write-Host "Found: $currentId -> $currentStatus"
        $results += @{ id = $currentId; status = $currentStatus }
    }
}

Write-Host ""
Write-Host "Total found: $($results.Count)"
Write-Host "Completed: $(($results | Where-Object { $_.status -eq 'completed' }).Count)"
Write-Host "Pending: $(($results | Where-Object { $_.status -eq 'pending' }).Count)"
