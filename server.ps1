# Kleiner lokaler Webserver zum Testen der App auf diesem PC.
# Start:  powershell -ExecutionPolicy Bypass -File server.ps1
# Dann im Browser öffnen: http://localhost:8080/
# Beenden: Strg+C oder Fenster schließen.
# (Eine PWA braucht einen Webserver – per Doppelklick auf index.html
#  funktioniert der Offline-Modus nicht.)

param([int]$Port = 8080)

$root = $PSScriptRoot
$typen = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Fahrzeugakte läuft auf http://localhost:$Port/"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $pfad = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($pfad -eq '') { $pfad = 'index.html' }
    $datei = [System.IO.Path]::GetFullPath((Join-Path $root $pfad))
    $antwort = $ctx.Response
    # Nur Dateien aus dem Projektordner ausliefern, nichts aus dem Ordner "privat"
    if ($datei.StartsWith($root) -and -not $datei.StartsWith((Join-Path $root 'privat')) -and (Test-Path $datei -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($datei)
      $endung = [System.IO.Path]::GetExtension($datei).ToLower()
      $antwort.ContentType = if ($typen.ContainsKey($endung)) { $typen[$endung] } else { 'application/octet-stream' }
      $antwort.Headers.Add('Cache-Control', 'no-cache')
      $antwort.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $antwort.StatusCode = 404
    }
    $antwort.Close()
  }
} finally {
  $listener.Stop()
}
