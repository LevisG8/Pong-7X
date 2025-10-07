param(
    [int]$Port = 8000
)

# start_server.ps1 - small static file server with MIME mapping and graceful shutdown
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File start_server.ps1 -Port 8000

Write-Output "🌐 Starting local static server on port $Port..."

# MIME map - extend as you need
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
    ".mp4"  = "video/mp4"
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
Write-Output "Press Ctrl+C to stop the server."

# Graceful shutdown on Ctrl+C
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

    # Basic request logging
    $now = (Get-Date).ToString("HH:mm:ss")
    Write-Output "[$now] $($request.HttpMethod) $($request.RawUrl) from $($request.RemoteEndPoint.Address)"

    # Normalize path and prevent traversal
    $path = $request.Url.LocalPath.TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($path)) {
        $path = "index.html"
    }

    # If URL ends with '/', serve index.html in that directory
    if ($path.EndsWith("/")) {
        $path = $path + "index.html"
    }

    # Ensure the path is safe
    $root = (Get-Location).ProviderPath
    $fullPathCandidate = Join-Path $root $path
    try {
        $fullPath = (Resolve-Path -LiteralPath $fullPathCandidate -ErrorAction Stop).ProviderPath
    } catch {
        # Not found or invalid path
        $fullPath = $null
    }

    $isFileServed = $false
    if ($fullPath -and $fullPath.StartsWith($root, [System.StringComparison]::InvariantCultureIgnoreCase)) {
        if (Test-Path $fullPath -PathType Leaf) {
            try {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
                $contentType = $mimeMap[$ext]
                if (-not $contentType) { $contentType = "application/octet-stream" }
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                # Allow local testing from other origins (optional)
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $isFileServed = $true
            } catch {
                Write-Warning "Error serving file: $_"
                $response.StatusCode = 500
                $err = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.OutputStream.Write($err, 0, $err.Length)
            }
        }
    }

    if (-not $isFileServed) {
        # 404
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
