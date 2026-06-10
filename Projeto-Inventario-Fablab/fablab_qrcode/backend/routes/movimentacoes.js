const express = require('express');
const router = express.Router();

const Item = require('../models/Item');
const Movimentacao = require('../models/Movimentacao');

router.post('/entrada', async (req, res) => {

    try {

        const { item_id, quantidade } = req.body;

        const item = await Item.findById(item_id);

        if (!item) {
            return res.status(404).json({
                erro: 'Item não encontrado'
            });
        }

        item.quantidade += Number(quantidade);

        await item.save();

        await Movimentacao.create({
            itemId: item._id,
            tipo: 'entrada',
            quantidade
        });

        res.json({
            ok: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: 'Erro ao registrar entrada'
        });

    }
});

router.post('/saida', async (req, res) => {

    try {

        const { item_id, quantidade } = req.body;

        const item = await Item.findById(item_id);

        if (!item) {
            return res.status(404).json({
                erro: 'Item não encontrado'
            });
        }

        if (Number(quantidade) > item.quantidade) {
            return res.status(400).json({
                erro: 'Estoque insuficiente'
            });
        }

        item.quantidade -= Number(quantidade);

        await item.save();

        await Movimentacao.create({
            itemId: item._id,
            tipo: 'saida',
            quantidade
        });

        res.json({
            ok: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: 'Erro ao registrar saída'
        });

    }
});

router.get('/', async (req, res) => {

    try {

        const movimentacoes = await Movimentacao.find()
            .populate('itemId')
            .sort({ createdAt: -1 });

        res.json(movimentacoes);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: 'Erro ao listar movimentações'
        });

    }
});

module.exports = router;