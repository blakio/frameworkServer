const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SidebarOptionsSchema = new Schema({
    title: String,
    closedIcon: String
});

const SidebarOptions = mongoose.model("SidebarOptions", SidebarOptionsSchema);

module.exports = SidebarOptions;
