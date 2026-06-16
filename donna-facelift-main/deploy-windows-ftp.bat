@echo off
echo 🚀 DONNA MVP - Windows FTP Deployment
echo =====================================
echo.
echo This will create an FTP script file for manual execution
echo.
echo Creating FTP command file...

(
echo open ftp.bemdonna.com
echo derek@bemdonna.com
echo Thecone4peace!
echo binary
echo cd public_html
echo mkdir donna
echo cd donna
echo mkdir api
echo mkdir vendor
echo mkdir data
echo cd data
echo mkdir chat_sessions
echo mkdir memory
echo mkdir rate
echo cd ..
echo mkdir logs
echo prompt
echo mput api\*
echo cd vendor
echo mput ..\vendor\*
echo cd ..
echo put bootstrap_env.php
echo put composer.json
echo put composer.lock
echo quit
) > ftp_commands.txt

echo.
echo ✅ FTP command file created: ftp_commands.txt
echo.
echo To upload, run: ftp -s:ftp_commands.txt
echo.
echo ⚠️  IMPORTANT: You still need to manually upload .env to /home/username/.env
echo ⚠️  This should be OUTSIDE public_html for security!
echo.
echo After upload, test: https://bemdonna.com/donna/api/health.php
echo.
pause
