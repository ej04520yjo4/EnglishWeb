param(
  [switch]$Download
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$audioDirectory = Join-Path $projectRoot "public\audio\kk"
$manifestPath = Join-Path $projectRoot "public\data\kk-audio-attribution.json"
$apiEndpoint = "https://commons.wikimedia.org/w/api.php"
$headers = @{
  "User-Agent" = "EnglishLearningApp/1.0 (local curriculum audio assets)"
}

$assets = @(
  @{ symbol = "i"; slug = "vowel-i"; title = "Close front unrounded vowel.ogg" },
  @{ symbol = "ɪ"; slug = "vowel-small-i"; title = "Near-close near-front unrounded vowel.ogg" },
  @{ symbol = "e"; slug = "vowel-e"; title = "En-us-A.ogg" },
  @{ symbol = "ɛ"; slug = "vowel-epsilon"; title = "Open-mid front unrounded vowel.ogg" },
  @{ symbol = "æ"; slug = "vowel-ash"; title = "Near-open front unrounded vowel.ogg" },
  @{ symbol = "ɑ"; slug = "vowel-script-a"; title = "Open back unrounded vowel.ogg" },
  @{ symbol = "ɔ"; slug = "vowel-open-o"; title = "Open-mid back rounded vowel.ogg" },
  @{ symbol = "o"; slug = "vowel-o"; title = "En-us-O.ogg" },
  @{ symbol = "ʊ"; slug = "vowel-upsilon"; title = "Near-close near-back rounded vowel.ogg" },
  @{ symbol = "u"; slug = "vowel-u"; title = "Close back rounded vowel.ogg" },
  @{ symbol = "ʌ"; slug = "vowel-wedge"; title = "Open-mid back unrounded vowel.ogg" },
  @{ symbol = "ə"; slug = "vowel-schwa"; title = "Schwa.ogg" },
  @{ symbol = "ɝ"; slug = "vowel-r-colored-stressed"; title = "PR-r-coloured open-mid central unrounded vowel.ogg" },
  @{ symbol = "ɚ"; slug = "vowel-r-colored-unstressed"; title = "PR-r-coloured open-mid central unrounded vowel.ogg" },
  @{ symbol = "aɪ"; slug = "vowel-ai"; title = "En-us-I.ogg" },
  @{ symbol = "aʊ"; slug = "vowel-au"; title = "En-us-ow.ogg" },
  @{ symbol = "ɔɪ"; slug = "vowel-oi"; title = "LL-Q1860 (eng)-Arlo Barnes-oy.wav" },
  @{ symbol = "p"; slug = "consonant-p"; title = "Voiceless bilabial plosive.ogg" },
  @{ symbol = "b"; slug = "consonant-b"; title = "Voiced bilabial plosive.ogg" },
  @{ symbol = "t"; slug = "consonant-t"; title = "Voiceless alveolar plosive.ogg" },
  @{ symbol = "d"; slug = "consonant-d"; title = "Voiced alveolar plosive.ogg" },
  @{ symbol = "k"; slug = "consonant-k"; title = "Voiceless velar plosive.ogg" },
  @{ symbol = "g"; slug = "consonant-g"; title = "Voiced velar plosive.ogg" },
  @{ symbol = "f"; slug = "consonant-f"; title = "Voiceless labiodental fricative.ogg" },
  @{ symbol = "v"; slug = "consonant-v"; title = "Voiced labiodental fricative.ogg" },
  @{ symbol = "θ"; slug = "consonant-theta"; title = "Voiceless dental fricative.ogg" },
  @{ symbol = "ð"; slug = "consonant-eth"; title = "Voiced dental fricative.ogg" },
  @{ symbol = "s"; slug = "consonant-s"; title = "Voiceless alveolar sibilant.ogg" },
  @{ symbol = "z"; slug = "consonant-z"; title = "Voiced alveolar sibilant.ogg" },
  @{ symbol = "ʃ"; slug = "consonant-esh"; title = "Voiceless postalveolar fricative.ogg" },
  @{ symbol = "ʒ"; slug = "consonant-ezh"; title = "Voiced postalveolar fricative.ogg" },
  @{ symbol = "h"; slug = "consonant-h"; title = "Voiceless glottal fricative.ogg" },
  @{ symbol = "tʃ"; slug = "consonant-ch"; title = "Voiceless palato-alveolar affricate.ogg" },
  @{ symbol = "dʒ"; slug = "consonant-j"; title = "Voiced palato-alveolar affricate.ogg" },
  @{ symbol = "m"; slug = "consonant-m"; title = "Bilabial nasal.ogg" },
  @{ symbol = "n"; slug = "consonant-n"; title = "Alveolar nasal.ogg" },
  @{ symbol = "ŋ"; slug = "consonant-eng"; title = "Velar nasal.ogg" },
  @{ symbol = "l"; slug = "consonant-l"; title = "Alveolar lateral approximant.ogg" },
  @{ symbol = "r"; slug = "consonant-r"; title = "Postalveolar approximant.ogg" },
  @{ symbol = "j"; slug = "consonant-y"; title = "Palatal approximant.ogg" },
  @{ symbol = "w"; slug = "consonant-w"; title = "Voiced labio-velar approximant.ogg" }
)

New-Item -ItemType Directory -Path $audioDirectory -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path -Parent $manifestPath) -Force | Out-Null

