const mongoose = require('mongoose');
const conn = mongoose.createConnection(`mongodb+srv://admin:${process.env.MONGODB_PASSWORD}@blakio.lojxu.mongodb.net/dashboard?retryWrites=true&w=majority`);

conn.model('Employee',        require('./Employee'));
conn.model('Time',            require('./Time'));
conn.model('SidebarOptions',  require('./SidebarOptions'));
conn.model('Note',            require('./Note'));

module.exports = conn;