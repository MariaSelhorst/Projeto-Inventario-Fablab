const API = 'http://localhost:3000';

/* ===== VERIFICAÇÃO DE LOGIN ===== */

/* ===== SESSÃO ===== */
const sessao = JSON.parse(
    localStorage.getItem('sessao')
);

/* Se tentar acessar o sistema sem estar logado */
if (
    window.location.pathname.includes('index.html')
) {

    if (!sessao) {

        window.location.href =
            'login.html';

    }

}

/* Se já estiver logado, não deixa voltar para a tela de login */
if (
    window.location.pathname.includes('login.html')
) {

    if (sessao) {

        window.location.href =
            'index.html';

    }

}

/* ===== TOAST ===== */
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerText = msg;
    toast.className = 'toast show';

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function escaparHTML(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function showMessage(msg, isError = true) {
    const msgDiv = document.getElementById('mensagem');

    if (msgDiv) {
        msgDiv.innerText = msg;
        msgDiv.style.color = isError ? '#e53e3e' : '#10b981';
    }
}

/* ===== LOGIN ===== */
async function login() {
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    if (!usuario || !senha) {
        showMessage('Preencha todos os campos!');
        return;
    }

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario,
                senha
            })
        });

        const data = await res.json();

        if (res.ok) {

            localStorage.setItem(
                'sessao',
                JSON.stringify({
                    usuario: usuario
                })
            );

            window.location.href = 'index.html';

        } else {
            showMessage(data.erro || 'Usuário ou senha inválidos');
        }

    } catch (error) {
        console.error(error);
        showMessage('Erro de conexão com o servidor');
    }
}

/* ===== REGISTRO ===== */
async function register() {

    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    if (!usuario || !senha) {
        showMessage('Preencha todos os campos!');
        return;
    }

    try {

        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario,
                senha
            })
        });

        const data = await res.json();

        if (res.ok) {

            showMessage(
                'Conta criada! Redirecionando...',
                false
            );

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);

        } else {

            showMessage(
                data.erro || 'Erro ao criar conta'
            );

        }

    } catch (error) {

        console.error(error);

        showMessage(
            'Erro de conexão com o servidor'
        );

    }
}

/* ===== LOGOUT ===== */
function logout() {

    localStorage.removeItem('sessao');

    window.location.href = 'login.html';

}

/* ===== NAVEGAÇÃO ===== */
function mostrarSecao(secao) {

    document
        .querySelectorAll('.secao')
        .forEach(sec => sec.classList.remove('active'));

    document
        .querySelectorAll('.menu-item')
        .forEach(item => item.classList.remove('active'));

    document
        .getElementById(secao)
        .classList.add('active');

    const textos = {
        dashboard: 'Dashboard',
        estoque: 'Estoque',
        emprestimos: 'Empréstimos'
    };

    document
        .querySelectorAll('.menu-item')
        .forEach(item => {

            if (item.innerText.includes(textos[secao])) {
                item.classList.add('active');
            }

        });

    if (
        secao === 'dashboard' ||
        secao === 'estoque'
    ) {

        listarItens();

    }

    if (secao === 'emprestimos') {

        carregarSelectItens();
        listarEmprestimos();

    }

    if (secao === 'movimentacoes') {
        listarMovimentacoes();
    }
}

/* ===== CADASTRO DE ITENS ===== */
async function cadastrarItem() {

    const nome = document.getElementById('nome').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade = Number(
        document.getElementById('quantidade').value
    );
    const localizacao = document.getElementById('localizacao').value;

    if (
        !nome ||
        !categoria ||
        !quantidade ||
        !localizacao
    ) {

        showToast('Preencha todos os campos!');
        return;

    }

    try {

        const res = await fetch(`${API}/itens`, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                nome,
                categoria,
                quantidade,
                localizacao
            })

        });

        if (!res.ok) {

            const erro = await res.json();

            showToast(
                erro.erro || 'Erro ao cadastrar item'
            );

            return;
        }

        showToast('Item cadastrado!');

        document.getElementById('nome').value = '';
        document.getElementById('categoria').value = '';
        document.getElementById('quantidade').value = '';
        document.getElementById('localizacao').value = '';

        listarItens();

    } catch (error) {

        console.error(error);

        showToast('Erro ao cadastrar item');

    }

}

