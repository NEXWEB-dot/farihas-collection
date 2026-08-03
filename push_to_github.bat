@echo off
echo Preparing to push your Fariha's Collection website to GitHub...
cd /d "%~dp0"

echo Configuring Git for this folder...
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/NEXWEB-dot/farihas-collection.git

echo Adding and committing files...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Update Fariha's Collection Website and Pixel Fix"

echo Pushing to GitHub (master branch)...
"C:\Program Files\Git\cmd\git.exe" branch -M master
"C:\Program Files\Git\cmd\git.exe" push -u origin master --force

echo.
echo Done! If you see any errors above, please copy and paste them so I can see what went wrong.
pause
