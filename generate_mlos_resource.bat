@echo off
setlocal enabledelayedexpansion

set "SERVER_TOML=server.toml"
set "TMP_TOML=server_tmp.toml"

if not exist "%SERVER_TOML%" (
    echo Fehler: %SERVER_TOML% wurde nicht gefunden!
    pause
    exit /b
)

if exist "%TMP_TOML%" del "%TMP_TOML%"

:: Alle mlos-Ordner in einer Liste sammeln
set "MLIST="
if exist "mlos" (
    for /f "delims=" %%M in ('dir /b /ad "mlos" 2^>nul') do (
        set "MLIST=!MLIST!%%M;"
    )
)

:: In ein Array umwandeln
set i=0
for %%X in (!MLIST!) do (
    set /a i+=1
    set "MLIST[!i!]=%%X"
)
set /a COUNT=i

:: server.toml Zeile für Zeile einlesen
for /f "usebackq delims=" %%L in ("%SERVER_TOML%") do (
    set "LINE=%%L"

    echo !LINE! | findstr /b /c:"resources = [" >nul
    if !errorlevel! == 0 (
        :: resources-Block ersetzen
        echo resources = [ >> "%TMP_TOML%"

        :: mlos-Ordner eintragen, letztes Element ohne Komma
        for /l %%i in (1,1,%COUNT%) do (
            set "ITEM=!MLIST[%%i]!"
            if %%i EQU %COUNT% (
                echo     "mlos/!ITEM!" >> "%TMP_TOML%"
            ) else (
                echo     "mlos/!ITEM!", >> "%TMP_TOML%"
            )
        )

        echo ] >> "%TMP_TOML%"
        goto :skipline
    )

    :: Andere Zeilen unverändert übernehmen
    echo !LINE! >> "%TMP_TOML%"
    :skipline
)

:: Original ersetzen
move /y "%TMP_TOML%" "%SERVER_TOML%" >nul

echo server.toml erfolgreich aktualisiert mit allen mlos-Ordnern.
pause
