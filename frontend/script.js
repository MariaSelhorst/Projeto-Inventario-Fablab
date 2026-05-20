const API = 'http://localhost:3000';

/* ===== VERIFICAÇÃO DE LOGIN ===== */
if (window.location.pathname.includes('index.html')) {
    if (!localStorage.getItem('logado')) {
        window.location.href = 'login.html';
    }
}

/* ===== TOAST ===== */
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.className = 'toast show';
    setTimeout(() => toast.className = 'toast', 3000);
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('logado', 'true');
            window.location.href = 'index.html';
        } else {
            showMessage(data.erro || 'Usuário ou senha inválidos');
        }
    } catch (error) {
        showMessage('Erro de conexão com o servidor');
        console.error('Erro:', error);
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        const data = await res.json();
        
        if (res.ok) {
            showMessage('Conta criada! Redirecionando...', false);
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showMessage(data.erro || 'Erro ao criar conta');
        }
    } catch (error) {
        showMessage('Erro de conexão com o servidor');
        console.error('Erro:', error);
    }
}

/* ===== LOGOUT ===== */
function logout() {
    localStorage.removeItem('logado');
    window.location.href = 'login.html';
}

/* ===== NAVEGAÇÃO ===== */
function mostrarSecao(secao) {
    document.querySelectorAll('.secao').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    document.getElementById(secao).classList.add('active');
    
    const menuItems = document.querySelectorAll('.menu-item');
    const textos = { dashboard: 'Dashboard', estoque: 'Estoque', emprestimos: 'Empréstimos' };
    
    menuItems.forEach(item => {
        if (item.innerText.includes(textos[secao])) {
            item.classList.add('active');
        }
    });
    
    if (secao === 'dashboard' || secao === 'estoque') {
        listarItens();
    }
    if (secao === 'emprestimos') {
        carregarSelectItens();
        listarEmprestimos();
    }
}

/* ===== ITENS ===== */
async function cadastrarItem() {
    const nome = document.getElementById('nome').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade = Number(document.getElementById('quantidade').value);
    const localizacao = document.getElementById('localizacao').value;

    if (!nome || !categoria || !quantidade || !localizacao) {
        showToast('Preencha todos os campos!');
        return;
    }

    try {
        await fetch(`${API}/itens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, categoria, quantidade, localizacao })
        });

        showToast('Item cadastrado!');
        document.getElementById('nome').value = '';
        document.getElementById('categoria').value = '';
        document.getElementById('quantidade').value = '';
        document.getElementById('localizacao').value = '';
        listarItens();
    } catch (error) {
        showToast('Erro ao cadastrar item');
    }
}

async function listarItens() {
    try {
        const resItens = await fetch(`${API}/itens`);
        const itens = await resItens.json();

        const resEmp = await fetch(`${API}/emprestimos`);
        const emprestimos = await resEmp.json();

        const mapaEmp = {};
        emprestimos.forEach(e => {
            if (e.status === 'emprestado') {
                mapaEmp[e.item_id] = (mapaEmp[e.item_id] || 0) + e.quantidade;
            }
        });

        const tabela = document.getElementById('tabela');
        if (tabela) {
            tabela.innerHTML = '';
            
            itens.forEach(i => {
                const emp = mapaEmp[i.id] || 0;
                const disp = i.quantidade - emp;
                
                tabela.innerHTML += `
                    <tr>
                        <td>${escaparHTML(i.nome)}</td>
                        <td>${escaparHTML(i.categoria)}</td>
                        <td>${disp} / ${i.quantidade}</td>
                        <td>
                            <button class="btn-small" onclick="entrada(${i.id})">+</button>
                            <button class="btn-small" onclick="saida(${i.id})">-</button>
                            <button class="btn-small" onclick="mostrarQRCodeItem(${i.id})">🔳 QR</button>
                            <button class="btn-small" onclick="removerItem(${i.id})">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        }

        if (document.getElementById('totalItens')) {
            let total = 0, emprestados = 0;
            itens.forEach(i => {
                total += i.quantidade;
                emprestados += (mapaEmp[i.id] || 0);
            });
            
            document.getElementById('totalItens').innerText = total;
            document.getElementById('itensDisponiveis').innerText = total - emprestados;
            document.getElementById('itensEmprestados').innerText = emprestados;
            document.getElementById('estoqueBaixo').innerText = itens.filter(i => (i.quantidade - (mapaEmp[i.id] || 0)) < 5).length;
            
            gerarGrafico(total - emprestados, emprestados);
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

let chart;
function gerarGrafico(disponivel, emprestados) {
    const ctx = document.getElementById('grafico');
    if (!ctx) return;
    
    if (chart) chart.destroy();
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Disponível', 'Emprestado'],
            datasets: [{
                data: [disponivel, emprestados],
                backgroundColor: ['#10b981', '#f59e0b']
            }]
        }
    });
}

