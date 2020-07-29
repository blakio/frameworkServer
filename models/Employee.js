const {
    Schema
} = require("mongoose");

const EmployeeSchema = new Schema({
    firstName: String,
    lastName: String,
    dob: Date,
    phone: Number,
    email: String,
    raise: String,
    gender: String,
    emergencyContact: Number,
    title: String,
    department: String,
    hireDate: Date,
    isActive: Boolean ,
    isContractor: Boolean,
    hourlyRate: Number,
    salary: Number,
    fringeBenefits: [{
        date: {
            type: Date,
            // `Date.now()` returns the current unix timestamp as a number
            default: Date.now
        },
        updatedById: Schema.Types.ObjectId,
        pto: Number,
        sick: Number,
        vacation: Number,
        personal: Number
    }],
    updatedById: Schema.Types.ObjectId
});

module.exports = EmployeeSchema;