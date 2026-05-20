const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

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

/* ================= ADMIN PADRÃO ================= */

async function criarAdmin() {
    try {
        const senhaHash = await bcrypt.hash("admin123", 10);

        db.run(
            "INSERT OR IGNORE INTO usuarios (usuario, senha) VALUES (?, ?)",
            ["admin", senhaHash],
            (err) => {
                if (err) {
                    console.log("❌ Erro ao criar admin:", err);
                } else {
                    console.log("👑 Admin pronto: admin / admin123");
                }
            }
        );
    } catch (err) {
        console.log("❌ Erro bcrypt:", err);
    }
}

/* ================= DADOS INICIAIS ================= */

function inserirItensIniciais() {
    db.get("SELECT COUNT(*) as total FROM itens", (err, row) => {

        if (err) {
            console.log("❌ Erro ao verificar itens:", err);
            return;
        }

        if (row.total === 0) {
            console.log("📦 Inserindo itens iniciais...");

            db.run(`
                INSERT INTO itens (nome, categoria, quantidade, localizacao)
                VALUES
                ('Impressora 3D', 'Equipamento', 3, 'Lab 1'),
                ('Filamento PLA', 'Material', 20, 'Estoque A'),
                ('Filamento ABS', 'Material', 10, 'Estoque A'),
                ('Arduino Uno', 'Eletrônica', 8, 'Gaveta 2'),
                ('Raspberry Pi', 'Eletrônica', 5, 'Gaveta 3'),
                ('Multímetro', 'Ferramenta', 6, 'Bancada'),
                ('Ferro de solda', 'Ferramenta', 4, 'Bancada'),
                ('Protoboard', 'Eletrônica', 15, 'Gaveta 1'),
                ('Cabos jumper', 'Eletrônica', 50, 'Gaveta 1'),
                ('Chave de fenda', 'Ferramenta', 10, 'Armário'),
                ('Parafusos M3', 'Material', 100, 'Caixa 1'),
                ('Laser Cutter', 'Equipamento', 1, 'Lab 2'),
                ('Mouse', 'Periférico', 5, 'Lab 1'),
                ('Teclado', 'Periférico', 5, 'Lab 1'),
                ('Notebook', 'Equipamento', 4, 'Lab 1')
            `, (err) => {
                if (err) {
                    console.log("❌ Erro ao inserir itens:", err);
                } else {
                    console.log("✅ Itens iniciais inseridos!");
                }
            });

        } else {
            console.log("📦 Banco já possui itens, ignorando inserção.");
        }

    });
}


function iniciarSistema() {
    criarAdmin();
    inserirItensIniciais();
}

iniciarSistema();


app.listen(3000, () => {
    console.log("🚀 Servidor rodando em http://localhost:3000");
});