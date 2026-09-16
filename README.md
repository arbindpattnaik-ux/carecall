# CareCall

CareCall is a teacher parent follow-up app with admin and teacher dashboards, CSV student import, call summaries, and mobile PWA support.

## MySQL setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set the MySQL password.
3. Create the database and tables:

```powershell
& 'C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe' -u root -p < schema.sql
```

4. Install dependencies and start CareCall:

```powershell
npm install
npm start
```

Open `http://localhost:8000`.

The API loads users, groups, students, and call logs from MySQL. CSV uploads and call summaries are persisted through the API. If MySQL is unavailable, the browser temporarily falls back to localStorage.

For teacher phones, deploy the app behind HTTPS. Each teacher can then install it from the mobile browser using **Install app** or **Add to Home Screen**.
