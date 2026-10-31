$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:4187"
$headers = @{
    Origin = $base
    "X-Forwarded-Proto" = "http"
}
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Invoke-TestApi {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Method,
        $Body
    )

    $params = @{
        Uri         = "$base$Path"
        Method      = $Method
        WebSession  = $session
        Headers     = $headers
        TimeoutSec  = 15
        ErrorAction = "Stop"
    }

    if ($PSBoundParameters.ContainsKey("Body") -or $null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ConvertTo-Json -InputObject $Body -Depth 8
    }

    Invoke-RestMethod @params
}

try {
    Write-Host "`n=== 1. Check isolated API ===" -ForegroundColor Cyan
    $health = Invoke-RestMethod -Uri "$base/api/bizzibuddi/auth/health" -TimeoutSec 5
    if (-not $health.ok) { throw "Isolated API health check failed." }
    Write-Host "PASS: Isolated API is healthy."

    $stamp = Get-Date -Format "yyMMddHHmmss"
    $username = "invguard$stamp"
    $email = "invguard$stamp@example.com"
    $password = [Guid]::NewGuid().ToString("N") + "Aa9!"

    Write-Host "`n=== 2. Create disposable account ===" -ForegroundColor Cyan
    $registration = Invoke-TestApi -Path "/api/bizzibuddi/auth/register" -Method "POST" -Body @{
        name = "Invoice Delete Guard Test"
        username = $username
        email = $email
        password = $password
    }

    if (-not $registration.ok -or -not $registration.authenticated) {
        throw "Registration did not return an authenticated account."
    }
    Write-Host "PASS: Account created: $username"

    $today = Get-Date -Format "yyyy-MM-dd"
    $dueDate = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")

    Write-Host "`n=== 3. Create disposable client ===" -ForegroundColor Cyan
    $personResult = Invoke-TestApi -Path "/api/bizzibuddi/auth/people" -Method "POST" -Body @{
        name = "Invoice Delete Test Client"
        email = ""
        phone = ""
        clientSince = $today
    }

    $person = $personResult.person
    if (-not $person.id) { throw "Client creation did not return a client ID." }
    Write-Host "PASS: Client created."

    Write-Host "`n=== 4. Create issued invoice ===" -ForegroundColor Cyan
    $invoiceResult = Invoke-TestApi -Path "/api/bizzibuddi/auth/invoices" -Method "POST" -Body @{
        personId = $person.id
        amount = 100
        issueDate = $today
        dueDate = $dueDate
        description = "Disposable invoice deletion guard test"
        status = "Issued"
    }

    $invoice = $invoiceResult.invoice
    if (-not $invoice.id) { throw "Invoice creation did not return an invoice ID." }
    $invoiceId = [string]$invoice.id
    Write-Host "PASS: Invoice created: $invoiceId"

    Write-Host "`n=== 5. Record `$25 payment ===" -ForegroundColor Cyan
    $paymentResult = Invoke-TestApi -Path "/api/bizzibuddi/auth/invoices/$invoiceId/payments" -Method "POST" -Body @{
        amount = 25
        method = "Bank Transfer"
        date = $today
        description = "Disposable payment for deletion guard test"
    }

    if (-not $paymentResult.ok) { throw "Payment endpoint did not confirm success." }
    Write-Host "PASS: Payment recorded."

    Write-Host "`n=== 6. Attempt to delete the paid invoice ===" -ForegroundColor Cyan
    $deleteStatus = 0
    $deleteBody = ""

    try {
        $deleteResponse = Invoke-WebRequest `
            -Uri "$base/api/bizzibuddi/auth/invoices/$invoiceId" `
            -Method Delete `
            -WebSession $session `
            -Headers $headers `
            -TimeoutSec 15 `
            -UseBasicParsing

        $deleteStatus = [int]$deleteResponse.StatusCode
        $deleteBody = [string]$deleteResponse.Content
    }
    catch {
        $response = $_.Exception.Response
        if ($null -eq $response) { throw }

        $deleteStatus = [int]$response.StatusCode
        try {
            $stream = $response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $deleteBody = $reader.ReadToEnd()
                $reader.Close()
            }
        }
        catch {
            $deleteBody = "Could not read error response body."
        }
    }

    Write-Host "Delete HTTP status: $deleteStatus"
    if ($deleteBody) { Write-Host "Delete response: $deleteBody" }

    Write-Host "`n=== 7. Verify invoice still exists ===" -ForegroundColor Cyan
    $invoiceListResult = Invoke-TestApi -Path "/api/bizzibuddi/auth/invoices" -Method "GET"
    $savedInvoice = @($invoiceListResult.invoices) |
        Where-Object { [string]$_.id -eq $invoiceId } |
        Select-Object -First 1

    if (-not $savedInvoice) { throw "Invoice was not found after the delete attempt." }
    Write-Host "PASS: Invoice still exists."

    Write-Host "`n=== 8. Verify payment still exists ===" -ForegroundColor Cyan
    $paymentsResult = Invoke-TestApi -Path "/api/bizzibuddi/auth/invoices/$invoiceId/payments" -Method "GET"
    $paymentItems = @($paymentsResult.payments)
    $paymentTotal = 0.0
    foreach ($item in $paymentItems) {
        $paymentTotal += [double]$item.amount
    }

    Write-Host "Payments returned: $($paymentItems.Count)"
    Write-Host ("Payment total: {0:N2}" -f $paymentTotal)

    if ($paymentItems.Count -lt 1 -or [Math]::Abs($paymentTotal - 25) -gt 0.009) {
        throw "Expected the $25 payment to remain after the delete attempt."
    }
    Write-Host "PASS: The `$25 payment remains recorded."

    if ($deleteStatus -ge 400 -and $deleteStatus -lt 500) {
        Write-Host "`nPASS: Server rejected deletion of the paid invoice." -ForegroundColor Green
        Write-Host "PASS: Invoice remains in the isolated database." -ForegroundColor Green
        Write-Host "PASS: Payment remains in the isolated database." -ForegroundColor Green
    }
    elseif ($deleteStatus -ge 200 -and $deleteStatus -lt 300) {
        throw "FAIL: Server reported successful deletion of a paid invoice."
    }
    else {
        throw "INCONCLUSIVE: Unexpected delete HTTP status $deleteStatus."
    }

    Write-Host "`nTest account: $username"
    Write-Host "Test invoice ID: $invoiceId"
    Write-Host "Disposable records remain in the isolated test database."
}
catch {
    Write-Host "`nTEST STOPPED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "No cleanup or deletion of test records was attempted."
    throw
}
finally {
    $password = $null
}
