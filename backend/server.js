require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

/* ================= BANCO ================= */

connectDB();

/* ================= ROTAS ================= */

app.use('/auth', require('./routes/auth'));
app.use('/itens', require('./routes/itens'));
app.use('/movimentacoes', require('./routes/movimentacoes'));
app.use('/emprestimos', require('./routes/emprestimos'));

/* ================= FRONTEND ================= */

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

/* ================= SERVIDOR ================= */

app.listen(3000, () => {
    console.log('🚀 Servidor rodando em http://localhost:3000');
});