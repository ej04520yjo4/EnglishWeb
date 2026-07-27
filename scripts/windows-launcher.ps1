param(
  [ValidateSet("Start", "Update")]
  [string]$Mode = "Start",
  [Parameter(Mandatory = $true)]
  [string]$ProjectDirectory,
  [switch]$CheckOnly,
  [switch]$SkipBrowser
)

$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8

$minimumNodeVersion = [Version]"22.13.0"
if ($env:ENGLISHWEB_CHECK_ONLY -eq "1") {
  $CheckOnly = $true
}
if ($env:ENGLISHWEB_SKIP_BROWSER -eq "1") {
  $SkipBrowser = $true
}

function Resolve-LauncherCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$DefaultName,
    [Parameter(Mandatory = $true)]
    [string]$OverrideVariable
  )

  $override = [Environment]::GetEnvironmentVariable($OverrideVariable)
  $candidate = if ([string]::IsNullOrWhiteSpace($override)) {
    $DefaultName
  } else {
    $override
  }

  $command = Get-Command $candidate -ErrorAction SilentlyContinue
  if ($null -eq $command) {
    return $null
  }
  return $command.Source
}

function Get-AvailableLocalPort {
  param(
    [int]$StartPort = 3000,
    [int]$EndPort = 3099
  )

  foreach ($port in $StartPort..$EndPort) {
    $listener = $null
    try {
      $listener = [System.Net.Sockets.TcpListener]::new(
        [System.Net.IPAddress]::Loopback,
        $port
      )
      $listener.Start()
      return $port
    } catch {
      continue
    } finally {
      if ($null -ne $listener) {
        try {
          $listener.Stop()
        } catch {
          # The listener never started, so there is nothing to stop.
        }
      }
    }
  }
  return $null
}

function Stop-WithMessage {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Messages,
    [Parameter(Mandatory = $true)]
    [int]$ExitCode
  )

  Write-Host ""
  foreach ($message in $Messages) {
    Write-Host $message -ForegroundColor Red
  }
  exit $ExitCode
}

