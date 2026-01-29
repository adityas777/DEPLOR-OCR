@echo off
echo Building the application...
call npm run build

echo Switching to gh-pages branch...
git checkout gh-pages

echo Copying build files...
xcopy /E /Y dist\* .

echo Committing changes...
git add .
git commit -m "Deploy: %date% %time%"

echo Pushing to GitHub...
git push origin gh-pages

echo Switching back to main...
git checkout main

echo Deployment complete!
echo Your app should be live at: https://adityas777.github.io/DEPLOR-OCR/
pause