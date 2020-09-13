const express = require("express");
const logger = require("morgan");
const cookieParser = require('cookie-parser');
var cors = require("cors");
require('dotenv').config()

const PORT = process.env.PORT || 5000;
const app = express();
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());

const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
require("./routes")(app, io);

server.listen(PORT, () => console.log(`App running on port ${PORT}!`));