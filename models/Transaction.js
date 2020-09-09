const {
    Schema
} = require("mongoose");

const TransactionSchema = new Schema({
    orderId: Schema.Types.String,
    items: [{
        name: String,
        cost: Number,
        hasRefunded: Boolean
    }]
});

module.exports = TransactionSchema;
