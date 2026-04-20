<#
Usage (PowerShell):
$env:OPENAI_API_KEY = 'sk-...';
$env:STRIPE_SECRET_KEY = 'sk_...';
$env:STRIPE_PUBLISHABLE_KEY = 'pk_...';
$env:STRIPE_WEBHOOK_SECRET = 'whsec_...';
.\scripts\update-railway-env.ps1

This script requires the Railway CLI to be installed and you to be logged in.
It sets variables for the services: NNIT-Server-Restricted and NNIT-Scraper-Server.
#>

function Set-ServiceVar([string]$service, [string]$key, [string]$value) {
    if (-not $value) {
        Write-Host "Skipping $service:$key (no value)"
        return
    }
    Write-Host "Setting $service -> $key"
    railway variables set --service $service "$key=$value"
}

Write-Host "Updating Railway variables (requires Railway CLI and auth)..."

Set-ServiceVar -service 'NNIT-Server-Restricted' -key 'OPENAI_API_KEY' -value $env:OPENAI_API_KEY
Set-ServiceVar -service 'NNIT-Server-Restricted' -key 'STRIPE_SECRET_KEY' -value $env:STRIPE_SECRET_KEY
Set-ServiceVar -service 'NNIT-Server-Restricted' -key 'STRIPE_PUBLISHABLE_KEY' -value $env:STRIPE_PUBLISHABLE_KEY
Set-ServiceVar -service 'NNIT-Server-Restricted' -key 'STRIPE_WEBHOOK_SECRET' -value $env:STRIPE_WEBHOOK_SECRET

Set-ServiceVar -service 'NNIT-Scraper-Server' -key 'OPENAI_API_KEY' -value $env:OPENAI_API_KEY
Set-ServiceVar -service 'NNIT-Scraper-Server' -key 'STRIPE_SECRET_KEY' -value $env:STRIPE_SECRET_KEY

Write-Host 'Done. Verify variables in Railway dashboard or with `railway variables list --service <service>`'
