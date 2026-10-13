@echo off
title SAMS - MySQL Database Setup Utility
color 0E
echo ===============================================================================
echo     SMART AGRICULTURE MONITORING SYSTEM (SAMS) - DATABASE IMPORT WIZARD
echo ===============================================================================
echo.
echo This script initializes the MySQL database schema and sample data.
echo Target Database: smart_agriculture
echo.
set /p MYSQL_USER="Enter MySQL username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASS="Enter MySQL password: "

echo.
echo [1/2] Importing schema.sql...
mysql -u %MYSQL_USER% -p%MYSQL_PASS% < database\schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to import schema.sql. Please check credentials or MySQL PATH.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/2] Importing sample data.sql...
mysql -u %MYSQL_USER% -p%MYSQL_PASS% < database\data.sql
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to import data.sql.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===============================================================================
echo MySQL database 'smart_agriculture' created and seeded successfully!
echo You can now run 'run-backend-mysql.bat' to start the application.
echo ===============================================================================
pause
