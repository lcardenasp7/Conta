@echo off
echo 🔄 Reiniciando servidor con correcciones aplicadas...
echo.

echo 🛑 Deteniendo procesos de Node.js...
taskkill /f /im node.exe >nul 2>&1

echo ⏳ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo 🚀 Iniciando servidor con correcciones...
echo.
echo ✅ Las correcciones del header de facturas están aplicadas:
echo    - Nombre de institución dividido en múltiples líneas
echo    - Tamaño de fuente reducido a 9pt
echo    - Dirección específica agregada
echo    - Espaciado mejorado entre elementos
echo.
echo 💡 Crea una nueva factura para verificar las correcciones
echo.

node server.js