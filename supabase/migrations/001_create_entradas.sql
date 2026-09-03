create table if not exists public.entradas (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  nome text not null
    check (
      char_length(btrim(nome)) between 2 and 60
      and nome !~ '[[:cntrl:]]'
    ),
  filial text not null
    check (
      filial in (
        'Vitória',
        'Campo Grande — Cariacica',
        'Laranjeiras 1 — Serra',
        'Laranjeiras 2 — Serra',
        'Muquiçaba — Guarapari',
        'Cachoeiro de Itapemirim',
        'Marataízes',
        'Linhares',
        'Aracruz',
        'Colatina',
        'São Mateus',
        'Porto Seguro',
        'Teixeira de Freitas',
        'Vitória da Conquista',
        'Eunápolis',
        'Itabuna',
        'Jequié',
        'Campos dos Goytacazes'
      )
    )
);

create index if not exists entradas_criado_em_idx
  on public.entradas (criado_em desc);

alter table public.entradas enable row level security;

revoke all on table public.entradas from anon, authenticated;
grant select, insert on table public.entradas to service_role;
grant usage, select on sequence public.entradas_id_seq to service_role;

comment on table public.entradas is
  'Identificações registradas antes do simulador de premiação.';
