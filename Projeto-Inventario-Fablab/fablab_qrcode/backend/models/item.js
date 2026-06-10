const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true
    },
    quantidade: {
        type: Number,
        default: 0
    },
    localizacao: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Item', ItemSchema);