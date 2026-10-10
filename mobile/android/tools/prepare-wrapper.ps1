$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$jar = Join-Path $project 'gradle\wrapper\gradle-wrapper.jar'
$url = 'https://services.gradle.org/distributions/gradle-8.13-wrapper.jar'
$expectedSha256 = '81a82aaea5abcc8ff68b3dfcb58b3c3c429378efd98e7433460610fecd7ae45f'

function Test-Wrapper {
    if (-not (Test-Path $jar)) { return $false }
    $actual = (Get-FileHash -Path $jar -Algorithm SHA256).Hash.ToLowerInvariant()
    return ($actual -eq $expectedSha256)
}

if (Test-Wrapper) {
    Write-Host 'Gradle Wrapper 8.13 ya está verificado.'
    exit 0
}
if (Test-Path $jar) { Remove-Item -Force $jar }
Write-Host 'Descargando Gradle Wrapper 8.13 del proveedor oficial...'
try {
    Invoke-WebRequest -Uri $url -OutFile $jar -MaximumRedirection 5
} catch {
    Write-Error "No se pudo descargar el wrapper oficial: $_"
    exit 1
}
if (-not (Test-Wrapper)) {
    Remove-Item -Force $jar -ErrorAction SilentlyContinue
    Write-Error 'Falló la verificación SHA-256 del Gradle Wrapper. No se utilizará.'
    exit 1
}
Write-Host 'Gradle Wrapper descargado y verificado.'
