const {
    Schema
} = require("mongoose");

const TransactionSchema = new Schema({
    paymentId: Schema.Types.String,
    items: [{
        name: String,
        cost: Number,
        hasRefunded: Boolean
    }]
});

module.exports = TransactionSchema;
