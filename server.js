const express = require("express");
const logger = require("morgan");
var cors = require("cors");
require('dotenv').config()

const PORT = process.env.PORT || 5000;
const app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

require("./routes")(app);

app.listen(PORT, () => console.log(`App running on port ${PORT}!`));