try {
  $projectPath = [IO.Path]::GetFullPath($ProjectDirectory)
  if (-not (Test-Path -LiteralPath $projectPath -PathType Container)) {
    Stop-WithMessage @(
      "找不到英句練習專案目錄：",
      $projectPath
    ) 2
  }
  Set-Location -LiteralPath $projectPath

  $nodeCommand = Resolve-LauncherCommand "node.exe" "ENGLISHWEB_NODE_COMMAND"
  if ($null -eq $nodeCommand) {
    Stop-WithMessage @(
      "尚未安裝 Node.js。",
      "請先安裝 Node.js 22.13.0 以上的LTS版本。"
    ) 10
  }

  $nodeVersionText = (& $nodeCommand --version 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or $nodeVersionText -notmatch "v?(\d+\.\d+\.\d+)") {
    Stop-WithMessage @(
      "無法讀取 Node.js 版本。",
      "請重新安裝 Node.js 22.13.0 以上的LTS版本。"
    ) 11
  }
  $nodeVersion = [Version]$Matches[1]
  Write-Host "目前 Node.js 版本：$nodeVersionText" -ForegroundColor Cyan
  if ($nodeVersion -lt $minimumNodeVersion) {
    Stop-WithMessage @(
      "目前 Node.js 版本過舊。",
      "請安裝 Node.js 22.13.0 以上的LTS版本。"
    ) 12
  }

  $npmCommand = Resolve-LauncherCommand "npm.cmd" "ENGLISHWEB_NPM_COMMAND"
  if ($null -eq $npmCommand) {
    Stop-WithMessage @(
      "找不到 npm 指令。",
      "請重新安裝包含 npm 的 Node.js LTS 版本。"
    ) 13
  }

  if ($Mode -eq "Update") {
    $gitCommand = Resolve-LauncherCommand "git.exe" "ENGLISHWEB_GIT_COMMAND"
    if ($null -eq $gitCommand) {
      Stop-WithMessage @(
        "找不到 Git 指令。",
        "請先安裝 Git for Windows 後再更新。"
      ) 20
    }

    $gitDirectory = Join-Path $projectPath ".git"
    if (-not (Test-Path -LiteralPath $gitDirectory)) {
      Stop-WithMessage @(
        "目前資料夾不是 Git 專案，無法自動更新。",
        "請改用「啟動英句練習.bat」，或重新從 GitHub 下載專案。"
      ) 21
    }

    $workingChanges = (
      & $gitCommand -C $projectPath status --porcelain --untracked-files=normal 2>&1 |
        Out-String
    ).Trim()
    if ($LASTEXITCODE -ne 0) {
      Stop-WithMessage @(
        "無法檢查 Git 修改狀態。",
        $workingChanges
      ) 22
    }
    if (-not [string]::IsNullOrWhiteSpace($workingChanges)) {
      Stop-WithMessage @(
        "偵測到尚未提交的 Git 修改。",
        "為避免覆蓋您的變更，已停止更新。請先提交或暫存修改後再試。"
      ) 23
    }

    Write-Host ""
    Write-Host "正在從 GitHub 更新英句練習……" -ForegroundColor Yellow
    & $gitCommand -C $projectPath pull origin main
    if ($LASTEXITCODE -ne 0) {
      Stop-WithMessage @(
        "GitHub 更新失敗。",
        "請檢查網路連線與 Git 權限後再試。"
      ) 24
    }
  }

  $nodeModulesPath = Join-Path $projectPath "node_modules"
  if ($Mode -eq "Update" -or -not (Test-Path -LiteralPath $nodeModulesPath)) {
    Write-Host ""
    Write-Host "正在安裝必要套件，第一次使用可能需要幾分鐘……" -ForegroundColor Yellow
    & $npmCommand ci
    if ($LASTEXITCODE -ne 0) {
      Stop-WithMessage @(
        "npm ci 安裝失敗。",
        "請檢查網路連線、package-lock.json 與 npm 錯誤訊息後再試。"
      ) 30
    }
  } else {
    Write-Host "已找到 node_modules，略過套件安裝。" -ForegroundColor DarkGray
  }

  $port = Get-AvailableLocalPort
  if ($null -eq $port) {
    Stop-WithMessage @(
      "找不到可用的本機連接埠。",
      "請關閉部分本機服務後再試。"
    ) 40
  }

  $url = "http://localhost:$port"
  Write-Host ""
  Write-Host "英句練習網站執行中。" -ForegroundColor Green
  Write-Host "實際網址：$url" -ForegroundColor Cyan
  Write-Host "關閉此視窗或按 Ctrl+C 可停止網站。" -ForegroundColor Green
  Write-Host ""

  if ($CheckOnly) {
    Write-Host "啟動前檢查完成。" -ForegroundColor Green
    exit 0
  }

  $browserJob = $null
  if (-not $SkipBrowser) {
    $browserJob = Start-Job -ArgumentList $url -ScriptBlock {
      param($TargetUrl)
      $deadline = [DateTime]::UtcNow.AddMinutes(2)
      while ([DateTime]::UtcNow -lt $deadline) {
        try {
          $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 2
          if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            Start-Process $TargetUrl
            return
          }
        } catch {
          Start-Sleep -Milliseconds 500
        }
      }
    }
  }

  try {
    & $npmCommand run dev -- --host 127.0.0.1 --port $port --strictPort
    $devExitCode = $LASTEXITCODE
  } finally {
    if ($null -ne $browserJob) {
      Stop-Job -Job $browserJob -ErrorAction SilentlyContinue
      Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
    }
  }

  if ($devExitCode -ne 0) {
    Stop-WithMessage @(
      "網站啟動失敗。",
      "請查看上方 Vinext 或 npm 顯示的錯誤訊息。"
    ) 41
  }
  exit 0
} catch {
  Stop-WithMessage @(
    "啟動英句練習時發生未預期的錯誤。",
    $_.Exception.Message
  ) 99
}
