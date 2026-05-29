@echo off
start cmd /k "cd client && npm start"
start cmd /k "cd server && node app.js"
echo Both client and server are starting in separate windows.