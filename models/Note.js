const mongoose = require("mongoose");

const { Schema } = mongoose;

const NoteSchema = new Schema({
    employeeId: Schema.Types.ObjectId,
    weekNumber: Number,
    year: Number,
    note: String,
});

const Note = mongoose.model("Note", NoteSchema);

module.exports = Note;