async function entrada(id) {
    const qtd = prompt('Quantidade:');
    if (!qtd) return;
    
    await fetch(`${API}/movimentacoes/entrada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: id, quantidade: Number(qtd) })
    });
    
    showToast('Entrada registrada!');
    listarItens();
}

async function saida(id) {
    const qtd = prompt('Quantidade:');
    if (!qtd) return;
    
    await fetch(`${API}/movimentacoes/saida`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: id, quantidade: Number(qtd) })
    });
    
    showToast('Saída registrada!');
    listarItens();
}


/* ===== QR CODE DOS ITENS ===== */
function montarUrlItem(id) {
    return `${window.location.origin}/item.html?id=${id}`;
}

async function mostrarQRCodeItem(id) {
    try {
        const res = await fetch(`${API}/itens/${id}`);
        const item = await res.json();

        if (!res.ok) {
            showToast(item.erro || 'Item não encontrado');
            return;
        }

        const url = montarUrlItem(id);
        const modal = document.getElementById('modalQRCode');
        const titulo = document.getElementById('tituloQr');
        const detalhes = document.getElementById('detalhesQr');
        const qrcode = document.getElementById('qrcode');
        const link = document.getElementById('linkQrItem');

        titulo.innerText = `QR Code: ${item.nome}`;
        detalhes.innerText = `Categoria: ${item.categoria || '-'} | Localização: ${item.localizacao || '-'} | Quantidade: ${item.quantidade}`;
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
        console.error('Erro ao gerar QR Code:', error);
        showToast('Erro ao gerar QR Code');
    }
}

function fecharQRCode() {
    const modal = document.getElementById('modalQRCode');
    if (modal) modal.classList.remove('active');
}

function imprimirQRCode() {
    window.print();
}

async function removerItem(id) {
    if (!confirm('Remover este item?')) return;
    
    await fetch(`${API}/itens/${id}`, { method: 'DELETE' });
    showToast('Item removido!');
    listarItens();
}


async function importarPlanilha() {
    const input = document.getElementById('arquivoPlanilha');

    if (!input || input.files.length === 0) {
        showToast('Selecione uma planilha primeiro!');
        return;
    }

    const substituir = confirm(
        'Deseja substituir o estoque atual pelos dados da planilha?\n\nOK = substituir tudo\nCancelar = apenas adicionar os itens'
    );

    const formData = new FormData();
    formData.append('planilha', input.files[0]);

    try {
        const modo = substituir ? 'substituir' : 'adicionar';
        const res = await fetch(`${API}/itens/importar?modo=${modo}`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.erro || 'Erro ao importar planilha');
            return;
        }

        input.value = '';
        showToast(`${data.importados} itens importados!`);
        listarItens();
        carregarSelectItens();
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão ao importar planilha');
    }
}

function exportarPlanilha() {
    window.location.href = `${API}/itens/exportar`;
}

function buscarItem() {
    const termo = document.getElementById('busca').value.toLowerCase();
    const linhas = document.querySelectorAll('#tabela tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(termo) ? '' : 'none';
    });
}

/* ===== EMPRÉSTIMOS ===== */
async function carregarSelectItens() {
    const res = await fetch(`${API}/itens`);
    const itens = await res.json();
    
    const select = document.getElementById('itemSelect');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    itens.forEach(i => {
        select.innerHTML += `<option value="${i.id}">${i.nome} (${i.quantidade})</option>`;
    });
}

async function criarEmprestimo() {
    const item_id = document.getElementById('itemSelect').value;
    const usuario = document.getElementById('usuarioEmp').value;
    const quantidade = Number(document.getElementById('qtdEmp').value);

    if (!item_id || !usuario || !quantidade) {
        showToast('Preencha todos os campos!');
        return;
    }

    await fetch(`${API}/emprestimos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id, usuario, quantidade })
    });
    
    showToast('Empréstimo registrado!');
    document.getElementById('usuarioEmp').value = '';
    document.getElementById('qtdEmp').value = '';
    listarEmprestimos();
    listarItens();
    carregarSelectItens();
}

async function listarEmprestimos() {
    const res = await fetch(`${API}/emprestimos`);
    const emprestimos = await res.json();
    
    const resItens = await fetch(`${API}/itens`);
    const itens = await resItens.json();
    
    const mapaItens = {};
    itens.forEach(i => mapaItens[i.id] = i.nome);
    
    const tabela = document.getElementById('tabelaEmprestimos');
    tabela.innerHTML = '';
    
    emprestimos.forEach(e => {
        tabela.innerHTML += `
            <tr>
                <td>${mapaItens[e.item_id]}</td>
                <td>${e.usuario}</td>
                <td>${e.quantidade}</td>
                <td>${e.status}</td>
                <td>
                    ${e.status === 'emprestado' ? 
                        `<button onclick="devolver(${e.id})">Devolver</button>` : 
                        '-'}
                </td>
            </tr>
        `;
    });
}

async function devolver(id) {
    await fetch(`${API}/emprestimos/devolver/${id}`, { method: 'POST' });
    showToast('Devolvido!');
    listarEmprestimos();
    listarItens();
}

function filtrarEmprestimos() {
    const termo = document.getElementById('filtroUsuario').value.toLowerCase();
    const linhas = document.querySelectorAll('#tabelaEmprestimos tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(termo) ? '' : 'none';
    });
}

/* ===== INICIALIZAÇÃO ===== */
if (window.location.pathname.includes('index.html')) {
    listarItens();
    carregarSelectItens();
    listarEmprestimos();
}