const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/entrada', (req, res) => {
    const { item_id, quantidade } = req.body;

    db.get("SELECT * FROM itens WHERE id=?", [item_id], (err, item) => {
        db.run("UPDATE itens SET quantidade=? WHERE id=?", [item.quantidade + quantidade, item_id]);
        res.json({ ok: true });
    });
});

router.post('/saida', (req, res) => {
    const { item_id, quantidade } = req.body;

    db.get("SELECT * FROM itens WHERE id=?", [item_id], (err, item) => {

        if (quantidade > item.quantidade)
            return res.status(400).json({ erro: "Estoque insuficiente" });

        db.run("UPDATE itens SET quantidade=? WHERE id=?", [item.quantidade - quantidade, item_id]);
        res.json({ ok: true });
    });
});

module.exports = router;