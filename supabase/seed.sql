-- Raízes — dados SINTÉTICOS para desenvolvimento e demonstração.
-- Não representam auditoria oficial de acessibilidade, condições sensoriais,
-- preços ou horários. Confirme as fontes antes de publicar em produção.
-- O script é idempotente: pode ser executado novamente com segurança.

insert into public.cidades (id, nome, uf, latitude, longitude, ativa) values
  ('salvador', 'Salvador', 'BA', -12.9714, -38.5014, true),
  ('recife', 'Recife', 'PE', -8.0476, -34.8770, true)
on conflict (id) do update set
  nome = excluded.nome, uf = excluded.uf, latitude = excluded.latitude,
  longitude = excluded.longitude, ativa = excluded.ativa;

insert into public.locais (
  id, cidade_id, nome, categoria, latitude, longitude, endereco, horarios,
  gratuito, preco_centavos, tempo_medio_min, por_que_conhecer, historia,
  aviso_visitacao, fonte, atualizado_em, arquivado_em
) values
  ('10000000-0000-4000-8000-000000000001', 'salvador', 'Casa do Carnaval da Bahia', 'cultura', -12.9724, -38.5090,
   'Praça Ramos de Queirós, s/n, Pelourinho, Salvador - BA', '{"terca":{"abre":"10:00","fecha":"18:00"},"quarta":{"abre":"10:00","fecha":"18:00"},"quinta":{"abre":"10:00","fecha":"18:00"},"sexta":{"abre":"10:00","fecha":"18:00"},"sabado":{"abre":"10:00","fecha":"18:00"},"domingo":{"abre":"10:00","fecha":"18:00"}}',
   false, 2000, 90, 'Apresenta o Carnaval baiano como memória coletiva, linguagem artística e força de transformação social.',
   'Museu no Centro Histórico com acervo e experiências sobre ritmos, personagens e transformações do Carnaval da Bahia.', null,
   'https://www.salvadordabahia.com/experiencias/casa-do-carnaval/', now(), null),
  ('10000000-0000-4000-8000-000000000002', 'salvador', 'Casa do Rio Vermelho', 'historia', -13.0160, -38.4871,
   'Rua Alagoinhas, 33, Rio Vermelho, Salvador - BA', '{"terca":{"abre":"09:00","fecha":"17:00"},"quarta":{"abre":"09:00","fecha":"17:00"},"quinta":{"abre":"09:00","fecha":"17:00"},"sexta":{"abre":"09:00","fecha":"17:00"},"sabado":{"abre":"09:00","fecha":"17:00"},"domingo":{"abre":"09:00","fecha":"17:00"}}',
   false, 2000, 90, 'A residência aproxima literatura, memória urbana e vida cotidiana ao preservar a trajetória de Jorge Amado e Zélia Gattai.',
   'A casa onde o casal viveu por décadas tornou-se memorial com objetos, cartas, biblioteca, obras de arte e jardim.',
   'Preserve os ambientes da antiga residência e siga as orientações da equipe.',
   'https://www.salvadordabahia.com/experiencias/casa-do-rio-vermelho/', now(), null),
  ('10000000-0000-4000-8000-000000000003', 'salvador', 'Casa do Benin', 'arte', -12.9705, -38.5067,
   'Baixa dos Sapateiros, 7, Pelourinho, Salvador - BA', '{"terca":{"abre":"10:00","fecha":"17:00"},"quarta":{"abre":"10:00","fecha":"17:00"},"quinta":{"abre":"10:00","fecha":"17:00"},"sexta":{"abre":"10:00","fecha":"17:00"},"sabado":{"abre":"09:00","fecha":"16:00"}}',
   true, 0, 60, 'Materializa conexões históricas entre a Bahia, o Golfo do Benin e a diáspora africana.',
   'Inaugurada em 1988, reúne peças coletadas por Pierre Verger e espaços projetados por Lina Bo Bardi.',
   'Fotografe obras e objetos religiosos apenas onde a equipe autorizar.',
   'https://www.salvadordabahia.com/experiencias/casa-do-benin/', now(), null),
  ('10000000-0000-4000-8000-000000000004', 'salvador', 'Museu Afro-Brasileiro da UFBA', 'historia', -12.9725, -38.5092,
   'Largo Terreiro de Jesus, s/n, Pelourinho, Salvador - BA', '{"segunda":{"abre":"09:00","fecha":"17:00"},"terca":{"abre":"09:00","fecha":"17:00"},"quarta":{"abre":"09:00","fecha":"17:00"},"quinta":{"abre":"09:00","fecha":"17:00"},"sexta":{"abre":"09:00","fecha":"17:00"}}',
   false, 1000, 75, 'Dedica-se às culturas africanas e à presença dessas matrizes na formação do Brasil.',
   'Ocupa o edifício da antiga Faculdade de Medicina e guarda objetos africanos, peças afro-brasileiras e painéis de Carybé.',
   'Observe as orientações sobre fotografia e o tratamento respeitoso das peças religiosas.',
   'https://www.salvadordabahia.com/experiencias/mafro-museu-afro-brasileiro-da-ufba/', now(), null),
  ('10000000-0000-4000-8000-000000000005', 'recife', 'Paço do Frevo', 'musica', -8.0612, -34.8712,
   'Praça do Arsenal da Marinha, s/n, Bairro do Recife, Recife - PE', '{"terca":{"abre":"10:00","fecha":"17:00"},"quarta":{"abre":"10:00","fecha":"17:00"},"quinta":{"abre":"10:00","fecha":"17:00"},"sexta":{"abre":"10:00","fecha":"17:00"},"sabado":{"abre":"11:00","fecha":"18:00"},"domingo":{"abre":"11:00","fecha":"18:00"}}',
   false, 1000, 90, 'Une documentação, formação, dança e música para manter vivo o frevo.',
   'Centro cultural em edifício histórico com exposições, oficinas, pesquisa e apresentações dedicadas ao frevo.', null,
   'https://www2.recife.pe.gov.br/servico/paco-do-frevo?op=MTMy', now(), null),
  ('10000000-0000-4000-8000-000000000006', 'recife', 'Cais do Sertão', 'cultura', -8.0637, -34.8718,
   'Armazém 10, Avenida Alfredo Lisboa, s/n, Recife - PE', '{"terca":{"abre":"10:00","fecha":"16:00"},"quarta":{"abre":"10:00","fecha":"16:00"},"quinta":{"abre":"10:00","fecha":"16:00"},"sexta":{"abre":"10:00","fecha":"16:00"},"sabado":{"abre":"13:00","fecha":"18:00"},"domingo":{"abre":"13:00","fecha":"18:00"}}',
   false, 1200, 90, 'Conecta litoral e interior por uma experiência sensorial sobre paisagens, trabalho, religiosidade e música.',
   'Instalado em antigo armazém portuário, usa instalações audiovisuais e tem a obra de Luiz Gonzaga como eixo.', null,
   'https://visit.recife.pe.gov.br/lugar/cais-do-sertao/', now(), null),
  ('10000000-0000-4000-8000-000000000007', 'recife', 'Casa da Cultura de Pernambuco', 'patrimonio', -8.0677, -34.8844,
   'Rua Floriano Peixoto, s/n, São José, Recife - PE', '{"segunda":{"abre":"09:00","fecha":"17:00"},"terca":{"abre":"09:00","fecha":"17:00"},"quarta":{"abre":"09:00","fecha":"17:00"},"quinta":{"abre":"09:00","fecha":"17:00"},"sexta":{"abre":"09:00","fecha":"17:00"},"sabado":{"abre":"09:00","fecha":"17:00"},"domingo":{"abre":"09:00","fecha":"14:00"}}',
   true, 0, 75, 'Transforma um antigo espaço de confinamento em centro de artesanato, memória e produção cultural.',
   'O prédio do século XIX abrigou a Casa de Detenção; as antigas celas hoje recebem lojas e ateliês.', null,
   'https://visit.recife.pe.gov.br/lugar/casa-da-cultura-de-pernambuco/', now(), null),
  ('10000000-0000-4000-8000-000000000008', 'recife', 'Museu da Cidade do Recife', 'historia', -8.0728, -34.8801,
   'Praça das Cinco Pontas, s/n, São José, Recife - PE', '{"terca":{"abre":"10:00","fecha":"17:00"},"quarta":{"abre":"10:00","fecha":"17:00"},"quinta":{"abre":"10:00","fecha":"17:00"},"sexta":{"abre":"10:00","fecha":"17:00"},"sabado":{"abre":"10:00","fecha":"17:00"},"domingo":{"abre":"10:00","fecha":"17:00"}}',
   true, 0, 60, 'Apresenta a história urbana do Recife dentro do Forte das Cinco Pontas.',
   'O museu preserva acervo iconográfico, cartográfico e arqueológico sobre a formação e as transformações da cidade.', null,
   'https://museudacidadedorecife.org/', now(), null)
