const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const Usuario = require('../models/Usuario');

router.post('/register', async (req, res) => {
    try {
        const { usuario, senha } = req.body;

        const usuarioExistente = await Usuario.findOne({ usuario });

        if (usuarioExistente) {
            return res.status(400).json({
                erro: 'Usuário já existe'
            });
        }

        const hash = await bcrypt.hash(senha, 10);

        await Usuario.create({
            usuario,
            senha: hash
        });

        res.json({
            ok: true,
            usuario: user.usuario
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: 'Erro ao cadastrar usuário'
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { usuario, senha } = req.body;

        const user = await Usuario.findOne({ usuario });

        if (!user) {
            return res.status(401).json({
                erro: 'Usuário não encontrado'
            });
        }

        const valido = await bcrypt.compare(
            senha,
            user.senha
        );

        if (!valido) {
            return res.status(401).json({
                erro: 'Senha inválida'
            });
        }

        res.json({
            ok: true
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: 'Erro ao realizar login'
        });
    }
});

module.exports = router;