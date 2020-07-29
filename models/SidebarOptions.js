const {
    Schema
} = require("mongoose");

const SidebarOptionsSchema = new Schema({
    title: String,
    closedIcon: String
});

module.exports = SidebarOptionsSchema;
