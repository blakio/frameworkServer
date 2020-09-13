const express = require("express");
const logger = require("morgan");
var cors = require("cors");
require('dotenv').config()

const PORT = process.env.PORT || 5000;
const app = express();

// const server = require('http').createServer(app);
// const options = { /* ... */ };
// const io = require('socket.io')(server, options);
// io.on('connection', socket => {
// });

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
require("./routes")(app, socket);

app.listen(PORT, () => console.log(`App running on port ${PORT}!`));
// server.listen(PORT, () => console.log(`App running on port ${PORT}!`));