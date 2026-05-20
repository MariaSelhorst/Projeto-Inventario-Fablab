const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
    const { usuario, senha } = req.body;

    const hash = await bcrypt.hash(senha, 10);

    db.run(
        "INSERT INTO usuarios (usuario, senha) VALUES (?, ?)",
        [usuario, hash],
        err => {
            if (err) return res.status(400).json({ erro: "Usuário já existe" });
            res.json({ ok: true });
        }
    );
});

router.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    db.get("SELECT * FROM usuarios WHERE usuario=?", [usuario], async (err, user) => {

        if (!user) return res.status(401).json({ erro: "Usuário não encontrado" });

        const valido = await bcrypt.compare(senha, user.senha);

        if (!valido) return res.status(401).json({ erro: "Senha inválida" });

        res.json({ ok: true });
    });
});

module.exports = router;