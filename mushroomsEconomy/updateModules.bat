@echo off

cd client
call npm install
cd ..

cd server
call npm install
cd ..

start cmd /k "cd client && npm start"
start cmd /k "cd server && node app.js"