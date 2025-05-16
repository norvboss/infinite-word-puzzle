# Server Start Script
Write-Host "Starting Word Game Server..." -ForegroundColor Cyan

# Check if port 3001 is already in use
function Test-PortInUse {
    $port = 3001
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    
    try {
        $listener.Start()
        $listener.Stop()
        return $false  # Port is available
    } catch {
        return $true   # Port is in use
    }
}

# Verify server directory exists
if (!(Test-Path -Path "server")) {
    Write-Host "ERROR: Server directory not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Verify server.js exists
if (!(Test-Path -Path "server\server.js")) {
    Write-Host "ERROR: server.js not found in server directory!" -ForegroundColor Red
    exit 1
}

# Check if port is in use
if (Test-PortInUse) {
    Write-Host "WARNING: Port 3001 is already in use. Server may not start properly." -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

# Create timestamp for log file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "server_log_$timestamp.txt"

# Change to server directory and start server
Write-Host "Starting server from $(Get-Location)\server" -ForegroundColor Cyan
Write-Host "Server will run on http://localhost:3001" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "Logging server output to $logFile" -ForegroundColor Magenta

# Change to the server directory
try {
    Push-Location -Path "server"
    
    # Use Start-Process to run node server.js with proper output redirection
    # Both output and error output will be captured to the log file
    Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -RedirectStandardOutput "..\$logFile" -RedirectStandardError "..\${logFile}.error"
    
    # Wait a moment to see if server starts successfully
    Start-Sleep -Seconds 2
    
    # Check if server is running by checking if port 3001 is now in use
    if (Test-PortInUse) {
        Write-Host "Server successfully started on port 3001!" -ForegroundColor Green
        Write-Host "View logs in $logFile" -ForegroundColor Cyan
        
        # Keep the script running to monitor the server
        Write-Host "Press Enter to stop the server and return to PowerShell..." -ForegroundColor Yellow
        Read-Host
        
        # Find and stop the Node.js process running the server
        $nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.js*" }
        if ($nodeProcess) {
            $nodeProcess | Stop-Process -Force
            Write-Host "Server stopped" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Server may have failed to start. Check logs in $logFile" -ForegroundColor Red
        
        # Show the last few lines of the log file
        if (Test-Path -Path "..\$logFile") {
            Write-Host "Last 10 lines of server log:" -ForegroundColor Yellow
            Get-Content -Path "..\$logFile" -Tail 10
        }
    }
} finally {
    # Return to the original directory
    Pop-Location
} 