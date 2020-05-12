const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    uploadsAllowed: {
        type: Number
    }
})

module.exports = mongoose.model('User', usersSchema)