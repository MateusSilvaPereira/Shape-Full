# FITNESS 360 — SaaS multiacademia

Base de produto em monorepo com API NestJS, painel React/PWA, PostgreSQL, Prisma e Redis. Interface em português e identidade roxa.

## Requisitos
- Node.js 20+
- npm 10+
- Docker Desktop

## Iniciar
1. `docker compose up -d`
2. `npm install`
3. Copie `apps/api/.env.example` para `apps/api/.env`
4. `npm run db:generate`
5. `npm run db:migrate`
6. `npm run db:seed`
7. `npm run dev`

Painel: http://localhost:5173  
API: http://localhost:3000/api  
Swagger: http://localhost:3000/api/docs

## Acesso de demonstração
A seed cria uma academia e um administrador demonstrativo:
- E-mail: `admin@demo.fitness360.local`
- Senha: `Fitness360!Demo`

Altere a senha e os segredos antes de qualquer uso real.

## Módulos incluídos nesta base
- Autenticação JWT e senha com bcrypt
- Contexto multi-tenant por academia, com tenantId nos recursos
- Papéis: SUPER_ADMIN, ACADEMY_ADMIN, TRAINER, NUTRITIONIST, RECEPTIONIST, STUDENT
- Gestão inicial de academias, usuários/alunos, treinos, exercícios, planos alimentares e progresso
- Dashboard administrativo com navegação por módulos
- PWA instalável e layout responsivo
- Swagger, validação de DTOs e Prisma

## Importante — estado do produto
Este repositório é uma **base funcional de MVP**, não uma plataforma pronta para cobrança e operação comercial em produção. Antes de vender:
- implementar testes automatizados de isolamento tenant e autorização em todos os endpoints;
- configurar HTTPS, domínio, backups, monitoramento, logs e gestão segura de segredos;
- integrar gateway de pagamento, e-mail transacional e push notifications;
- revisar LGPD, contratos, retenção e exclusão de dados;
- realizar auditoria de segurança e testes de carga;
- validar fluxos clínicos/nutricionais com profissionais habilitados;
- completar CRUDs e telas de cada módulo conforme os processos reais da academia.

A API não deve ser exposta publicamente sem revisão de segurança. O seed é apenas para desenvolvimento.