on conflict (id) do update set
  cidade_id = excluded.cidade_id, nome = excluded.nome, categoria = excluded.categoria,
  latitude = excluded.latitude, longitude = excluded.longitude, endereco = excluded.endereco,
  horarios = excluded.horarios, gratuito = excluded.gratuito,
  preco_centavos = excluded.preco_centavos, tempo_medio_min = excluded.tempo_medio_min,
  por_que_conhecer = excluded.por_que_conhecer, historia = excluded.historia,
  aviso_visitacao = excluded.aviso_visitacao, fonte = excluded.fonte,
  atualizado_em = excluded.atualizado_em, arquivado_em = null;

insert into public.tags_diversidade (id, nome, dimensao) values
  ('afro-brasileira', 'Afro-brasileira', 'afro_brasileira'),
  ('memoria', 'Memória', 'geracional'),
  ('religiosa', 'Religiosa', 'religiosa'),
  ('acessivel', 'Acessibilidade', 'acessibilidade'),
  ('neurodiversidade', 'Neurodiversidade', 'neurodiversidade')
on conflict (id) do update set nome = excluded.nome, dimensao = excluded.dimensao;

insert into public.locais_tags (local_id, tag_id) values
  ('10000000-0000-4000-8000-000000000001', 'memoria'),
  ('10000000-0000-4000-8000-000000000002', 'memoria'),
  ('10000000-0000-4000-8000-000000000003', 'afro-brasileira'),
  ('10000000-0000-4000-8000-000000000003', 'acessivel'),
  ('10000000-0000-4000-8000-000000000004', 'afro-brasileira'),
  ('10000000-0000-4000-8000-000000000004', 'acessivel'),
  ('10000000-0000-4000-8000-000000000005', 'acessivel'),
  ('10000000-0000-4000-8000-000000000005', 'neurodiversidade'),
  ('10000000-0000-4000-8000-000000000006', 'neurodiversidade'),
  ('10000000-0000-4000-8000-000000000008', 'memoria')
