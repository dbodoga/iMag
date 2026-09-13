# Windows launcher. Run by double-clicking Start-iMag.cmd.
[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$CheckOnly,
    [switch]$SmokeTest,
    [ValidateRange(1024, 65535)][int]$BackendPort = 5188,
    [ValidateRange(1024, 65535)][int]$FrontendPort = 5189
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$frontendRoot = Join-Path $projectRoot 'Frontend'
$logRoot = Join-Path $projectRoot '.imag-run'
$backendUrl = "http://localhost:$BackendPort"
$frontendUrl = "http://localhost:$FrontendPort"
$backendProcess = $null
$frontendProcess = $null
$mutex = $null
$ownsMutex = $false
$exitCode = 0
$oldEnvironment = $env:ASPNETCORE_ENVIRONMENT
$oldBackendUrl = $env:IMAG_BACKEND_URL

function Write-Step([string]$Message) {
    Write-Host ("[iMag] " + $Message) -ForegroundColor Cyan
}

function Require-Command([string]$Name, [string]$HelpMessage) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) { throw $HelpMessage }
    return $command.Source
}

function Test-Port([int]$Port) {
    foreach ($address in @('127.0.0.1', '::1')) {
        $client = New-Object System.Net.Sockets.TcpClient
        try {
            $pending = $client.ConnectAsync($address, $Port)
            if ($pending.Wait(500) -and $client.Connected) { return $true }
        } catch {
            # A refused connection means this address is free.
        } finally {
            $client.Dispose()
        }
    }
    return $false
}

function Test-DockerReady {
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'SilentlyContinue'
        & $dockerExe info --format '{{.ServerVersion}}' 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previousPreference
    }
}

function Wait-ForUrl([string]$Url, [System.Diagnostics.Process]$Process, [int]$TimeoutSeconds, [string]$Name) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $Process.Refresh()
        if ($Process.HasExited) { throw "$Name s-a oprit. Verifica fisierele din $logRoot." }
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) { return }
        } catch {
            # The development server may still be compiling or applying migrations.
        }
        Start-Sleep -Milliseconds 500
    }
    throw "$Name nu a raspuns la timp. Verifica fisierele din $logRoot."
}

function Stop-OwnedProcess([System.Diagnostics.Process]$Process) {
    if ($null -eq $Process) { return }
    $Process.Refresh()
    if (-not $Process.HasExited) {
        # Only the process started by this launcher and its children are stopped.
        & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
    }
}

