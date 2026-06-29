# generate_audio.ps1  (ASCII-only source for Windows PowerShell 5.1 compatibility)
# Generates one MP3 (real German voice) per phrase, then writes audio_map.js
# (German text -> MP3 file). Phrases are read from index.html (de:"..."), so no
# double data-entry. No install required (uses Google Translate TTS endpoint).
#
# INCREMENTAL: re-uses clips that already exist, only downloads new/changed
# phrases, and prunes orphan MP3s no longer used. So re-running after a small
# content edit is fast.
$ErrorActionPreference = 'Stop'
$root     = $PSScriptRoot
$htmlPath = Join-Path $root 'index.html'
$mapPath  = Join-Path $root 'audio_map.js'
$audioDir = Join-Path $root 'audio'
New-Item -ItemType Directory -Force -Path $audioDir | Out-Null

$html = Get-Content -Path $htmlPath -Raw -Encoding UTF8

# 1) Extract all unique German phrases (key de:"...", not the tail of another word)
$rx = [regex]'(?<![A-Za-z])de:"([^"]*)"'
$seen = [ordered]@{}
foreach ($m in $rx.Matches($html)) {
  $de = $m.Groups[1].Value
  if ($de.Trim().Length -gt 0 -and -not $seen.Contains($de)) { $seen[$de] = $true }
}
$phrases = @($seen.Keys)
Write-Host ("Unique German phrases in app: " + $phrases.Count) -ForegroundColor Cyan

# 2) Load existing map (German text -> audio/aXXXX.mp3) to re-use clips
$existing = @{}
$maxIdx = 0
if (Test-Path $mapPath) {
  $raw  = Get-Content $mapPath -Raw -Encoding UTF8
  $json = $raw -replace '^\s*window\.AUDIO\s*=\s*', '' -replace ';\s*$', ''
  try {
    $obj = $json | ConvertFrom-Json
    foreach ($p in $obj.PSObject.Properties) {
      $existing[$p.Name] = $p.Value
      if ($p.Value -match 'a(\d+)\.mp3') { $n = [int]$Matches[1]; if ($n -gt $maxIdx) { $maxIdx = $n } }
    }
  } catch { Write-Host "  (could not parse existing audio_map.js - regenerating all)" -ForegroundColor Yellow }
}
$next = $maxIdx + 1

function Split-Chunks([string]$text, [int]$max = 190) {
  if ($text.Length -le $max) { return ,@($text) }
  $words  = $text -split ' '
  $chunks = New-Object System.Collections.Generic.List[string]
  $cur = ''
  foreach ($w in $words) {
    if (($cur.Length + $w.Length + 1) -gt $max -and $cur.Length -gt 0) { $chunks.Add($cur); $cur = $w }
    elseif ($cur.Length -eq 0) { $cur = $w }
    else { $cur = "$cur $w" }
  }
  if ($cur.Length -gt 0) { $chunks.Add($cur) }
  return $chunks.ToArray()
}

$ua    = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
$map   = [ordered]@{}
$used  = @{}
$fail  = New-Object System.Collections.Generic.List[string]
$dl    = 0
$reuse = 0
$i     = 0

foreach ($de in $phrases) {
  $i++
  # Re-use existing clip if present and file still on disk
  if ($existing.ContainsKey($de) -and (Test-Path (Join-Path $root $existing[$de]))) {
    $map[$de] = $existing[$de]; $used[$existing[$de]] = $true; $reuse++
    continue
  }
  # New / changed phrase -> download
  $id   = 'a{0:D4}' -f $next; $next++
  $file = Join-Path $audioDir "$id.mp3"
  $chunks = Split-Chunks $de 190
  $parts  = New-Object System.Collections.Generic.List[string]
  $ok = $true
  $ci = 0
  foreach ($ch in $chunks) {
    $q   = [uri]::EscapeDataString($ch)
    $url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=de&total=$($chunks.Count)&idx=$ci&textlen=$($ch.Length)&q=$q"
    $tmp = Join-Path $audioDir ("_{0}_{1}.part" -f $id, $ci)
    & curl.exe --silent --fail --max-time 25 -A $ua -o $tmp $url
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $tmp)) { $ok = $false; break }
    $parts.Add($tmp); $ci++
    Start-Sleep -Milliseconds 350
  }
  if ($ok) {
    $fs = [System.IO.File]::Open($file, [System.IO.FileMode]::Create)
    foreach ($p in $parts) { $b = [System.IO.File]::ReadAllBytes($p); $fs.Write($b, 0, $b.Length) }
    $fs.Close()
  }
  foreach ($p in $parts) { if (Test-Path $p) { Remove-Item $p -Force } }

  if ($ok -and (Test-Path $file) -and (Get-Item $file).Length -gt 800) {
    $map[$de] = "audio/$id.mp3"; $used["audio/$id.mp3"] = $true; $dl++
    $preview = $de.Substring(0, [Math]::Min(40, $de.Length))
    Write-Host ("[{0}/{1}] NEW  {2}  {3}" -f $i, $phrases.Count, $id, $preview) -ForegroundColor Green
  } else {
    if (Test-Path $file) { Remove-Item $file -Force }
    $fail.Add($de)
    Write-Host ("[{0}/{1}] FAIL {2}" -f $i, $phrases.Count, $id) -ForegroundColor Yellow
  }
}

# 3) Prune orphan MP3s (no longer referenced by any phrase)
$pruned = 0
Get-ChildItem $audioDir -Filter *.mp3 | ForEach-Object {
  $rel = "audio/" + $_.Name
  if (-not $used.ContainsKey($rel)) { Remove-Item $_.FullName -Force; $pruned++ }
}

# 4) Write audio_map.js (UTF-8, no BOM)
$jsonOut = ($map | ConvertTo-Json -Depth 3)
if ([string]::IsNullOrWhiteSpace($jsonOut)) { $jsonOut = '{}' }
$out = "window.AUDIO = $jsonOut;`n"
[System.IO.File]::WriteAllText($mapPath, $out, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ""
Write-Host ("Done. clips total: {0}  (new: {1}, reused: {2}, pruned: {3})" -f $map.Count, $dl, $reuse, $pruned) -ForegroundColor Green
if ($fail.Count -gt 0) { Write-Host ("Failures: {0} (re-run to retry)." -f $fail.Count) -ForegroundColor Yellow }
