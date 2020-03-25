const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const TimeSchema = new Schema({
    EmployeeId: Schema.Types.ObjectId,
    clockIn: Date,
    toLunch: Date,
    fromLunch: Date,
    clockOut: Date,
    vacationHrs: Number,
    paidTimeOffHrs: Number
});

const Time = mongoose.model("Time", TimeSchema);

module.exports = Time;
