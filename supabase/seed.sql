-- Raízes — piloto Palmas/TO. Idempotente e não destrutivo.
-- Acessibilidade e ambiente sensorial são dados sintéticos de demonstração,
-- não laudos. Horários devem ser confirmados nas fontes antes da visita.

insert into public.cidades (id, nome, uf, latitude, longitude, ativa) values
  ('palmas', 'Palmas', 'TO', -10.1840, -48.3336, true)
on conflict (id) do update set nome=excluded.nome, uf=excluded.uf,
  latitude=excluded.latitude, longitude=excluded.longitude, ativa=true;

-- O piloto mostra somente Palmas; dados anteriores permanecem recuperáveis.
update public.cidades set ativa=false where id <> 'palmas';
update public.locais set arquivado_em=coalesce(arquivado_em, now())
where cidade_id <> 'palmas';

insert into public.locais (
  id,cidade_id,nome,categoria,latitude,longitude,endereco,horarios,gratuito,
  preco_centavos,imagem_url,tempo_medio_min,por_que_conhecer,historia,aviso_visitacao,
  fonte,atualizado_em,arquivado_em
) values
  ('30000000-0000-4000-8000-000000000001','palmas','Praça dos Girassóis','patrimonio',-10.1838,-48.3337,'Praça dos Girassóis, Plano Diretor Norte, Palmas - TO','{}',true,0,'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fl%C3%A1vio%20Andr%C3%A9%20Cascata%20Pra%C3%A7a%20dos%20Girass%C3%B3is%20Palmas%20TO%20%2826667449997%29.jpg?width=1280',90,'Reúne monumentos, obras de arte e marcos da criação do Tocantins.','Abriga as sedes dos três poderes e monumentos como a Rosa dos Ventos, o Cruzeiro e o Relógio do Sol.','Área extensa e aberta; leve água e prefira horários de menor incidência solar.','https://portal2013.palmas.to.gov.br/conheca_palmas/visite-palmas/praca-dos-girassois/',now(),null),
  ('30000000-0000-4000-8000-000000000002','palmas','Memorial Coluna Prestes','historia',-10.1844,-48.3341,'Praça dos Girassóis, Palmas - TO','{}',true,0,'https://commons.wikimedia.org/wiki/Special:Redirect/file/Memorial%20Coluna%20Prestes%20Oscar%20Niemeyer%20Palmas%20TO.jpg?width=1280',60,'Apresenta documentos, fotografias e objetos ligados à Coluna Prestes.','Projetado por Oscar Niemeyer e inaugurado em 2001, abriga também a escultura Cavaleiro da Luz.','Confirme o horário de visitação antes de sair.','https://palmas.to.gov.br/core/noticias/fundacao-cultural-de-palmas-representa-prefeitura-em-reinauguracao-do-memorial-coluna-prestes/',now(),null),
  ('30000000-0000-4000-8000-000000000003','palmas','Museu Histórico do Tocantins — Palacinho','historia',-10.1687,-48.3319,'Av. NS 10, Quadra 112 Norte, Palmas - TO','{}',true,0,'https://commons.wikimedia.org/wiki/Special:Redirect/file/Museu%20Hist%C3%B3rico%20do%20Tocantins%20-%20Palacinho%2019.jpg?width=1280',60,'Guarda a memória da criação do Tocantins e dos primeiros anos de Palmas.','Construído em madeira de jatobá, foi a primeira sede do Poder Executivo estadual.','Confirme previamente os horários de abertura.','https://turismo-palmas.palmas.to.gov.br/pt/atracoes/museu-historico-do-tocantins-palacinho',now(),null),
  ('30000000-0000-4000-8000-000000000004','palmas','Parque Cesamar','natureza',-10.2053,-48.3193,'Área Verde 506 Sul, Palmas - TO','{}',true,0,'https://commons.wikimedia.org/wiki/Special:Redirect/file/Flavioandre%20Parque%20Linear%20CESAMAR%20Palmas%20TO%20%2826235810147%29.jpg?width=1280',90,'Combina área verde, lago, trilhas e patrimônio histórico.','Integra a paisagem urbana planejada e abriga a Casa Suçuapara, ligada à memória da primeira prefeitura.','Respeite a fauna, não alimente animais e use os percursos sinalizados.','https://palmas.to.gov.br/core/noticias/parques-e-praias-da-capital-possuem-equipe-de-zeladoria-para-limpeza-frequente/',now(),null),
  ('30000000-0000-4000-8000-000000000005','palmas','Espaço Cultural José Gomes Sobrinho','cultura',-10.1938,-48.3265,'Av. Teotônio Segurado, Área Verde 302 Sul, Palmas - TO','{}',true,0,null,75,'Concentra cinema, teatro, galeria, biblioteca e formação artística.','Reúne o Cine Cultura, o Theatro Fernanda Montenegro, a Galeria Municipal e a Biblioteca Jornalista Jaime Câmara.','Consulte a programação; atividades podem ter horários e ingressos próprios.','https://diariooficial.palmas.to.gov.br/media/diario/1870-suplemento-1-6-11-2017-9-23-17.pdf',now(),null),
  ('30000000-0000-4000-8000-000000000006','palmas','Praia da Graciosa','natureza',-10.1848,-48.4004,'Orla da Graciosa, Palmas - TO','{}',true,0,'https://commons.wikimedia.org/wiki/Special:Redirect/file/P%C3%B4r%20do%20sol%20na%20Praia%20da%20Graciosa%20em%20Palmas%2C%20Tocantins%2C%202022.jpg?width=1280',120,'É um dos principais espaços de convivência à beira do Lago de Palmas.','Integra o Projeto Orla e consolidou-se como área de lazer, gastronomia e eventos.','Observe as condições de banho e orientações locais.','https://palmas.to.gov.br/core/noticias/parques-e-praias-da-capital-possuem-equipe-de-zeladoria-para-limpeza-frequente/',now(),null),
  ('30000000-0000-4000-8000-000000000007','palmas','Feira da 304 Sul','gastronomia',-10.1957,-48.3334,'Quadra 304 Sul, Palmas - TO','{}',true,0,null,75,'Aproxima visitantes da alimentação, do artesanato e do cotidiano local.','Reconhecida na rota turística oficial, é um ponto tradicional de compras e encontro da comunidade.','Alimentos e produtos são pagos; confirme dias e horários.','https://doe.to.gov.br/diario/5066/download',now(),null),
  ('30000000-0000-4000-8000-000000000008','palmas','Parque dos Povos Indígenas','natureza',-10.1729,-48.3268,'Quadra 203 Norte, Palmas - TO','{}',true,0,null,75,'Oferece área verde para caminhada e convivência em região central.','Faz parte da rede de áreas públicas de lazer e visitação mantidas pelo Município.','Preserve a vegetação e evite horários de calor intenso.','https://palmas.to.gov.br/core/noticias/parques-e-praias-da-capital-possuem-equipe-de-zeladoria-para-limpeza-frequente/',now(),null),
  ('30000000-0000-4000-8000-000000000009','palmas','Cachoeira da Roncadeira','natureza',-10.303625,-48.13915,'Rodovia TO-030, Taquaruçu, Palmas - TO','{}',false,3000,'https://commons.wikimedia.org/wiki/Special:Redirect/file/Palmas%20-%20TO.jpg?width=1280',180,'Uma queda de cerca de 70 metros cercada pela mata do Cerrado.','Em propriedade particular na área de Taquaruçu, tem visitação controlada e é um dos atrativos naturais mais conhecidos de Palmas.','Preço de referência: R$ 30 por pessoa. Confirme valor, horário e condições da trilha antes da visita.','https://lhever.com/x/ee25b039-5c46-4d16-af2c-fa00c78e0af3',now(),null)
