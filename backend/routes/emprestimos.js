const express = require('express');
const router = express.Router();

const Item = require('../models/Item');
const Emprestimo = require('../models/Emprestimo');
const Movimentacao = require('../models/Movimentacao');

router.get('/', async (req, res) => {
    try {

        const emprestimos = await Emprestimo.find()
            .populate('itemId');

        res.json(emprestimos);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: 'Erro ao buscar empréstimos'
        });

    }
});

router.post('/', async (req, res) => {

    try {

        const { item_id, usuario, quantidade } = req.body;

        const item = await Item.findById(item_id);

        if (!item) {
            return res.status(404).json({
                erro: 'Item não encontrado'
            });
        }

        if (quantidade > item.quantidade) {
            return res.status(400).json({
                erro: 'Sem estoque'
            });
        }

        item.quantidade -= quantidade;

        await item.save();

        const emprestimo = await Emprestimo.create({
            itemId: item_id,
            usuario,
            quantidade,
            status: 'emprestado'
        });

        await Movimentacao.create({
            itemId: item_id,
            tipo: 'emprestimo',
            quantidade,
            usuario
        });

        res.json({
            ok: true,
            emprestimo
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: 'Erro ao registrar empréstimo'
        });

    }
});

router.post('/devolver/:id', async (req, res) => {

    try {

        const emprestimo = await Emprestimo.findById(
            req.params.id
        );

        if (!emprestimo) {
            return res.status(404).json({
                erro: 'Empréstimo não encontrado'
            });
        }

        if (emprestimo.status === 'devolvido') {
            return res.status(400).json({
                erro: 'Item já devolvido'
            });
        }

        const item = await Item.findById(
            emprestimo.itemId
        );

        item.quantidade += emprestimo.quantidade;

        await item.save();

        emprestimo.status = 'devolvido';

        await emprestimo.save();

        await Movimentacao.create({
            itemId: item._id,
            tipo: 'devolucao',
            quantidade: emprestimo.quantidade,
            usuario: emprestimo.usuario
        });

        res.json({
            ok: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: 'Erro ao devolver item'
        });

    }
});

module.exports = router;