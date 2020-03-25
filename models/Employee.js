const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const EmployeeSchema = new Schema({
    firstName: String,
    lastName: String,
    dob: Date,
    jobTitle: String
});

const Employee = mongoose.model("Employee", EmployeeSchema);

module.exports = Employee;