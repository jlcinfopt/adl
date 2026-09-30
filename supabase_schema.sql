-- ==============================================================================
-- SCHEMA SUPABASE - AD LEIRIA (MINISTÉRIO INTEGRARTE)
-- Copie e cole este script completo no "SQL Editor" do seu painel Supabase
-- e clique em "Run" (Executar).
-- ==============================================================================

-- 1. TABELA DE FICHAS DE REGISTO E ACOLHIMENTO
CREATE TABLE IF NOT EXISTS public.records (
  id TEXT PRIMARY KEY,
  nome TEXT,
  sobrenome TEXT,
  telemovel TEXT,
  email TEXT,
  decision_type TEXT,
  data_registo TEXT,
  celebracao TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABELA DE VERSÍCULOS BÍBLICOS
CREATE TABLE IF NOT EXISTS public.verses (
  id TEXT PRIMARY KEY,
  referencia TEXT,
  categoria TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABELA DE AGENDAMENTOS DE ENVIO
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,
  titulo TEXT,
  data_programada TEXT,
  status TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABELA DE HISTÓRICO DE MENSAGENS ENVIADAS
CREATE TABLE IF NOT EXISTS public.logs (
  id TEXT PRIMARY KEY,
  tipo TEXT,
  destinatario_nome TEXT,
  destinatario_contacto TEXT,
  data_envio TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABELA DE UTILIZADORES / PASTORES AUTORIZADOS
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT,
  role TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- HABILITAR ROW LEVEL SECURITY (RLS) COM POLÍTICAS DE ACESSO PÚBLICO / ANON
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura e Escrita para a chave anon (aplicação web)
DO $$
BEGIN
  -- Records
  DROP POLICY IF EXISTS "Acesso completo a records" ON public.records;
  CREATE POLICY "Acesso completo a records" ON public.records FOR ALL USING (true) WITH CHECK (true);

  -- Verses
  DROP POLICY IF EXISTS "Acesso completo a verses" ON public.verses;
  CREATE POLICY "Acesso completo a verses" ON public.verses FOR ALL USING (true) WITH CHECK (true);

  -- Schedules
  DROP POLICY IF EXISTS "Acesso completo a schedules" ON public.schedules;
  CREATE POLICY "Acesso completo a schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);

  -- Logs
  DROP POLICY IF EXISTS "Acesso completo a logs" ON public.logs;
  CREATE POLICY "Acesso completo a logs" ON public.logs FOR ALL USING (true) WITH CHECK (true);

  -- Users
  DROP POLICY IF EXISTS "Acesso completo a users" ON public.users;
  CREATE POLICY "Acesso completo a users" ON public.users FOR ALL USING (true) WITH CHECK (true);
END $$;

-- HABILITAR SUPABASE REALTIME (para sincronização instantânea entre múltiplos dispositivos)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.records;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.verses;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
