@echo off
title Installation QOMET

echo.
echo  ====================================
echo        Installation de QOMET
echo  ====================================
echo.

:: ── Dossier d'installation ──────────────────────────────────────────
set "INSTALL_DIR=%LOCALAPPDATA%\QOMET"
set "APP_SRC=%~dp0QOMET-win32-x64"
set "DESKTOP=%USERPROFILE%\Desktop"
set "EXE=%INSTALL_DIR%\QOMET.exe"
set "SHORTCUT=%DESKTOP%\QOMET.lnk"

:: ── Vérifier que le dossier source existe ───────────────────────────
if not exist "%APP_SRC%\QOMET.exe" (
    echo [ERREUR] Dossier QOMET-win32-x64 introuvable.
    echo Assurez-vous qu'il est au meme endroit que ce script.
    pause
    exit /b 1
)

:: ── Copier l'application ─────────────────────────────────────────────
echo [1/3] Copie de l'application...
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"
xcopy /e /i /q "%APP_SRC%" "%INSTALL_DIR%" > nul
if errorlevel 1 (
    echo [ERREUR] Copie echouee.
    pause
    exit /b 1
)
echo       OK - %INSTALL_DIR%

:: ── Créer le raccourci bureau ────────────────────────────────────────
echo [2/3] Creation du raccourci bureau...
powershell -NoProfile -Command "$ws=New-Object -ComObject WScript.Shell;$sc=$ws.CreateShortcut('%SHORTCUT%');$sc.TargetPath='%EXE%';$sc.WorkingDirectory='%INSTALL_DIR%';$sc.Description='QOMET';$sc.Save()"
if errorlevel 1 (
    echo       AVERTISSEMENT - Raccourci non cree, lancez depuis %INSTALL_DIR%
) else (
    echo       OK - Raccourci cree sur le Bureau
)

:: ── Terminer ─────────────────────────────────────────────────────────
echo [3/3] Installation terminee !
echo.
echo  QOMET installe dans : %INSTALL_DIR%
echo  Raccourci sur le Bureau : QOMET
echo.
echo  Double-cliquez sur l'icone QOMET pour jouer !
echo.
pause
