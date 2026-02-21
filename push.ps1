$ErrorActionPreference = "Stop"

$git = "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd\git.exe"

Set-Location -Path "D:\ml model"

Write-Host "Initializing git..."
& $git init

Write-Host "Adding files..."
& $git add .

Write-Host "Committing..."
& $git commit -m "ML model inserted"

Write-Host "Setting main branch..."
& $git branch -M main

Write-Host "Adding remote..."
try {
    & $git remote add origin https://github.com/K-HARISHWAR/Iris.git
}
catch {
    & $git remote set-url origin https://github.com/K-HARISHWAR/Iris.git
}

Write-Host "Pushing to GitHub (A browser window may open to log in)..." -ForegroundColor Green
& $git push -u origin main --force

Write-Host "Done! You can close this window." -ForegroundColor Cyan
