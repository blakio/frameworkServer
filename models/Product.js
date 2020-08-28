const {
    Schema
} = require("mongoose");

const ProductSchema = new Schema({
    name: String,
    cost: Number,
});

module.exports = ProductSchema;