@echo off
start cmd /k "cd client && npm start"
start cmd /k "cd server && npm run dev:watch"
echo Both client and server are starting in separate windows.