on conflict (id) do update set cidade_id=excluded.cidade_id,nome=excluded.nome,
  categoria=excluded.categoria,latitude=excluded.latitude,longitude=excluded.longitude,
  endereco=excluded.endereco,horarios=excluded.horarios,gratuito=excluded.gratuito,
  preco_centavos=excluded.preco_centavos,imagem_url=excluded.imagem_url,tempo_medio_min=excluded.tempo_medio_min,
  por_que_conhecer=excluded.por_que_conhecer,historia=excluded.historia,
  aviso_visitacao=excluded.aviso_visitacao,fonte=excluded.fonte,
  atualizado_em=excluded.atualizado_em,arquivado_em=null;

insert into public.tags_diversidade (id,nome,dimensao) values
  ('memoria','Memória','geracional'),('patrimonio','Patrimônio','geracional'),
  ('natureza','Natureza','geracional'),('cultura-local','Cultura local','geracional')
on conflict (id) do update set nome=excluded.nome,dimensao=excluded.dimensao;

insert into public.locais_tags (local_id,tag_id) values
  ('30000000-0000-4000-8000-000000000001','patrimonio'),
  ('30000000-0000-4000-8000-000000000002','memoria'),
  ('30000000-0000-4000-8000-000000000003','memoria'),
  ('30000000-0000-4000-8000-000000000004','natureza'),
  ('30000000-0000-4000-8000-000000000005','cultura-local'),
  ('30000000-0000-4000-8000-000000000006','natureza'),
  ('30000000-0000-4000-8000-000000000007','cultura-local'),
  ('30000000-0000-4000-8000-000000000008','natureza'),
  ('30000000-0000-4000-8000-000000000009','natureza')