/* ===== LISTAR ITENS ===== */
async function listarItens() {

    try {

        const [resItens, resEmprestimos] = await Promise.all([
            fetch(`${API}/itens`),
            fetch(`${API}/emprestimos`)
        ]);

        const itens = await resItens.json();
        const emprestimos = resEmprestimos.ok
            ? await resEmprestimos.json()
            : [];

        const tabela =
            document.getElementById('tabela');

        if (tabela) {

            tabela.innerHTML = '';

            itens.forEach(i => {

                tabela.innerHTML += `
                <tr>
                    <td>${escaparHTML(i.nome)}</td>
                    <td>${escaparHTML(i.categoria)}</td>
                    <td>${i.quantidade}</td>
                    <td>
                        <button class="btn-small"
                            onclick="entrada('${i._id}')">
                            +
                        </button>

                        <button class="btn-small"
                            onclick="saida('${i._id}')">
                            -
                        </button>

                        <button class="btn-small"
                            onclick="mostrarQRCodeItem('${i._id}')">
                            🔳 QR
                        </button>

                        <button class="btn-small"
                            onclick="removerItem('${i._id}')">
                            🗑️
                        </button>
                    </td>
                </tr>
                `;

            });

        }

        if (document.getElementById('totalItens')) {

            let disponiveis = 0;

            itens.forEach(i => {
                disponiveis += Number(i.quantidade) || 0;
            });

            const emprestados = emprestimos
                .filter(e => e.status === 'emprestado')
                .reduce(
                    (total, e) => total + (Number(e.quantidade) || 0),
                    0
                );

            const total = disponiveis + emprestados;

            document.getElementById(
                'totalItens'
            ).innerText = total;

            document.getElementById(
                'itensDisponiveis'
            ).innerText = disponiveis;

            document.getElementById(
                'itensEmprestados'
            ).innerText = emprestados;

            document.getElementById(
                'estoqueBaixo'
            ).innerText =
                itens.filter(
                    i => i.quantidade < 5
                ).length;

            gerarGrafico(
                disponiveis,
                emprestados
            );
        }

    } catch (error) {

        console.error(error);

    }

}

/* ===== GRÁFICO ===== */
let chart;

function gerarGrafico(disponivel, emprestados) {

    const ctx =
        document.getElementById('grafico');

    if (!ctx) return;

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {

        type: 'doughnut',

        data: {

            labels: [
                'Disponível',
                'Emprestado'
            ],

            datasets: [{
                data: [
                    disponivel,
                    emprestados
                ],

                backgroundColor: [
                    '#10b981',
                    '#f59e0b'
                ]
            }]
        }
    });

}

/* ===== ENTRADA ===== */
async function entrada(id) {

    const qtd = prompt(
        'Quantidade:'
    );

    if (!qtd) return;

    await fetch(
        `${API}/movimentacoes/entrada`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                item_id: id,
                quantidade: Number(qtd)
            })
        }
    );

    showToast('Entrada registrada!');

    listarItens();

}

/* ===== SAÍDA ===== */
async function saida(id) {

    const qtd = prompt(
        'Quantidade:'
    );

    if (!qtd) return;

    await fetch(
        `${API}/movimentacoes/saida`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                item_id: id,
                quantidade: Number(qtd)
            })
        }
    );

    showToast('Saída registrada!');

    listarItens();

}
/* ===== QR CODE DOS ITENS ===== */

function montarUrlItem(id) {

    return `${window.location.origin}/item.html?id=${id}`;

}

