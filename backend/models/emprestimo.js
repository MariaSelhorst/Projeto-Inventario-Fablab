const mongoose = require('mongoose');

const EmprestimoSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    usuario: {
        type: String,
        required: true
    },
    quantidade: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'emprestado'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Emprestimo', EmprestimoSchema);