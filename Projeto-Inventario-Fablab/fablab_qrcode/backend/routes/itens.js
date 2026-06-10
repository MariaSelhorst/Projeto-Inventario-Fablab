const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const router = express.Router();

const Item = require('../models/Item');
const Emprestimo = require('../models/Emprestimo');

const upload = multer({
    storage: multer.memoryStorage()
});

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

    return Number.isFinite(numero)
        ? numero
        : 0;
}

function buscarIndiceCabecalho(
    cabecalho,
    nomesPossiveis
) {
    const nomesNormalizados =
        nomesPossiveis.map(normalizarTexto);

    return cabecalho.findIndex(coluna => {

        const colunaNormalizada =
            normalizarTexto(coluna);

        return nomesNormalizados.includes(
            colunaNormalizada
        );

    });
}

function prepararItensDaPlanilha(buffer) {

    const workbook = XLSX.read(
        buffer,
        {
            type: 'buffer'
        }
    );

    const nomePlanilha =
        workbook.SheetNames[0];

    const sheet =
        workbook.Sheets[nomePlanilha];

    const linhas =
        XLSX.utils.sheet_to_json(
            sheet,
            {
                header: 1,
                defval: ''
            }
        );

    const indiceLinhaCabecalho =
        linhas.findIndex(linha => {

            const linhaNormalizada =
                linha.map(normalizarTexto);

            return (
                linhaNormalizada.includes('componentes')
                &&
                linhaNormalizada.includes('quantidade')
            );

        });

    if (indiceLinhaCabecalho === -1) {
        throw new Error(
            'Não encontrei as colunas COMPONENTES e QUANTIDADE na planilha.'
        );
    }

    const cabecalho =
        linhas[indiceLinhaCabecalho];

    const idxNome =
        buscarIndiceCabecalho(
            cabecalho,
            [
                'COMPONENTES',
                'NOME',
                'ITEM',
                'NOME DO ITEM'
            ]
        );

    const idxCategoria =
        buscarIndiceCabecalho(
            cabecalho,
            [
                'CATEGORIAS',
                'CATEGORIA'
            ]
        );

    const idxQuantidade =
        buscarIndiceCabecalho(
            cabecalho,
            [
                'QUANTIDADE',
                'QTD'
            ]
        );

    const idxLocalizacao =
        buscarIndiceCabecalho(
            cabecalho,
            [
                'ARMÁRIOS',
                'ARMARIO',
                'LOCALIZAÇÃO',
                'LOCALIZACAO'
            ]
        );

    if (
        idxNome === -1 ||
        idxQuantidade === -1
    ) {
        throw new Error(
            'A planilha precisa ter, no mínimo, as colunas COMPONENTES e QUANTIDADE.'
        );
    }

    return linhas
        .slice(indiceLinhaCabecalho + 1)
        .map(linha => ({
            nome: String(
                linha[idxNome] || ''
            ).trim(),

            categoria:
                idxCategoria >= 0
                    ? String(
                        linha[idxCategoria] || ''
                    ).trim()
                    : 'Sem categoria',

            quantidade:
                obterQuantidade(
                    linha[idxQuantidade]
                ),

            localizacao:
                idxLocalizacao >= 0
                    ? String(
                        linha[idxLocalizacao] || ''
                    ).trim()
                    : ''
        }))
        .filter(
            item =>
                item.nome &&
                item.quantidade > 0
        );
}

/* LISTAR ITENS */

router.get('/', async (req, res) => {

    try {

        const itens =
            await Item.find()
                .sort({ nome: 1 });

        res.json(itens);

    } catch (error) {

        res.status(500).json({
            erro: 'Erro ao listar itens.'
        });

    }

});

/* EXPORTAR PLANILHA */

router.get('/exportar', async (req, res) => {

    try {

        const rows =
            await Item.find()
                .sort({ nome: 1 });

        const dados = [
            ['COMPONENTES DOS FABLABS'],
            [
                'COMPONENTES',
                'NÚMERO DE SÉRIE',
                'ARMÁRIOS',
                'Categorias',
                'QUANTIDADE',
                'VALOR',
                'Observação'
            ],
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

        const workbook =
            XLSX.utils.book_new();

        const sheet =
            XLSX.utils.aoa_to_sheet(
                dados
            );

        sheet['!cols'] = [
            { wch: 45 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 12 },
            { wch: 12 },
            { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(
            workbook,
            sheet,
            'Planilha1'
        );

        const buffer =
            XLSX.write(
                workbook,
                {
                    type: 'buffer',
                    bookType: 'xlsx'
                }
            );

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="itens_fablab.xlsx"'
        );

        res.send(buffer);

    } catch (error) {

        res.status(500).json({
            erro: 'Erro ao exportar itens.'
        });

    }

});

/* BUSCAR ITEM POR ID */

router.get('/:id', async (req, res) => {

    try {

        const item =
            await Item.findById(
                req.params.id
            );

        if (!item) {
            return res.status(404).json({
                erro: 'Item não encontrado.'
            });
        }

        res.json(item);

    } catch (error) {

        res.status(500).json({
            erro: 'Erro ao buscar item.'
        });

    }

});

/* CADASTRAR ITEM */

router.post('/', async (req, res) => {

    try {

        const {
            nome,
            categoria,
            quantidade,
            localizacao
        } = req.body;

        const item =
            await Item.create({
                nome,
                categoria,
                quantidade,
                localizacao
            });

        res.json(item);

    } catch (error) {

        res.status(500).json({
            erro: 'Erro ao cadastrar item.'
        });

    }

});

/* ATUALIZAR ITEM */

router.put('/:id', async (req, res) => {

    try {

        const item =
            await Item.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true
                }
            );

        if (!item) {
            return res.status(404).json({
                erro: 'Item não encontrado.'
            });
        }

        res.json(item);

    } catch (error) {

        res.status(500).json({
            erro: 'Erro ao atualizar item.'
        });

    }

});

/* EXCLUIR ITEM */

router.delete('/:id', async (req, res) => {

    try {

        await Item.findByIdAndDelete(
            req.params.id
        );

        res.json({
            ok: true
        });

    } catch (error) {

        res.status(500).json({
            erro: 'Erro ao remover item.'
        });

    }

});

/* IMPORTAR PLANILHA */

router.post(
    '/importar',
    upload.single('planilha'),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    erro: 'Nenhuma planilha foi enviada.'
                });
            }

            const itens =
                prepararItensDaPlanilha(
                    req.file.buffer
                );

            if (itens.length === 0) {
                return res.status(400).json({
                    erro: 'Nenhum item válido foi encontrado na planilha.'
                });
            }

            const modo =
                req.query.modo === 'adicionar'
                    ? 'adicionar'
                    : 'substituir';

            if (modo === 'substituir') {

                await Emprestimo.deleteMany({});
                await Item.deleteMany({});

            }

            await Item.insertMany(itens);

            res.json({
                ok: true,
                modo,
                importados: itens.length
            });

        } catch (error) {

            res.status(400).json({
                erro: error.message
            });

        }

    }
);

module.exports = router;