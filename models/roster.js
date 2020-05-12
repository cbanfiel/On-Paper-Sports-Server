const mongoose = require('mongoose');

const rosterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    game: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    sliderType:{
        type: String
    },
    downloads: {
        type: Number
    },
    updates: {
        type: Number
    },
    data: {
        type: Object,
        required: true
    }
})

module.exports = mongoose.model('Roster', rosterSchema)