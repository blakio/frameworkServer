const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const TimeSchema = new Schema({
    employeeId: Schema.Types.ObjectId,
    isClockedIn: Schema.Types.Boolean,
    time: [{
        zoneName: String,
        timestamp: Number,
        formatted: Date,
        hasClockedIn: Boolean
    }]
});

const Time = mongoose.model("Time", TimeSchema);

module.exports = Time;
