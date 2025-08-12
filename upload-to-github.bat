@echo off
echo 🚀 SUBIENDO SISTEMA VILLAS DE SAN PABLO A GITHUB
echo ================================================

echo.
echo 📋 PASO 1: Verificando estado del repositorio local...
git status

echo.
echo 📋 PASO 2: Mostrando commits realizados...
git log --oneline -3

echo.
echo 🔗 PASO 3: Conectando con GitHub...
echo IMPORTANTE: Reemplaza 'TU-USUARIO' con tu nombre de usuario de GitHub
echo.

set /p username="Ingresa tu nombre de usuario de GitHub: "
set repo_url=https://github.com/%username%/sistema-villas-san-pablo.git

echo.
echo 🔗 Conectando con: %repo_url%
git remote add origin %repo_url%

echo.
echo 📤 PASO 4: Subiendo código a GitHub...
git branch -M main
git push -u origin main

echo.
echo ✅ COMPLETADO!
echo 🌐 Tu repositorio está disponible en: %repo_url%
echo.
pause