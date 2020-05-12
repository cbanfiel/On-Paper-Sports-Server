const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Request', requestSchema)