$titles = ($assets | ForEach-Object { "File:$($_.title)" }) -join "|"
$queryUri = "${apiEndpoint}?action=query&format=json&formatversion=2&redirects=1&prop=imageinfo&iiprop=url%7Cextmetadata&titles=$([uri]::EscapeDataString($titles))"
$response = Invoke-RestMethod -Uri $queryUri -Headers $headers
$pagesByRequestedTitle = @{}

foreach ($page in $response.query.pages) {
  if ($page.missing) {
    throw "Wikimedia Commons file not found: $($page.title)"
  }
  $pagesByRequestedTitle[$page.title.Replace("File:", "")] = $page
}

foreach ($redirect in $response.query.redirects) {
  $targetTitle = $redirect.to.Replace("File:", "")
  $pagesByRequestedTitle[$redirect.from.Replace("File:", "")] = $pagesByRequestedTitle[$targetTitle]
}

$manifest = foreach ($asset in $assets) {
  $page = $pagesByRequestedTitle[$asset.title]
  if (-not $page) {
    throw "No metadata returned for: $($asset.title)"
  }

  $imageInfo = $page.imageinfo[0]
  $extension = [IO.Path]::GetExtension(([uri]$imageInfo.url).AbsolutePath)
  $fileName = "$($asset.slug)$extension"
  $destination = Join-Path $audioDirectory $fileName
  if ($Download -and -not (Test-Path -LiteralPath $destination)) {
    $downloaded = $false
    for ($attempt = 1; $attempt -le 4 -and -not $downloaded; $attempt += 1) {
      try {
        Invoke-WebRequest -Uri $imageInfo.url -Headers $headers -OutFile $destination
        $downloaded = $true
      } catch {
        if ($attempt -eq 4) {
          throw
        }
        Start-Sleep -Seconds (3 * $attempt)
      }
    }
    Start-Sleep -Milliseconds 750
  }

  $artist = ($imageInfo.extmetadata.Artist.value -replace "<[^>]+>", " " -replace "\s+", " ").Trim()
  if (-not $artist) {
    $artist = "Wikimedia Commons contributor"
  }

  [ordered]@{
    id = $asset.slug
    localPath = if ($Download) { "/audio/kk/$fileName" } else { "" }
    remoteUrl = $imageInfo.url
    sourceFile = $page.title.Replace("File:", "")
    sourcePage = $imageInfo.descriptionurl
    author = $artist
    license = $imageInfo.extmetadata.LicenseShortName.value
    licenseUrl = $imageInfo.extmetadata.LicenseUrl.value
  }
}

$json = $manifest | ConvertTo-Json -Depth 5
[IO.File]::WriteAllText($manifestPath, $json, [Text.UTF8Encoding]::new($false))

if ($Download) {
  Write-Output "Downloaded $($manifest.Count) KK phonetic audio assets."
} else {
  Write-Output "Resolved $($manifest.Count) remote KK phonetic audio assets."
}
Write-Output "Attribution manifest: $manifestPath"
