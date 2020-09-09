const {
    Schema
} = require("mongoose");

const TokenSchema = new Schema({
    applicationId: String,
    accessTokenSecret: String,
    accessTokenOath: String,
    refreshToken: String,
});

module.exports = TokenSchema;