const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SideBarChildSchema = new Schema({
    title: String,
    icons: Array,
    types: Array,
    fn: String,
    clickType: String,
    data: [
        {
            type: Schema.Types.ObjectId,
            ref: "SideBarGrandChild"
        }
    ]
});

const SideBarChild = mongoose.model("SideBarChild", SideBarChildSchema);

module.exports = SideBarChild;
