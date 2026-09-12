# Shark Installer (Windows / PowerShell 5.1+)
#
#   .\install.ps1                  # install latest
#   .\install.ps1 -Version 1.0.0   # install a specific version
#   .\install.ps1 -Binary C:\path\to\shark.exe
#   .\install.ps1 -Update
#   .\install.ps1 -Uninstall
#
#   iwr https://raw.githubusercontent.com/YOUR_GITHUB/shark/dev/script/distro/install.ps1 | iex

[CmdletBinding()]
param(
  [string]$Version,
  [string]$Binary,
  [switch]$Update,
  [switch]$Uninstall,
  [switch]$NoModifyPath
)

$ErrorActionPreference = "Stop"

# GitHub repository (owner/repo) that hosts the release assets.
# Set before first release, e.g. -SHARK_REPO "suja/shark" or $env:SHARK_REPO.
$script:SHARK_REPO = if ($env:SHARK_REPO) { $env:SHARK_REPO } else { "YOUR_GITHUB/shark" }
$App = "shark"
$InstallDir = if ($env:SHARK_INSTALL_DIR) { $env:SHARK_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "$App\bin" }

function Write-Info([string]$Message) { Write-Host $Message }
function Write-Warn([string]$Message) { Write-Host $Message -ForegroundColor Yellow }
function Write-Err([string]$Message) { Write-Host $Message -ForegroundColor Red; exit 1 }

function Get-Target {
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") { "arm64" } else { "x64" }
  $target = "windows-$arch"
  if ($arch -eq "x64") {
    $avx2 = (Add-Type -MemberDefinition '[DllImport("kernel32.dll")] public static extern bool IsProcessorFeaturePresent(int ProcessorFeature);' -Name Kernel32 -Namespace Win32 -PassThru)::IsProcessorFeaturePresent(40)
    if (-not $avx2) { $target = "$target-baseline" }
  }
  return $target
}

function Get-DownloadUrl {
  param([string]$Target, [bool]$Latest)
  $ext = ".zip"
  if ($Latest) {
    return "https://github.com/$script:SHARK_REPO/releases/latest/download/$App-$Target$ext"
  }
  return "https://github.com/$script:SHARK_REPO/releases/download/shark-v$Version/$App-$Target$ext"
}

function Get-LatestVersion {
  $json = Invoke-RestMethod -Uri "https://api.github.com/repos/$script:SHARK_REPO/releases/latest" -Headers @{ "User-Agent" = "$App-installer" }
  return ($json.tag_name -replace "^shark-v", "")
}

function Remove-PathEntry {
  $current = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $current) { return }
  $parts = @($current -split ";" | Where-Object { $_ -and $_.TrimEnd("\") -ne $InstallDir.TrimEnd("\") })
  $next = $parts -join ";"
  if ($next -ne $current) {
    [Environment]::SetEnvironmentVariable("Path", $next, "User")
    Write-Info "Removed $InstallDir from user PATH"
  }
}

if ($Uninstall) {
  Write-Info "Uninstalling $App"
  $exe = Join-Path $InstallDir "$App.exe"
  if (Test-Path $exe) {
    Remove-Item $exe -Force
    Write-Info "Removed $exe"
  } else {
    Write-Warn "No binary found at $exe"
  }
  if ((Test-Path $InstallDir) -and -not (Get-ChildItem $InstallDir -Force)) {
    Remove-Item $InstallDir -Force
  }
  Remove-PathEntry
  Write-Info "$App has been uninstalled. User data is kept."
  exit 0
}

if (-not $Binary) {
  $Target = Get-Target
  $Latest = -not $Version
  $specific = if ($Latest) { Get-LatestVersion } else { $Version -replace "^v", "" }
  if ($Update) { Write-Info "Updating $App to $specific" }
  else { Write-Info "Installing $App version: $specific" }

  $exe = Join-Path $InstallDir "$App.exe"
  if (-not $Update -and (Test-Path $exe)) {
    $installed = (& $exe --version 2>$null | Out-String).Trim()
    if ($installed -eq $specific) {
      Write-Info "Version $specific already installed"
      exit 0
    }
    Write-Info "Installed version: $installed"
  }

  $url = Get-DownloadUrl -Target $Target -Latest $Latest
  New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  $zip = Join-Path $env:TEMP "$App-$specific.zip"
  Write-Info "Downloading $url"
  Invoke-WebRequest -Uri $url -OutFile $zip
  $extract = Join-Path $env:TEMP "$App-$specific-extracted"
  if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
  Expand-Archive -Path $zip -DestinationPath $extract -Force
  $found = Get-ChildItem -Path $extract -Recurse -Filter "$App*" -File | Where-Object { $_.Name -in @("$App", "$App.exe") } | Select-Object -First 1
  if (-not $found) {
    $found = Get-ChildItem -Path $extract -File | Select-Object -First 1
  }
  if (-not $found) { Write-Err "Could not locate the $App binary in the download" }
  Copy-Item $found.FullName -Destination $exe -Force
  Remove-Item $zip -Force -ErrorAction SilentlyContinue
  Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
} else {
  if (-not (Test-Path $Binary)) { Write-Err "Binary not found at $Binary" }
  New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  Copy-Item $Binary -Destination (Join-Path $InstallDir "$App.exe") -Force
  Write-Info "Installing $App from: $Binary"
}

if (-not $NoModifyPath) {
  $current = [Environment]::GetEnvironmentVariable("Path", "User")
  if ($current -notlike "*$InstallDir*") {
    $next = if ([string]::IsNullOrWhiteSpace($current)) { $InstallDir } else { "$current;$InstallDir" }
    [Environment]::SetEnvironmentVariable("Path", $next, "User")
    Write-Info "Added $InstallDir to user PATH (open a new terminal to use $App)"
  }
}

Write-Host ""
Write-Host "Shark is installed. To start:" -ForegroundColor DarkGray
Write-Host "  cd <project>" -ForegroundColor DarkGray
Write-Host "  $App" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Uninstall: re-run this installer with -Uninstall." -ForegroundColor DarkGray