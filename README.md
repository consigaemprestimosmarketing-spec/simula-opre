# Simulador de Premiação Consiga

Site estático hospedado na Vercel com registros privados no Supabase.

Cada pessoa informa nome e filial antes de abrir o simulador. Nome, filial e
horário ficam na tabela `entradas`. Apenas as Functions da Vercel usam a chave
secreta do banco.

## Criar o projeto no Supabase

1. Crie um projeto gratuito em `https://supabase.com/dashboard`.
2. Abra **SQL Editor** e selecione **New query**.
3. Copie todo o conteúdo de
   `supabase/migrations/001_create_entradas.sql`.
4. Execute a consulta.
5. Em **Project Settings > API Keys**, copie:
   - a URL do projeto;
   - a chave **secret**.

Não use a chave publishable no lugar da secret. Nunca coloque a chave secret no
`index.html`, no `app.js` ou em arquivos enviados ao repositório.

## Configurar na Vercel

Importe este projeto na Vercel e crie as seguintes variáveis em
**Settings > Environment Variables**:

- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SECRET_KEY`: chave secret do Supabase.
- `ADMIN_USER`: usuário do painel; sugestão: `admin`.
- `ADMIN_PASSWORD`: senha com pelo menos 8 caracteres.
- `APP_TIMEZONE`: opcional; o padrão é `America/Sao_Paulo`.

Aplique as variáveis ao ambiente **Production** e faça um novo deploy.

## Acessar os registros

- Site: endereço principal fornecido pela Vercel.
- Painel: `https://seu-dominio.vercel.app/admin`.
- TXT: botão **Baixar arquivo TXT** dentro do painel.

O painel usa uma tela de login própria. Depois da autenticação, uma sessão
segura fica válida por 8 horas e pode ser encerrada pelo botão **Sair do
painel**. A Vercel fornece HTTPS automaticamente.

## Segurança aplicada

- A chave secret existe somente nas Functions da Vercel.
- RLS está ativado na tabela.
- Os papéis `anon` e `authenticated` não têm acesso à tabela.
- O navegador envia os dados apenas para `/api/entradas` no mesmo domínio.
- Nome e filial são validados novamente no servidor e no banco.
- O painel e o TXT exigem uma sessão administrativa válida.
- O cookie de sessão é `HttpOnly`, `SameSite=Strict` e assinado no servidor.
- Rotas administrativas não devem ser indexadas por buscadores.

## Plano gratuito

O Supabase Free comporta este volume com folga, mas não oferece backups
automáticos e pode pausar projetos com pouca atividade por sete dias. Baixe o
TXT periodicamente como cópia de segurança.

## Testar localmente

Crie um arquivo `.env.local` com as mesmas variáveis e execute:

```powershell
npx vercel dev
```

O arquivo `.env.local` está ignorado pelo Git.
