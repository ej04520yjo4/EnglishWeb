param(
  [string]$ProjectDirectory = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8

$launcherPath = Join-Path $ProjectDirectory "scripts\windows-launcher.ps1"
$temporaryRoot = Join-Path $env:TEMP "英句 練習 啟動測試-$PID"
$fakeCommands = Join-Path $temporaryRoot "fake commands"
$sampleProject = Join-Path $temporaryRoot "含 空格與中文的專案"
$failedInstallProject = Join-Path $temporaryRoot "npm 失敗專案"

function Assert-LauncherCondition {
  param(
    [bool]$Condition,
    [string]$Message
  )
  if (-not $Condition) {
    throw $Message
  }
}

function Invoke-LauncherCheck {
  param(
    [string]$TargetProject,
    [string]$Mode = "Start",
    [string]$NodeOverride,
    [string]$NpmOverride,
    [string]$GitOverride
  )

  $saved = @{
    ENGLISHWEB_TEST_LAUNCHER = $env:ENGLISHWEB_TEST_LAUNCHER
    ENGLISHWEB_TEST_PROJECT = $env:ENGLISHWEB_TEST_PROJECT
    ENGLISHWEB_TEST_MODE = $env:ENGLISHWEB_TEST_MODE
    ENGLISHWEB_NODE_COMMAND = $env:ENGLISHWEB_NODE_COMMAND
    ENGLISHWEB_NPM_COMMAND = $env:ENGLISHWEB_NPM_COMMAND
    ENGLISHWEB_GIT_COMMAND = $env:ENGLISHWEB_GIT_COMMAND
  }
  try {
    $env:ENGLISHWEB_TEST_LAUNCHER = $launcherPath
    $env:ENGLISHWEB_TEST_PROJECT = $TargetProject
    $env:ENGLISHWEB_TEST_MODE = $Mode
    $env:ENGLISHWEB_NODE_COMMAND = $NodeOverride
    $env:ENGLISHWEB_NPM_COMMAND = $NpmOverride
    $env:ENGLISHWEB_GIT_COMMAND = $GitOverride
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -Command '$code = [IO.File]::ReadAllText($env:ENGLISHWEB_TEST_LAUNCHER, [Text.Encoding]::UTF8); & ([ScriptBlock]::Create($code)) -Mode $env:ENGLISHWEB_TEST_MODE -ProjectDirectory $env:ENGLISHWEB_TEST_PROJECT -CheckOnly -SkipBrowser' 2>&1
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
    }
    return @{
      ExitCode = $LASTEXITCODE
      Output = ($output | Out-String)
    }
  } finally {
    foreach ($entry in $saved.GetEnumerator()) {
      [Environment]::SetEnvironmentVariable(
        $entry.Key,
        $entry.Value,
        "Process"
      )
    }
  }
}