on conflict do nothing;

-- Informações sintéticas: servem para exercitar os filtros, não como laudo.
insert into public.acessibilidade (
  local_id, rampa, elevador, banheiro_acessivel, piso_tatil,
  estacionamento_acessivel, audiodescricao, libras, braille
) values
  ('10000000-0000-4000-8000-000000000003', 'sim', 'parcial', 'sim', 'desconhecido', 'nao', 'sim', 'desconhecido', 'nao'),
  ('10000000-0000-4000-8000-000000000004', 'parcial', 'sim', 'sim', 'desconhecido', 'parcial', 'desconhecido', 'nao', 'desconhecido'),
  ('10000000-0000-4000-8000-000000000005', 'sim', 'sim', 'sim', 'parcial', 'sim', 'parcial', 'parcial', 'desconhecido')
on conflict (local_id) do update set
  rampa = excluded.rampa, elevador = excluded.elevador,
  banheiro_acessivel = excluded.banheiro_acessivel, piso_tatil = excluded.piso_tatil,
  estacionamento_acessivel = excluded.estacionamento_acessivel,
  audiodescricao = excluded.audiodescricao, libras = excluded.libras, braille = excluded.braille;

insert into public.ambiente_sensorial (
  local_id, ruido, iluminacao, movimentacao, tem_fila, espaco_descanso
) values
  ('10000000-0000-4000-8000-000000000003', 'baixo', 'media', 'baixa', false, true),
  ('10000000-0000-4000-8000-000000000005', 'alto', 'alta', 'alta', true, true),
  ('10000000-0000-4000-8000-000000000006', 'medio', 'baixa', 'media', true, true)
on conflict (local_id) do update set
  ruido = excluded.ruido, iluminacao = excluded.iluminacao,
  movimentacao = excluded.movimentacao, tem_fila = excluded.tem_fila,
  espaco_descanso = excluded.espaco_descanso;

insert into public.roteiros (
  id, usuario_id, titulo, descricao, tipo, duracao_min,
  distancia_metros, custo_centavos
) values
  ('20000000-0000-4000-8000-000000000001', null, 'Caminhos afro-brasileiros',
   'Arte, memória e matrizes africanas pelo Centro Histórico de Salvador.', 'tematico', 240, 1100, 1000),
  ('20000000-0000-4000-8000-000000000002', null, 'Frevo, sertão e artesanato',
   'Música, cultura popular e patrimônio entre o Recife Antigo e São José.', 'tematico', 300, 2600, 2200)
on conflict (id) do update set
  titulo = excluded.titulo, descricao = excluded.descricao, tipo = excluded.tipo,
  duracao_min = excluded.duracao_min, distancia_metros = excluded.distancia_metros,
  custo_centavos = excluded.custo_centavos;

delete from public.roteiro_paradas
where roteiro_id in (
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002'
);

insert into public.roteiro_paradas (
  roteiro_id, local_id, ordem, hora_sugerida, duracao_min
) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 1, '09:00', 75),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 2, '10:30', 60),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 3, '12:00', 90),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005', 1, '09:00', 90),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000006', 2, '11:00', 90),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007', 3, '14:00', 75);

