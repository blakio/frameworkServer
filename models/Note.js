const {
    Schema
} = require("mongoose");

const NoteSchema = new Schema({
    employeeId: Schema.Types.ObjectId,
    weekNumber: Number,
    year: Number,
    note: String,
});

module.exports = NoteSchema;