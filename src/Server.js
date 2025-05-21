const express = require("express");

const configurations = require("./config/configuration");
const ticketsRouter = require("./routes/ticketRouter");
const { connectWithRetry } = require("./database/db");

const app = express();
app.use(express.json());

const { port } = configurations;

app.use("/api/v1/tickets", ticketsRouter);

(async () => {
  try {
    await connectWithRetry();
    app.listen(port, () => console.log(`:::: Server running on port ${port}`));
  } catch (err) {
    console.error("Failed to connect to DB", err);
    process.exit(1);
  }
})();
