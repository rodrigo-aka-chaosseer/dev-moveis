-- Execute após esquema.sql/migrar_cidades.sql. Não apaga dados anteriores:
-- desativa outras cidades, arquiva seus locais e carrega o piloto de Palmas.
begin;
\ir ../../supabase/seed.sql
commit;