async function mostrarQRCodeItem(id) {

    try {

        const res = await fetch(
            `${API}/itens/${id}`
        );

        const item = await res.json();

        if (!res.ok) {

            showToast(
                item.erro || 'Item não encontrado'
            );

            return;

        }

        const url = montarUrlItem(id);

        const modal =
            document.getElementById(
                'modalQRCode'
            );

        const titulo =
            document.getElementById(
                'tituloQr'
            );

        const detalhes =
            document.getElementById(
                'detalhesQr'
            );

        const qrcode =
            document.getElementById(
                'qrcode'
            );

        const link =
            document.getElementById(
                'linkQrItem'
            );

        titulo.innerText =
            `QR Code: ${item.nome}`;

        detalhes.innerText =
            `Categoria: ${item.categoria || '-'} | Localização: ${item.localizacao || '-'} | Quantidade: ${item.quantidade}`;

        link.href = url;
        link.innerText = url;

        qrcode.innerHTML = '';

        new QRCode(qrcode, {

            text: url,
            width: 220,
            height: 220

        });

        modal.classList.add('active');

    } catch (error) {

        console.error(error);

        showToast(
            'Erro ao gerar QR Code'
        );

    }

}

function fecharQRCode() {

    const modal =
        document.getElementById(
            'modalQRCode'
        );

    if (modal) {

        modal.classList.remove(
            'active'
        );

    }

}

function imprimirQRCode() {

    window.print();

}

/* ===== REMOVER ITEM ===== */

async function removerItem(id) {

    if (
        !confirm(
            'Remover este item?'
        )
    ) {
        return;
    }

    try {

        const res = await fetch(
            `${API}/itens/${id}`,
            {
                method: 'DELETE'
            }
        );

        if (!res.ok) {

            showToast(
                'Erro ao remover item'
            );

            return;

        }

        showToast(
            'Item removido!'
        );

        listarItens();

        carregarSelectItens();

    } catch (error) {

        console.error(error);

        showToast(
            'Erro ao remover item'
        );

    }

}

/* ===== IMPORTAR PLANILHA ===== */

async function importarPlanilha() {

    const input =
        document.getElementById(
            'arquivoPlanilha'
        );

    if (
        !input ||
        input.files.length === 0
    ) {

        showToast(
            'Selecione uma planilha primeiro!'
        );

        return;

    }

    const substituir = confirm(
        'Deseja substituir o estoque atual pelos dados da planilha?\n\nOK = substituir tudo\nCancelar = apenas adicionar os itens'
    );

    const formData =
        new FormData();

    formData.append(
        'planilha',
        input.files[0]
    );

    try {

        const modo =
            substituir
                ? 'substituir'
                : 'adicionar';

        const res = await fetch(
            `${API}/itens/importar?modo=${modo}`,
            {
                method: 'POST',
                body: formData
            }
        );

        const data =
            await res.json();

        if (!res.ok) {

            showToast(
                data.erro ||
                'Erro ao importar planilha'
            );

            return;

        }

        input.value = '';

        showToast(
            `${data.importados} itens importados!`
        );

        listarItens();

        carregarSelectItens();

    } catch (error) {

        console.error(error);

        showToast(
            'Erro ao importar planilha'
        );

    }

}

/* ===== EXPORTAR PLANILHA ===== */

function exportarPlanilha() {

    window.location.href =
        `${API}/itens/exportar`;

}

/* ===== BUSCA DE ITENS ===== */

function buscarItem() {

    const termo =
        document.getElementById(
            'busca'
        )
        .value
        .toLowerCase();

    const linhas =
        document.querySelectorAll(
            '#tabela tr'
        );

    linhas.forEach(linha => {

        const texto =
            linha.textContent
                .toLowerCase();

        linha.style.display =
            texto.includes(termo)
                ? ''
                : 'none';

    });

}
/* ===== EMPRÉSTIMOS ===== */

async function carregarSelectItens() {

    try {

        const res = await fetch(
            `${API}/itens`
        );

        const itens = await res.json();

        const select =
            document.getElementById(
                'itemSelect'
            );

        if (!select) return;

        select.innerHTML =
            '<option value="">Selecione...</option>';

        itens.forEach(i => {

            select.innerHTML += `
                <option value="${i._id}">
                    ${i.nome} (${i.quantidade})
                </option>
            `;

        });

    } catch (error) {

        console.error(error);

    }

}

