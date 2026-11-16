# Consolida — Frontend de Produção

Repositório oficial do Frontend de produção do sistema **Consolida** (Gestão Financeira Multinegócio).

---

## 🎯 Regra de Ouro do Projeto (API-First)

1. **Apenas Dados Reais**: Este projeto **NÃO contém dados simulados (mocks)**, nem `localStorage` para simular regras de negócio.
2. **Entrada Incremental de Módulos**: Cada funcionalidade nova do Frontend **só entra quando o endpoint correspondente existir e for homologado no Back End**.
3. **Referência Visual**: O protótipo visual interativo do time ([https://consolida.up.railway.app](https://consolida.up.railway.app)) permanece como o catálogo de referência de telas, componentes e design system, mas suas telas fictícias não entram neste repositório até que haja endpoints reais.

---

## 🌐 Escopo Atual Implementado

Atualmente integrado aos endpoints expostos pelo Back End (`https://consolida-api.up.railway.app`):
- `GET /`: Mensagem raiz do servidor (`{"message": "Hello World - Consolida"}`).
- `GET /actuator/health`: Monitoramento de saúde e integridade do Spring Boot Actuator (`status: UP`, grupos de liveness/readiness e medição de latência em milissegundos).

---

## ⚙️ Configuração da URL da API

O endereço da API é configurado exclusivamente via variável de ambiente, sem nenhuma URL fixa no código-fonte.

Crie ou edite o arquivo `.env`:

```env
# Produção no Railway
VITE_API_URL=https://consolida-api.up.railway.app

# Ou para desenvolvimento com backend rodando localmente na máquina:
# VITE_API_URL=http://localhost:8080
```

---

## 🐳 Executando com Docker (Porta 8020)

O projeto possui build multi-stage otimizado servido com **Nginx Alpine**:

```bash
# Subir o container em segundo plano
docker compose up -d --build

# Acessar a aplicação no navegador:
# http://localhost:8020
```

Para visualizar os logs:
```bash
docker logs -f consolida-frontend
```

Para parar o container:
```bash
docker compose down
```

---

## 🔐 Módulo de Autenticação, Sessão e Gestão de Usuários (SCRUM-12)

Implementação oficial de produção em estrita conformidade com **SCRUM-12** e **SCRUM-10**:

- **Autenticação Real**:
  - `POST /api/v1/auth/login`: e-mail e senha corporativos, alternância de visibilidade, bloqueio temporário (lockout), mensagem unificada *"E-mail ou senha incorretos"* sem enumeração de usuário.
  - Guarda de rotas protegidas (`ProtectedRoute`) com redirecionamento de usuários não autenticados preservando a rota solicitada.
- **Gerenciamento de Sessão**:
  - Interceptador HTTP para expiração de sessão (HTTP 401) com logout automático e banner informativo *"Sua sessão expirou"*.
  - Token de sessão transmitido via cabeçalho `Authorization: Bearer <token>`.
  - Zero credenciais em texto puro no frontend e zero logs de credenciais.
- **Alteração de Senha**:
  - `POST /api/v1/auth/change-password`: validação de mínimo 10 caracteres, confirmação idêntica com validação inline e regras de segurança visíveis antes do envio.
  - Fluxo mandatório para usuários com flag de senha provisória (`requiresPasswordChange`).
- **Administração de Usuários (Exclusivo Perfil ADMIN)**:
  - `GET /api/v1/users`: listagem filtrável por nome, e-mail, perfis e situação da conta.
  - `POST /api/v1/users`: cadastro com geração de senha provisória de **uso único** pela API, botão para cópia e aviso explícito de que a senha não poderá ser visualizada novamente.
  - `PATCH /api/v1/users/:id/status`: inativação e reativação com confirmação e justificativa.
  - **Proteção do Último Administrador**: bloqueio mandatório que impede a inativação do único administrador ativo do sistema.
  - **Restrição Estrita**: ausência de botão ou funcionalidade de exclusão física de usuários.
- **Resiliência e Dependência da API**:
  - Se os endpoints de autenticação ainda não estiverem implantados no ambiente Railway pelo time de backend (HTTP 404), a aplicação informa amigavelmente o status *"BLOQUEADO POR DEPENDÊNCIA DA API"*, preservando a estabilidade da interface.

---

## 💻 Executando Localmente com Node.js

**Pré-requisitos**: Node.js 20+ (recomendado v22) e npm.

```bash
# 1. Instalar as dependências
npm install --legacy-peer-deps

# 2. Executar o servidor de desenvolvimento Vite
npm run dev

# 3. Executar a checagem de tipos e lint
npm run lint

# 4. Executar os testes unitários (Vitest)
npm test

# 5. Gerar build de produção
npm run build
```

---

## 🚀 Deploy no Railway

O projeto está 100% preparado para deploy contínuo no **Railway**:
- O `Dockerfile` utiliza `nginx.conf.template` com suporte à variável dinâmica `$PORT` injetada pelo Railway.
- No Railway, basta conectar o repositório `consolida-frontend` e configurar a variável de ambiente:
  - `VITE_API_URL` = `https://consolida-api.up.railway.app`

---

## 🧪 Integração Contínua (CI)

O workflow do GitHub Actions em `.github/workflows/ci.yml` executa automaticamente a cada push na branch `main`:
1. `npm run lint` (TypeScript estrito).
2. `npm test` (Testes unitários de renderização, chamadas de API e tratamento de falhas).
3. `npm run build` (Geração dos assets de produção).

---

## 📄 Licença
Distribuído sob licença proprietária corporativa. Todos os direitos reservados.