try {
  New-Item -ItemType Directory -Path $fakeCommands -Force | Out-Null
  New-Item -ItemType Directory -Path $sampleProject -Force | Out-Null
  New-Item -ItemType Directory -Path $failedInstallProject -Force | Out-Null

  $fakeNode = Join-Path $fakeCommands "node.cmd"
  $fakeNpmSuccess = Join-Path $fakeCommands "npm-success.cmd"
  $fakeNpmFailure = Join-Path $fakeCommands "npm-failure.cmd"
  [IO.File]::WriteAllText(
    $fakeNode,
    "@echo v22.13.0`r`n@exit /b 0`r`n",
    [Text.Encoding]::ASCII
  )
  [IO.File]::WriteAllText(
    $fakeNpmSuccess,
    "@if /i `"%~1`"==`"ci`" mkdir `"%CD%\node_modules`" >nul 2>&1`r`n@exit /b 0`r`n",
    [Text.Encoding]::ASCII
  )
  [IO.File]::WriteAllText(
    $fakeNpmFailure,
    "@echo Simulated npm ci failure 1>&2`r`n@exit /b 1`r`n",
    [Text.Encoding]::ASCII
  )

  New-Item -ItemType Directory -Path (Join-Path $sampleProject "node_modules") -Force |
    Out-Null
  $installed = Invoke-LauncherCheck `
    -TargetProject $sampleProject `
    -NodeOverride $fakeNode `
    -NpmOverride $fakeNpmSuccess
  Assert-LauncherCondition ($installed.ExitCode -eq 0) "node_modules 已存在情境失敗。"
  Assert-LauncherCondition (
    $installed.Output.Contains("已找到 node_modules")
  ) "未確認略過 npm ci。"
  Write-Host "通過：已安裝環境有 node_modules" -ForegroundColor Green

  Remove-Item -LiteralPath (Join-Path $sampleProject "node_modules") -Recurse -Force
  $freshInstall = Invoke-LauncherCheck `
    -TargetProject $sampleProject `
    -NodeOverride $fakeNode `
    -NpmOverride $fakeNpmSuccess
  Assert-LauncherCondition ($freshInstall.ExitCode -eq 0) "無 node_modules 情境失敗。"
  Assert-LauncherCondition (
    Test-Path -LiteralPath (Join-Path $sampleProject "node_modules")
  ) "npm ci 成功後未建立 node_modules。"
  Write-Host "通過：新安裝環境沒有 node_modules" -ForegroundColor Green

  $missingNode = Invoke-LauncherCheck `
    -TargetProject $sampleProject `
    -NodeOverride "definitely-missing-node.exe" `
    -NpmOverride $fakeNpmSuccess
  Assert-LauncherCondition ($missingNode.ExitCode -eq 10) "Node.js 不存在情境未被攔截。"
  Assert-LauncherCondition (
    $missingNode.Output.Contains("尚未安裝 Node.js。")
  ) "Node.js 不存在訊息不正確。"
  Write-Host "通過：Node.js 不存在" -ForegroundColor Green

  $failedInstall = Invoke-LauncherCheck `
    -TargetProject $failedInstallProject `
    -NodeOverride $fakeNode `
    -NpmOverride $fakeNpmFailure
  Assert-LauncherCondition ($failedInstall.ExitCode -eq 30) "npm ci 失敗情境未被攔截。"
  Assert-LauncherCondition (
    $failedInstall.Output.Contains("npm ci 安裝失敗。")
  ) "npm ci 失敗訊息不正確。"
  Write-Host "通過：npm ci 失敗" -ForegroundColor Green

  $listener = [System.Net.Sockets.TcpListener]::new(
    [System.Net.IPAddress]::Loopback,
    3000
  )
  $listener.Start()
  try {
    $occupiedPort = Invoke-LauncherCheck `
      -TargetProject $sampleProject `
      -NodeOverride $fakeNode `
      -NpmOverride $fakeNpmSuccess
  } finally {
    $listener.Stop()
  }
  Assert-LauncherCondition ($occupiedPort.ExitCode -eq 0) "連接埠占用情境失敗。"
  Assert-LauncherCondition (
    $occupiedPort.Output -match "實際網址：http://localhost:(\d+)" -and
    [int]$Matches[1] -gt 3000
  ) "連接埠占用時未改用其他網址。"
  Write-Host "通過：port 3000 被占用" -ForegroundColor Green

  Assert-LauncherCondition (
    $sampleProject -match "[\s\u4e00-\u9fff]"
  ) "測試專案路徑未包含空格與中文字。"
  Assert-LauncherCondition ($freshInstall.ExitCode -eq 0) "中文空格路徑情境失敗。"
  Write-Host "通過：路徑中包含空格與中文字" -ForegroundColor Green

  $dirtyUpdate = Invoke-LauncherCheck `
    -TargetProject $ProjectDirectory `
    -Mode "Update"
  Assert-LauncherCondition ($dirtyUpdate.ExitCode -eq 23) "未攔截尚未提交的 Git 修改。"
  Assert-LauncherCondition (
    $dirtyUpdate.Output.Contains("偵測到尚未提交的 Git 修改。")
  ) "Git 修改警告訊息不正確。"
  Write-Host "通過：更新前攔截尚未提交的 Git 修改" -ForegroundColor Green

  Write-Host ""
  Write-Host "Windows 一鍵啟動情境全部通過。" -ForegroundColor Green
} finally {
  $resolvedTemp = [IO.Path]::GetFullPath($env:TEMP)
  $resolvedTarget = [IO.Path]::GetFullPath($temporaryRoot)
  if ($resolvedTarget.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $resolvedTarget -Recurse -Force -ErrorAction SilentlyContinue
  }
}
