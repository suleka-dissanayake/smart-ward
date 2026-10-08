# Running SmartWard App

1. Start MongoDB.
2. Start Backend (terminal 1): cd backend && npm install && npm run seed && npm run dev   -> http://localhost:5000/health
3. Start Frontend (terminal 2): npm install && npm run dev                                  -> http://localhost:5173
Use Node 22 and npm.

Logins: ahmed.alfarouk@smartward.health / doctor123, aisha.karimi@smartward.health / nurse123, ibrahim.hassan@smartward.health / admin123
`npm run seed:clear` (in backend) empties the database.

Make sure to disconnect mongoDB when close the application.