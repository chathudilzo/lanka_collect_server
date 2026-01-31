require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/users", require("./src/routes/userRoutes"));

app.use("/api/customers", require("./src/routes/customerRoutes"));

app.use("/api/loans", require("./src/routes/loanRoutes"));

app.use("/api/collect", require("./src/routes/receiptRoutes"));
app.use("/api/org", require("./src/routes/orgRoutes"));
app.use("/api/dashboard", require("./src/routes/dashBoardRouts"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Lanka Collect Server running on http://localhost:${PORT}`);
});
