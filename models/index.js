const mongoose = require('mongoose');

const {
  collections
} = require("../config");

const connections = {};

collections.map(data => {
  connections[data] = mongoose.createConnection(`mongodb+srv://admin:${process.env.MONGODB_PASSWORD}@blakio.lojxu.mongodb.net/${data}?retryWrites=true&w=majority`, { useFindAndModify: false });
  connections[data].model('Employee',        require('./Employee'));
  connections[data].model('Time',            require('./Time'));
  connections[data].model('SidebarOptions',  require('./SidebarOptions'));
  connections[data].model('Note',            require('./Note'));
  connections[data].model('Product',         require('./Product'));
  connections[data].model('Transaction',     require('./Transaction'));
  connections[data].model('Token',           require('./Token'));
});

module.exports = connections;