try {
    $mutex = New-Object System.Threading.Mutex($false, ("Local\iMag-Launcher-$BackendPort-$FrontendPort"))
    try { $ownsMutex = $mutex.WaitOne(0) } catch [System.Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { throw 'Exista deja un script iMag pornit. Foloseste fereastra existenta.' }

    Write-Step 'Verific programele necesare...'
    $dockerExe = Require-Command 'docker.exe' 'Instaleaza Docker Desktop: https://www.docker.com/products/docker-desktop/'
    $dotnetExe = Require-Command 'dotnet.exe' 'Instaleaza .NET 10 SDK: https://dotnet.microsoft.com/download/dotnet/10.0'
    $nodeExe = Require-Command 'node.exe' 'Instaleaza Node.js 24 LTS: https://nodejs.org/en/download'
    $npmCommand = Require-Command 'npm.cmd' 'Instaleaza Node.js cu npm, apoi redeschide terminalul.'
    $sdks = & $dotnetExe --list-sdks
    if ($LASTEXITCODE -ne 0 -or -not ($sdks -match '^10\.')) { throw 'Este necesar .NET 10 SDK, nu doar Runtime.' }
    $nodeVersion = & $nodeExe --version
    if ($LASTEXITCODE -ne 0 -or [int]($nodeVersion.TrimStart('v').Split('.')[0]) -lt 24) { throw 'Este necesar Node.js 24 sau mai nou.' }
    if (-not (Test-Path (Join-Path $frontendRoot 'package-lock.json'))) { throw 'Lipseste Frontend/package-lock.json. Extrage intregul proiect.' }

    if ($BackendPort -eq $FrontendPort) { throw 'Backend-ul si frontend-ul trebuie sa foloseasca porturi diferite.' }
    foreach ($port in @($BackendPort, $FrontendPort)) {
        if (Test-Port $port) { throw "Portul $port este ocupat. Opreste instanta iMag deja pornita sau aplicatia care foloseste acest port." }
    }
    if ($CheckOnly) {
        Write-Step 'Verificare reusita: .NET 10 SDK, Node.js, npm si Docker sunt instalate; porturile sunt libere.'
    } else {
        if (-not (Test-DockerReady)) {
            $desktopPath = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
            if (-not (Test-Path $desktopPath)) { throw 'Porneste Docker Desktop, apoi ruleaza din nou scriptul.' }
            Write-Step 'Pornesc Docker Desktop. Prima pornire poate dura cateva minute...'
            Start-Process -FilePath $desktopPath -WindowStyle Hidden | Out-Null
            $deadline = (Get-Date).AddMinutes(3)
            while (-not (Test-DockerReady)) {
                if ((Get-Date) -gt $deadline) { throw 'Docker Desktop nu este pregatit. Verifica fereastra Docker si foloseste containere Linux.' }
                Start-Sleep -Seconds 2
            }
        }
        New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
        Write-Step 'Pornesc baza de date PostgreSQL...'
        Push-Location $projectRoot
        try {
            & $dockerExe compose up -d --wait
            if ($LASTEXITCODE -ne 0) { throw 'Baza de date nu a pornit. Verifica Docker Desktop si portul 5433.' }
        } finally { Pop-Location }

        $lockHash = (Get-FileHash (Join-Path $frontendRoot 'package-lock.json') -Algorithm SHA256).Hash
        $stampPath = Join-Path $logRoot 'frontend-dependencies.sha256'
        $savedHash = if (Test-Path $stampPath) { (Get-Content $stampPath -Raw).Trim() } else { '' }
        $vitePath = Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'
        if (-not (Test-Path $vitePath) -or $savedHash -ne $lockHash) {
            Write-Step 'Instalez dependentele frontend. Este nevoie de internet...'
            Push-Location $frontendRoot
            try {
                & $npmCommand ci --no-fund
                if ($LASTEXITCODE -ne 0) { throw 'Instalarea npm a esuat. Verifica accesul la internet si mesajul de mai sus.' }
            } finally { Pop-Location }
            Set-Content -Path $stampPath -Value $lockHash -Encoding ASCII
        }

        Write-Step 'Pornesc backend-ul si astept crearea tabelelor...'
        $env:ASPNETCORE_ENVIRONMENT = 'Development'
        $backendProcess = Start-Process -FilePath $dotnetExe -ArgumentList @(
            'run', '--project', 'Backend/iMag.Api', '--no-launch-profile', '--urls', $backendUrl
        ) -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot 'backend.log') -RedirectStandardError (Join-Path $logRoot 'backend-error.log')
        Wait-ForUrl "$backendUrl/health" $backendProcess 180 'Backend-ul'

        $env:IMAG_BACKEND_URL = $backendUrl
        Write-Step 'Pornesc interfata web...'
        $frontendProcess = Start-Process -FilePath $nodeExe -ArgumentList @(
            'node_modules/vite/bin/vite.js', '--host', 'localhost', '--port', $FrontendPort.ToString(), '--strictPort'
        ) -WorkingDirectory $frontendRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot 'frontend.log') -RedirectStandardError (Join-Path $logRoot 'frontend-error.log')
        Wait-ForUrl $frontendUrl $frontendProcess 60 'Frontend-ul'
        $catalog = Invoke-RestMethod -Uri "$frontendUrl/api/products" -TimeoutSec 10
        if ($null -eq $catalog) { throw 'Conexiunea dintre frontend si backend nu functioneaza.' }

        Write-Host ''
        Write-Host "iMag este pregatit: $frontendUrl" -ForegroundColor Green
        Write-Host "Swagger: $backendUrl/swagger"
        Write-Host "Jurnale pentru diagnostic: $logRoot"
        if ($SmokeTest) {
            Write-Step 'Test de pornire reusit: PostgreSQL, API, frontend si catalog. Opresc procesele de test.'
        } else {
            if (-not $NoBrowser) { Start-Process $frontendUrl | Out-Null }
            Write-Host ''
            Write-Host 'Lasa aceasta fereastra deschisa cat timp folosesti iMag.'
            Read-Host 'Apasa ENTER aici pentru a opri backend-ul si frontend-ul' | Out-Null
        }
    }
} catch {
    $exitCode = 1
    Write-Host ''
    Write-Host ("EROARE: " + $_.Exception.Message) -ForegroundColor Red
} finally {
    Stop-OwnedProcess $frontendProcess
    Stop-OwnedProcess $backendProcess
    $env:ASPNETCORE_ENVIRONMENT = $oldEnvironment
    $env:IMAG_BACKEND_URL = $oldBackendUrl
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    if ($null -ne $mutex) { $mutex.Dispose() }
}
exit $exitCode
