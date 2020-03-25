const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SideBarGrandChildSchema = new Schema({
    text: String,
    subText : String,
    icon: String,
    isActive: Boolean,
    types: Array,
    fn: String
});

const SideBarGrandChild = mongoose.model("SideBarGrandChild", SideBarGrandChildSchema);

module.exports = SideBarGrandChild;
