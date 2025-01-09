const express = require("express");
const uploadRoutes = require("./routes/upload");
const adminRoutes = require("./routes/admin");
const fileRoutes = require("./routes/file");
require("dotenv").config();

const app = express();
app.use(express.json());

app.use("/api", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/file", fileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
