$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot "android"
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { "C:\Users\naufal raihan s\AppData\Local\Android\Sdk" }

$compatibleJdk = Get-ChildItem -Path $repoRoot -Directory -Filter "jdk-*" |
  Where-Object { $_.Name -match '^jdk-(21|22|23|24)(\.|$|-)' } |
  Sort-Object Name -Descending |
  Select-Object -First 1

if ($compatibleJdk) {
  $env:JAVA_HOME = $compatibleJdk.FullName
  $env:Path = "$($compatibleJdk.FullName)\bin;$env:Path"
}

if (-not (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
  throw "JAVA_HOME tidak valid. Pakai JDK 21-24, lalu set JAVA_HOME atau taruh folder jdk-21* sampai jdk-24* di root project."
}

$javaReleaseFile = Join-Path $env:JAVA_HOME "release"
if (Test-Path $javaReleaseFile) {
  $javaVersionLine = Get-Content $javaReleaseFile | Where-Object { $_ -like 'JAVA_VERSION="*' } | Select-Object -First 1
  if ($javaVersionLine -match 'JAVA_VERSION="(\d+)') {
    $majorVersion = [int]$Matches[1]
    if ($majorVersion -lt 21 -or $majorVersion -gt 24) {
      throw "Versi JDK yang aktif adalah $majorVersion. Untuk build Android project ini, pakai JDK 21 sampai 24."
    }
  }
}

if (-not (Test-Path $sdkRoot)) {
  throw "Android SDK tidak ditemukan di '$sdkRoot'. Set ANDROID_HOME/ANDROID_SDK_ROOT ke folder SDK yang benar."
}

$localPropertiesPath = Join-Path $androidDir "local.properties"
$sdkDirEscaped = $sdkRoot.Replace("\", "\\")
Set-Content -Path $localPropertiesPath -Value "sdk.dir=$sdkDirEscaped" -Encoding ASCII

Push-Location $repoRoot
try {
  npm run build:android
  Push-Location $androidDir
  try {
    .\gradlew.bat assembleDebug
  } finally {
    Pop-Location
  }
} finally {
  Pop-Location
}
