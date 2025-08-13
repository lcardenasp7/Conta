@echo off
echo 🔄 Reiniciando servidor para aplicar cambios...
echo.

REM Buscar y terminar procesos de Node.js que estén ejecutando server.js
echo 🛑 Deteniendo servidor actual...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 📦 Instalando dependencias nuevas...
call npm install multer@1.4.5-lts.1 pdfkit@0.15.0

echo 🚀 Iniciando servidor con nuevas funcionalidades...
echo.
echo ✅ Funcionalidades disponibles:
echo    • Generación de facturas en PDF
echo    • Carga de logo institucional  
echo    • Dashboard con categorización
echo    • Gráficos de ingresos vs gastos
echo.
echo 🌐 Servidor iniciando en http://localhost:3000
echo.

npm start