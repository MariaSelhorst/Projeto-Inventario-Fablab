# 🔬 Sistema de Inventário FabLab

Sistema web desenvolvido para gerenciamento de estoque, empréstimos e movimentações de itens do FabLab.

## 📌 Funcionalidades

### 👤 Autenticação
- Cadastro de usuários
- Login com senha criptografada (bcrypt)
- Controle de sessão
- Exibição do usuário logado
- Logout

### 📦 Controle de Estoque
- Cadastro de itens
- Listagem dos itens
- Busca por nome
- Exclusão de itens
- Geração de QR Code
- Importação de planilhas Excel
- Exportação para Excel

### 🔄 Empréstimos
- Registro de empréstimos
- Controle de quantidade emprestada
- Devolução de itens
- Histórico permanente dos empréstimos
- Status:
  - Emprestado
  - Devolvido

### 📈 Dashboard
- Total de itens em estoque
- Itens disponíveis
- Itens emprestados
- Estoque baixo
- Gráfico de distribuição

### 📋 Movimentações
Registro completo das movimentações:

- Entrada
- Saída
- Empréstimo
- Devolução

Cada movimentação possui:

- Item
- Tipo
- Quantidade
- Usuário
- Data e hora

---

# 🛠 Tecnologias utilizadas

## Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js
- QRCode.js

## Backend
- Node.js
- Express

## Banco de Dados
- MongoDB
- Mongoose

## Bibliotecas
- bcrypt
- cors
- dotenv
- multer
- xlsx

---

# 📁 Estrutura do Projeto

```
Projeto-Inventario-Fablab
│
├── backend
│   │
│   ├── models
│   │     ├── Item.js
│   │     ├── Emprestimo.js
│   │     ├── Movimentacao.js
│   │     └── Usuario.js
│   │
│   ├── routes
│   │     ├── auth.js
│   │     ├── itens.js
│   │     ├── emprestimos.js
│   │     └── movimentacoes.js
│   │
│   ├── database.js
│   ├── server.js
│   └── .env
│
└── frontend
      ├── index.html
      ├── login.html
      ├── register.html
      ├── item.html
      ├── script.js
      └── style.css
```

---

# ⚙️ Instalação

## 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
```

Entrar na pasta:

```bash
cd Projeto-Inventario-Fablab
```

---

## 2. Instalar dependências

```bash
npm install
```

ou

```bash
npm install express mongoose cors dotenv bcrypt multer xlsx
```

---

## 3. Configurar o MongoDB

Criar um arquivo:

```text
backend/.env
```

Conteúdo:

```env
MONGO_URI=sua_string_de_conexao
```

Exemplo:

```env
MONGO_URI=mongodb://localhost:27017/fablab
```

ou

```env
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/fablab
```

---

## 4. Iniciar o servidor

Dentro da pasta backend:

```bash
node server.js
```

Servidor disponível em:

```text
http://localhost:3000
```

---

# 📊 Estrutura da Planilha de Importação

O sistema procura automaticamente pelas colunas:

| COMPONENTES | ARMÁRIOS | Categorias | QUANTIDADE |
|-------------|----------|------------|------------|
| Arduino Uno | Armário A | Eletrônica | 10 |
| Sensor Ultrassônico | Armário B | Sensores | 20 |

Também aceita nomes equivalentes, como:

- COMPONENTES
- NOME
- ITEM
- NOME DO ITEM

Para quantidade:

- QUANTIDADE
- QTD

Para localização:

- ARMÁRIOS
- ARMARIO
- LOCALIZAÇÃO
- LOCALIZACAO

---

# 🔄 Fluxo de Funcionamento

## Cadastro

```text
Usuário
↓
Frontend
↓
API Express
↓
MongoDB
```

## Empréstimo

```text
Selecionar item
↓
Informar usuário
↓
Registrar empréstimo
↓
Quantidade do estoque é reduzida
↓
Movimentação é registrada
```

## Devolução

```text
Selecionar empréstimo
↓
Devolver
↓
Estoque é atualizado
↓
Movimentação é registrada
↓
Status do empréstimo muda para "devolvido"
```

---

# 🚀 Funcionalidades Implementadas

- [x] CRUD de itens
- [x] MongoDB
- [x] Login e cadastro de usuários
- [x] Controle de sessão
- [x] Dashboard
- [x] Gráfico de estoque
- [x] Importação Excel
- [x] Exportação Excel
- [x] QR Code dos itens
- [x] Empréstimos
- [x] Devoluções
- [x] Histórico de empréstimos
- [x] Movimentações
- [x] Busca de itens
- [x] Filtro de empréstimos
- [x] Toasts e mensagens
