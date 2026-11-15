# Простий статичний сервер для перегляду сайту: http://localhost:8080/
param([int]$Port = 8080)
$root = Split-Path -Parent $PSScriptRoot
$types = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.json'='application/json'; '.woff2'='font/woff2' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($path -eq '') { $path = 'index.html' }
  $file = [IO.Path]::GetFullPath((Join-Path $root $path))
  if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $ext = [IO.Path]::GetExtension($file).ToLower()
    $ctx.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    # Як на хостингу: невідома адреса — статус 404 і сторінка 404.html
    $ctx.Response.StatusCode = 404
    $page = Join-Path $root '404.html'
    if (Test-Path $page -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($page)
      $ctx.Response.ContentType = $types['.html']
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  }
  $ctx.Response.Close()
}
