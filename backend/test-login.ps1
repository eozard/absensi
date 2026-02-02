$body = @{
    nama = "enamenam"
    password = "123456"
    deviceId = "device_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

Write-Host "Testing login with:"
Write-Host ($body | ConvertFrom-Json | Format-List | Out-String)

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "`n✅ LOGIN SUCCESS!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "`n❌ LOGIN FAILED!" -ForegroundColor Red
    Write-Host "Status:" $_.Exception.Response.StatusCode.value__
    Write-Host "Error:" $_.ErrorDetails.Message
}
