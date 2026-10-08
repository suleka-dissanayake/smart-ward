# Running SmartWard Guide

1. Start MongoDB (service, `docker run -d --name smartward-mongo -p 27017:27017 mongo:7`, or Atlas URI in backend/.env).
2. Backend (terminal 1):  cd backend && npm install && npm run seed && npm run dev   -> http://localhost:5000/health
3. Frontend (terminal 2): npm install && npm run dev                                  -> http://localhost:5173
Use Node 22 and npm.

Logins: ahmed.alfarouk@smartward.health / doctor123, aisha.karimi@smartward.health / nurse123, ibrahim.hassan@smartward.health / admin123
`npm run seed:clear` (in backend) empties the database.
