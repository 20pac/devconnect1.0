const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();
//Connect to Database
connectDB();
//Middleware
app.use(express.json({ extended: false }));
app.use(cors());
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/posts", require("./routes/api/post"));
app.use("/api/profile", require("./routes/api/profile"));

app.get("/", (req, res) => {
  res.send("Kya be chutiye");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});
