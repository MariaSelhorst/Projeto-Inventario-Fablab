const mongoose = require('mongoose');

const MovimentacaoSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    tipo: {
        type: String,
        enum: ['entrada', 'saida', 'emprestimo', 'devolucao'],
        required: true
    },
    quantidade: {
        type: Number,
        required: true
    },
    usuario: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Movimentacao', MovimentacaoSchema);