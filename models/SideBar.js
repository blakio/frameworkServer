const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SideBarSchema = new Schema({
    title: String,
    fn: String,
    data: [
        {
            type: Schema.Types.ObjectId,
            ref: "SideBarChild"
        }
    ]
});

const SideBar = mongoose.model("SideBar", SideBarSchema);

module.exports = SideBar;
