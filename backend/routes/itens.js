const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const router = express.Router();
const db = require('../database');

const upload = multer({ storage: multer.memoryStorage() });

function normalizarTexto(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function obterQuantidade(valor) {
    if (typeof valor === 'number') return valor;

    const texto = String(valor || '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
}

function buscarIndiceCabecalho(cabecalho, nomesPossiveis) {
    const nomesNormalizados = nomesPossiveis.map(normalizarTexto);

    return cabecalho.findIndex(coluna => {
        const colunaNormalizada = normalizarTexto(coluna);
        return nomesNormalizados.includes(colunaNormalizada);
    });
}

function prepararItensDaPlanilha(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const nomePlanilha = workbook.SheetNames[0];
    const sheet = workbook.Sheets[nomePlanilha];

    const linhas = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: ''
    });

    const indiceLinhaCabecalho = linhas.findIndex(linha => {
        const linhaNormalizada = linha.map(normalizarTexto);
        return linhaNormalizada.includes('componentes') && linhaNormalizada.includes('quantidade');
    });

    if (indiceLinhaCabecalho === -1) {
        throw new Error('Não encontrei as colunas COMPONENTES e QUANTIDADE na planilha.');
    }

    const cabecalho = linhas[indiceLinhaCabecalho];

    const idxNome = buscarIndiceCabecalho(cabecalho, ['COMPONENTES', 'NOME', 'ITEM', 'NOME DO ITEM']);
    const idxCategoria = buscarIndiceCabecalho(cabecalho, ['CATEGORIAS', 'CATEGORIA']);
    const idxQuantidade = buscarIndiceCabecalho(cabecalho, ['QUANTIDADE', 'QTD']);
    const idxLocalizacao = buscarIndiceCabecalho(cabecalho, ['ARMÁRIOS', 'ARMARIO', 'LOCALIZAÇÃO', 'LOCALIZACAO']);

    if (idxNome === -1 || idxQuantidade === -1) {
        throw new Error('A planilha precisa ter, no mínimo, as colunas COMPONENTES e QUANTIDADE.');
    }

    return linhas
        .slice(indiceLinhaCabecalho + 1)
        .map(linha => ({
            nome: String(linha[idxNome] || '').trim(),
            categoria: idxCategoria >= 0 ? String(linha[idxCategoria] || '').trim() : 'Sem categoria',
            quantidade: obterQuantidade(linha[idxQuantidade]),
            localizacao: idxLocalizacao >= 0 ? String(linha[idxLocalizacao] || '').trim() : ''
        }))
        .filter(item => item.nome && item.quantidade > 0);
}

router.get('/', (req, res) => {
    db.all('SELECT * FROM itens ORDER BY nome', [], (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao listar itens.' });
        res.json(rows);
    });
});

router.post('/', (req, res) => {
    const { nome, categoria, quantidade, localizacao } = req.body;

    db.run(
        'INSERT INTO itens (nome, categoria, quantidade, localizacao) VALUES (?, ?, ?, ?)',
        [nome, categoria, quantidade, localizacao],
        function (err) {
            if (err) return res.status(500).json({ erro: 'Erro ao cadastrar item.' });
            res.json({ id: this.lastID });
        }
    );
});

router.post('/importar', upload.single('planilha'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhuma planilha foi enviada.' });
        }

        const itens = prepararItensDaPlanilha(req.file.buffer);

        if (itens.length === 0) {
            return res.status(400).json({ erro: 'Nenhum item válido foi encontrado na planilha.' });
        }

        const modo = req.query.modo === 'adicionar' ? 'adicionar' : 'substituir';

        db.serialize(() => {
            if (modo === 'substituir') {
                db.run('DELETE FROM emprestimos');
                db.run('DELETE FROM itens');
                db.run('DELETE FROM sqlite_sequence WHERE name IN (\'itens\', \'emprestimos\')');
            }

            const stmt = db.prepare(
                'INSERT INTO itens (nome, categoria, quantidade, localizacao) VALUES (?, ?, ?, ?)'
            );

            itens.forEach(item => {
                stmt.run([item.nome, item.categoria, item.quantidade, item.localizacao]);
            });

            stmt.finalize(err => {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao salvar itens importados.' });
                }

                res.json({
                    ok: true,
                    modo,
                    importados: itens.length
                });
            });
        });
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

router.get('/exportar', (req, res) => {
    db.all('SELECT * FROM itens ORDER BY nome', [], (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao exportar itens.' });

        const dados = [
            ['COMPONENTES DOS FABLABS'],
            ['COMPONENTES', 'NÚMERO DE SÉRIE', 'ARMÁRIOS', 'Categorias', 'QUANTIDADE', 'VALOR', 'Observação'],
            ...rows.map(item => [
                item.nome,
                '',
                item.localizacao || '',
                item.categoria || '',
                item.quantidade || 0,
                '',
                ''
            ])
        ];

        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(dados);

        sheet['!cols'] = [
            { wch: 45 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 12 },
            { wch: 12 },
            { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(workbook, sheet, 'Planilha1');

        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx'
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="itens_fablab.xlsx"'
        );
        res.send(buffer);
    });
});


router.get('/:id', (req, res) => {
    db.get('SELECT * FROM itens WHERE id=?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar item.' });
        if (!row) return res.status(404).json({ erro: 'Item não encontrado.' });
        res.json(row);
    });
});

router.delete('/:id', (req, res) => {
    db.run('DELETE FROM itens WHERE id=?', [req.params.id], err => {
        if (err) return res.status(500).json({ erro: 'Erro ao remover item.' });
        res.json({ ok: true });
    });
});

module.exports = router;
