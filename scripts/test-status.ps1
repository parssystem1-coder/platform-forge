$ProjectRoot = "D:\pf-work"
$AmendmentsFile = Join-Path $ProjectRoot "handbook\60-delivery\amendments.yaml"

Write-Host "Reading: $AmendmentsFile"
Write-Host ""

$lines = Get-Content $AmendmentsFile -Encoding UTF8
$results = @()
$currentId = ""

foreach ($line in $lines) {
    if ($line -match '^\s+-\s+id:\s+(\S+)') {
        $currentId = $Matches[1]
    }
    if ($line -match '^\s+status:\s+(\S+)') {
        $currentStatus = $Matches[1]
        Write-Host "Found: $currentId -> '$currentStatus'"
        
        $item = @{
            id = $currentId
            status = $currentStatus
        }
        $results = $results + @($item)
    }
}

Write-Host ""
Write-Host "Total found: $($results.Count)"

# Count explicitly
$compCount = 0
$pendCount = 0
foreach ($r in $results) {
    Write-Host "  Item: id=$($r.id), status='$($r.status)'"
    if ($r.status -eq "completed") {
        $compCount = $compCount + 1
    }
    if ($r.status -eq "pending") {
        $pendCount = $pendCount + 1
    }
}

Write-Host "Completed: $compCount"
Write-Host "Pending: $pendCount"
