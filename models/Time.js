const {
    Schema
} = require("mongoose");

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

module.exports = TimeSchema;
