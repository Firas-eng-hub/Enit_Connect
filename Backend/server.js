const http = require('http');
const app = require('./app');
const db = require('./db');
const { migrate } = require('./db/migrate');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

db.checkConnection()
  .then(async () => {
    console.log("Postgres connection OK.");
    await migrate();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  })
  .catch((err) => {
    console.error("Postgres connection failed:", err);
    process.exit(1);
  });
