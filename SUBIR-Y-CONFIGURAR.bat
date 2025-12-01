@echo off
echo ================================================
echo GUIA RAPIDA DE DEPLOY
echo ================================================
echo.
echo PASOS:
echo.
echo 1. Subir codigo a GitHub:
echo    git add .
echo    git commit -m "Actualizar servidor"
echo    git push origin main
echo.
echo 2. Configurar variable en Render:
echo    - Ve a dashboard.render.com
echo    - Click en tu servicio
echo    - Click en "Environment"
echo    - Agrega: BREVO_API_KEY con tu clave
echo.
echo 3. Esperar redespliegue (2-3 min)
echo.
echo 4. Probar recuperacion de contrasena
echo.
echo IMPORTANTE: NO incluyas claves API en este archivo
echo Usa solo las variables de entorno en Render
echo.
pause