async function criarEmprestimo() {

    const item_id =
        document.getElementById(
            'itemSelect'
        ).value;

    const usuario =
        document.getElementById(
            'usuarioEmp'
        ).value;

    const quantidade = Number(
        document.getElementById(
            'qtdEmp'
        ).value
    );

    if (
        !item_id ||
        !usuario ||
        !quantidade
    ) {

        showToast(
            'Preencha todos os campos!'
        );

        return;

    }

    try {

        const res = await fetch(
            `${API}/emprestimos`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    item_id,
                    usuario,
                    quantidade
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {

            showToast(
                data.erro ||
                'Erro ao registrar empréstimo'
            );

            return;

        }

        showToast(
            'Empréstimo registrado!'
        );

        document.getElementById(
            'usuarioEmp'
        ).value = '';

        document.getElementById(
            'qtdEmp'
        ).value = '';

        listarEmprestimos();
        listarItens();
        carregarSelectItens();

    } catch (error) {

        console.error(error);

        showToast(
            'Erro ao registrar empréstimo'
        );

    }

}

async function listarEmprestimos() {

    try {

        const res = await fetch(
            `${API}/emprestimos`
        );

        const emprestimos =
            await res.json();

        const tabela =
            document.getElementById(
                'tabelaEmprestimos'
            );

        if (!tabela) return;

        tabela.innerHTML = '';

        emprestimos.forEach(e => {

            const item = e.itemId || {};
            const itemNome = typeof item === 'object'
                ? item.nome
                : '-';
            const status = e.status || '-';
            const podeDevolver = status === 'emprestado';

            tabela.innerHTML += `
                <tr>
                    <td>${escaparHTML(itemNome || '-')}</td>
                    <td>${escaparHTML(e.usuario)}</td>
                    <td>${e.quantidade}</td>
                    <td>${escaparHTML(status)}</td>
                    <td>
                        ${podeDevolver
                            ? `<button class="btn-small" onclick="devolver('${e._id}')">Devolver</button>`
                            : '-'}
                    </td>
                </tr>
            `;

        });

    } catch (error) {

        console.error(error);

    }

}

async function devolver(id) {

    try {

        const res = await fetch(
            `${API}/emprestimos/devolver/${id}`,
            {
                method: 'POST'
            }
        );

        const data = await res.json();

        if (!res.ok) {

            showToast(
                data.erro ||
                'Erro ao devolver item'
            );

            return;

        }

        showToast(
            'Item devolvido!'
        );

        listarEmprestimos();
        listarItens();
        carregarSelectItens();

    } catch (error) {

        console.error(error);

        showToast(
            'Erro ao devolver item'
        );

    }

}

function filtrarEmprestimos() {

    const termo =
        document.getElementById(
            'filtroUsuario'
        )
        .value
        .toLowerCase();

    const linhas =
        document.querySelectorAll(
            '#tabelaEmprestimos tr'
        );

    linhas.forEach(linha => {

        const texto =
            linha.textContent
                .toLowerCase();

        linha.style.display =
            texto.includes(termo)
                ? ''
                : 'none';

    });

}

/* ===== INICIALIZAÇÃO ===== */

if (
    window.location.pathname.includes(
        'index.html'
    )
) {

    listarItens();

    carregarSelectItens();

    listarEmprestimos();

}

async function listarMovimentacoes() {

    const res = await fetch(`${API}/movimentacoes`);
    const movimentacoes = await res.json();

    const tabela =
        document.getElementById(
            'tabelaMovimentacoes'
        );

    tabela.innerHTML = '';

    movimentacoes.forEach(m => {

        tabela.innerHTML += `
            <tr>
                <td>${m.itemId?.nome || '-'}</td>
                <td>${m.tipo}</td>
                <td>${m.quantidade}</td>
                <td>${m.usuario || '-'}</td>
                <td>${new Date(m.createdAt)
                    .toLocaleString('pt-BR')}</td>
            </tr>
        `;

    });

}
if (
    sessao &&
    document.getElementById(
        'usuarioLogado'
    )
) {

    document.getElementById(
        'usuarioLogado'
    ).innerText =
        `👤 ${sessao.usuario}`;

}