on conflict do nothing;

insert into public.acessibilidade (local_id,rampa,elevador,banheiro_acessivel,piso_tatil,estacionamento_acessivel,audiodescricao,libras,braille) values
  ('30000000-0000-4000-8000-000000000003','sim','desconhecido','desconhecido','desconhecido','desconhecido','desconhecido','desconhecido','desconhecido'),
  ('30000000-0000-4000-8000-000000000005','sim','desconhecido','sim','desconhecido','desconhecido','desconhecido','desconhecido','desconhecido'),
  ('30000000-0000-4000-8000-000000000006','parcial','desconhecido','desconhecido','desconhecido','desconhecido','desconhecido','desconhecido','desconhecido')
on conflict (local_id) do update set rampa=excluded.rampa,elevador=excluded.elevador,banheiro_acessivel=excluded.banheiro_acessivel,piso_tatil=excluded.piso_tatil,estacionamento_acessivel=excluded.estacionamento_acessivel,audiodescricao=excluded.audiodescricao,libras=excluded.libras,braille=excluded.braille;

insert into public.ambiente_sensorial (local_id,ruido,iluminacao,movimentacao,tem_fila,espaco_descanso) values
  ('30000000-0000-4000-8000-000000000003','baixo','media','baixa',false,true),
  ('30000000-0000-4000-8000-000000000005','medio','media','media',true,true),
  ('30000000-0000-4000-8000-000000000006','medio','alta','media',false,true)
on conflict (local_id) do update set ruido=excluded.ruido,iluminacao=excluded.iluminacao,movimentacao=excluded.movimentacao,tem_fila=excluded.tem_fila,espaco_descanso=excluded.espaco_descanso;

insert into public.roteiros (id,usuario_id,titulo,descricao,tipo,duracao_min,distancia_metros,custo_centavos) values
  ('40000000-0000-4000-8000-000000000001',null,'Memória e cultura de Palmas','Da criação do Tocantins aos espaços culturais da capital.','tematico',300,5200,0),
  ('40000000-0000-4000-8000-000000000002',null,'Natureza e sabores de Palmas','Parques, feira e orla em diferentes paisagens da cidade.','tematico',390,14500,0)
on conflict (id) do update set titulo=excluded.titulo,descricao=excluded.descricao,tipo=excluded.tipo,duracao_min=excluded.duracao_min,distancia_metros=excluded.distancia_metros,custo_centavos=excluded.custo_centavos;

insert into public.roteiro_paradas (roteiro_id,local_id,ordem,hora_sugerida,duracao_min) values
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003',1,'09:00',60),
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',2,'10:30',90),
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002',3,'12:15',60),
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000005',4,'14:00',75),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000008',1,'08:00',75),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000004',2,'10:00',90),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000007',3,'12:30',75),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000006',4,'15:30',120)
on conflict (roteiro_id,ordem) do update set local_id=excluded.local_id,hora_sugerida=excluded.hora_sugerida,duracao_min=excluded.duracao_min;
