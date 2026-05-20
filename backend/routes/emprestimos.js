const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
    db.all("SELECT * FROM emprestimos", [], (err, rows) => res.json(rows));
});

router.post('/', (req, res) => {
    const { item_id, usuario, quantidade } = req.body;

    db.get("SELECT * FROM itens WHERE id=?", [item_id], (err, item) => {

        if (quantidade > item.quantidade)
            return res.status(400).json({ erro: "Sem estoque" });

        db.run("INSERT INTO emprestimos (item_id, usuario, quantidade, status) VALUES (?, ?, ?, 'emprestado')",
            [item_id, usuario, quantidade]);

        db.run("UPDATE itens SET quantidade=? WHERE id=?", [item.quantidade - quantidade, item_id]);

        res.json({ ok: true });
    });
});

router.post('/devolver/:id', (req, res) => {

    db.get("SELECT * FROM emprestimos WHERE id=?", [req.params.id], (err, emp) => {

        db.run("UPDATE emprestimos SET status='devolvido' WHERE id=?", [req.params.id]);

        db.get("SELECT * FROM itens WHERE id=?", [emp.item_id], (err, item) => {
            db.run("UPDATE itens SET quantidade=? WHERE id=?", [item.quantidade + emp.quantidade, emp.item_id]);
        });

        res.json({ ok: true });
    });
});

module.exports = router;