param(
    [int]$Port = 8000
)

# start_pong_server.ps1 - small static server for Ultimate Pong project
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File start_pong_server.ps1 -Port 8000

Write-Output "🌐 Starting Ultimate Pong static server on port $Port..."

# Minimal MIME map (extend as needed)
$mimeMap = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".mjs"  = "text/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".otf"  = "font/otf"
    ".map"  = "application/octet-stream"
    ".wasm" = "application/wasm"
}

Add-Type -AssemblyName System.Net.HttpListener

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:{0}/" -f $Port
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Error "Failed to start HttpListener on $prefix. Maybe the port is in use, or run PowerShell as Administrator."
    exit 1
}

Write-Output "✅ Serving $(Get-Location) on $prefix"
Write-Output "Press Ctrl+C in this window to stop the server."

# Graceful shutdown handler
$stopping = $false
$onCancel = {
    Write-Output "`nStopping server..."
    $stopping = $true
    try { $listener.Stop() } catch {}
}
[Console]::TreatControlCAsInput = $false
$null = Register-ObjectEvent -InputObject [Console] -EventName CancelKeyPress -Action { & $onCancel }

while (-not $stopping -and $listener.IsListening) {
    try {
        $context = $listener.GetContext()
    } catch {
        break
    }
    if ($null -eq $context) { continue }

    $request = $context.Request
    $response = $context.Response

    # Log request
    $now = (Get-Date).ToString("HH:mm:ss")
    Write-Output "[$now] $($request.HttpMethod) $($request.RawUrl) from $($request.RemoteEndPoint.Address)"

    # Normalize path, prevent traversal
    $path = $request.Url.LocalPath.TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
    if ($path.EndsWith("/")) { $path += "index.html" }

    $root = (Get-Location).ProviderPath
    $fullPathCandidate = Join-Path $root $path

    try {
        $resolved = Resolve-Path -LiteralPath $fullPathCandidate -ErrorAction Stop
        $fullPath = $resolved.ProviderPath
    } catch {
        $fullPath = $null
    }

    $served = $false
    if ($fullPath -and $fullPath.StartsWith($root, [System.StringComparison]::InvariantCultureIgnoreCase)) {
        if (Test-Path $fullPath -PathType Leaf) {
            try {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
                $contentType = $mimeMap[$ext]
                if (-not $contentType) { $contentType = "application/octet-stream" }

                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                # CORS header useful for local debugging (remove in stricter environments)
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $served = $true
            } catch {
                Write-Warning "Error serving file: $_"
                $response.StatusCode = 500
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
        }
    }

    if (-not $served) {
        $response.StatusCode = 404
        $msg = "404 Not Found"
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $response.ContentType = "text/plain; charset=utf-8"
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }

    $response.OutputStream.Close()
}

# Cleanup
try { $listener.Close() } catch {}
Write-Output "Server stopped."
