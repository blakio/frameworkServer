const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
var cors = require("cors");
require('dotenv').config()

const PORT = process.env.PORT || 5000;
const app = express();

const uri = `mongodb+srv://admin:${process.env.MONGODB_PASSWORD}@blakio.lojxu.mongodb.net/dashboard?retryWrites=true&w=majority`;
mongoose.connect(uri || "mongodb://localhost/framework", { useNewUrlParser: true });

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

require("./routes")(app);

app.listen(PORT, () => console.log(`App running on port ${PORT}!`));