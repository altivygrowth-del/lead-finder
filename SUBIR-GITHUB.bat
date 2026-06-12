@echo off
echo ============================================
echo  Lead Finder - Subindo para o GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [1/5] Removendo git antigo (se existir)...
if exist ".git" rmdir /s /q ".git"

echo [2/5] Iniciando novo repositorio git...
git init
git branch -M main

echo [3/5] Adicionando arquivos...
git add .

echo [4/5] Fazendo commit...
git commit -m "primeiro commit - Lead Finder com backend seguro"

echo [5/5] Subindo para o GitHub...
git remote add origin https://github.com/altivygrowth-8222/lead-finder.git
git push -u origin main

echo.
echo ============================================
echo  PRONTO! Projeto enviado para o GitHub.
echo  Agora va no Vercel e conecte o repositorio.
echo ============================================
echo.
pause
