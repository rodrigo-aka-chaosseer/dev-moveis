# Esquema do banco — Raízes no Supabase

Este documento acompanha `esquema.sql`. Não repete os tipos de coluna — está
aqui pra explicar, em português comum, o que cada tabela guarda e por que ela
existe. Pensado pra ler em voz alta na apresentação.

15 tabelas: 10 já existiam em `src/db/schema.ts` (SQLite) e ganharam dono ou
tipo novo; 5 são novas, todas nascidas de uma pergunta que o servidor força a
responder e que o aparelho sozinho não precisava responder.

## Pessoa e preferências

### `usuarios` — novo
Quem tem conta no app. Não guarda e-mail de login nem senha — isso já mora no
sistema de autenticação do Supabase. Aqui só fica o que o app precisa saber
sobre a pessoa: um nome de exibição opcional e se ela é curadora de conteúdo.
Existe porque, a partir do momento que há servidor, todo dado de uma pessoa
específica (favorito, preferência, visita) precisa apontar pra alguém — e
"alguém" precisa ser uma tabela.

### `preferencias` — já existia, ganhou dono
Interesses, temas de diversidade que a pessoa quer ver, como ela se desloca,
quanto tempo tem disponível, e as necessidades de acessibilidade dela. Antes
era uma linha única no aparelho (só existia uma pessoa usando aquele
aparelho); agora é uma linha por usuário. O campo de necessidades de
acessibilidade é tratado como dado sensível — só a própria pessoa consegue lê-lo.

### `favoritos` — já existia, ganhou dono
Quais lugares a pessoa marcou pra lembrar depois. Antes a chave era só o
lugar (um favorito por aparelho); agora é usuário mais lugar, porque duas
pessoas no mesmo app podem favoritar o mesmo lugar sem conflito.

### `visitas` — já existia, ganhou dono
O Passaporte Cultural: o que a pessoa já conheceu, com data, uma anotação
livre e uma foto opcional. Existe pra registrar descoberta pessoal — nunca
para comparar uma pessoa com outra. A política de acesso do banco garante
isso tecnicamente: ninguém lê o passaporte de outra pessoa, nem o app tem
como montar um ranking com esse dado.

### `avaliacoes` — novo
Nota de 1 a 5 e um comentário que a pessoa deixa sobre um lugar, depois de
conhecer. Diferente do passaporte: isto é sobre o LUGAR, não sobre a pessoa,
e é público — é o que outros usuários veem antes de decidir visitar. Uma
pessoa avalia cada lugar uma vez só.

## Lugar e contexto cultural

### `locais` — já existia, ganhou tipos e autoria
O centro do app: cada lugar cultural cadastrado, com categoria, coordenada,
horário, preço, tempo médio de visita, e o que faz dele diferente de um
ponto no mapa — por que conhecer, a história, a fonte de onde essa
informação veio, e o aviso de visitação para espaços religiosos em
atividade e comunidades tradicionais. Esses quatro últimos campos
continuam obrigatórios: é a decisão 3 do projeto, e ela não muda aqui.
Ganhou um campo de latitude/longitude convertido automaticamente num
formato geográfico, que é o que permite buscar "lugares perto de mim" sem
escanear a tabela inteira. Ganhou também `arquivado_em`: um lugar nunca é
apagado (ver "O que acontece ao apagar uma conta..." abaixo), só arquivado
— nulo é publicado, preenchido some da leitura pública.

### `tags_diversidade` — já existia, sem mudança de fundo
Vocabulário fixo de diversidade: indígena, afro-brasileira, religiosa,
geracional, de acessibilidade, neurodivergente, e assim por diante. Existe
separada de `locais` porque um lugar pode carregar mais de uma dimensão de
diversidade ao mesmo tempo.

### `locais_tags` — já existia
Liga cada lugar às tags de diversidade que se aplicam a ele. É só a tabela
de ligação entre as duas anteriores.

### `acessibilidade` — já existia
Rampa, elevador, banheiro acessível, piso tátil, vaga reservada, audiodescrição,
Libras, Braille — um registro por lugar, com quatro respostas possíveis pra
cada item (sim, parcial, não, desconhecido). Isto é sobre o LUGAR, é
informação pública — o contrário da necessidade de acessibilidade da pessoa,
que é privada.

### `ambiente_sensorial` — já existia
Nível de ruído, iluminação, movimentação, se tem fila e se tem espaço de
descanso. Pensado pra quem se orienta por conforto sensorial, não só por
diagnóstico. Também é informação pública sobre o lugar.

### `eventos` — já existia
Programação com data e hora ligada a um lugar (ou solta, quando o evento não
tem endereço fixo). Tem preço e fonte próprios, porque um evento muda mais
rápido que o lugar onde ele acontece.

### `revisoes_local` — novo
O fluxo de curadoria: quem cadastra ou edita um lugar passa por aqui antes de
valer pra valer. Guarda o conteúdo proposto e o status (rascunho, em revisão,
publicado ou rejeitado). Existe porque o líder decidiu que cadastro de lugar
não é uma escrita direta — alguém com papel de curador submete, e o conteúdo
só chega em `locais` depois de aprovado.

### `sugestoes_local` — novo
Sugestão de lugar feita por qualquer pessoa da comunidade, não só pelo time
de curadoria. Mais simples que uma revisão de verdade: só nome, categoria,
localização aproximada e o motivo de valer a pena — sem história nem fonte,
que é trabalho de curadoria e vem depois, se a sugestão for aceita.

## Roteiros e eventos

### `roteiros` — já existia, ganhou dono opcional
Um roteiro temático (curado pelo time, sem dono) ou um roteiro gerado (criado
por uma pessoa, sempre com dono) — a mesma tabela dos dois, diferenciada por
um campo de tipo, exatamente como já era no aparelho. O banco agora garante
essa regra sozinho: roteiro temático nunca tem dono, roteiro gerado sempre
tem.

### `roteiro_paradas` — já existia
A sequência de lugares que compõe um roteiro, com a ordem de visita, duração
sugerida em cada parada e horário sugerido opcional.

## Row Level Security — o que fica travado

Supabase deixa o app falar direto com o banco, sem servidor próprio no meio.
Isso quer dizer que a única coisa impedindo um usuário de ler ou escrever a
linha de outro é a política de RLS — sem ela, qualquer pessoa com a URL do
projeto lê a tabela inteira. `esquema.sql` liga RLS em toda tabela com dado
de pessoa: `usuarios`, `preferencias`, `favoritos`, `visitas`, `avaliacoes`,
`locais`, `revisoes_local`, `sugestoes_local` e `roteiros`/`roteiro_paradas`
(um roteiro gerado revela onde alguém foi ou quer ir — é dado de pessoa, não
só conteúdo de catálogo).

Cinco pontos que valem explicar porque não são óbvios à primeira leitura —
os quatro primeiros só existem porque uma revisão adversarial (um segundo
modelo, sem ver o resto da conversa) encontrou furo numa primeira versão
deste desenho, e vale contar o que era o furo, não só o que ficou:

- **Ninguém se promove a curador sozinho.** A política de edição do próprio
  perfil deixa a pessoa trocar o nome de exibição, mas um gatilho separado
  bloqueia a troca do campo `papel` fora do painel do Supabase — sem isso,
  bastaria um usuário comum dar UPDATE na própria linha.
- **Revisão em andamento não é pública.** Conteúdo em `revisoes_local` com
  status "em revisão" só é visível pra quem escreveu ou pra curador — não
  para qualquer usuário logado, mesmo que o rascunho já exista no banco.
- **Roteiro gerado é privado por padrão, e ler não é o mesmo que escrever.**
  Só o roteiro temático (curado pelo time, sem dono) é público; o roteiro
  gerado por alguém só aparece pra essa pessoa. A tabela de paradas
  (`roteiro_paradas`) segue a mesma regra do roteiro pai, mas com leitura e
  escrita em políticas separadas — uma política única deixaria "todo mundo
  lê o roteiro público" virar, por engano, "todo mundo edita a parada de
  roteiro de qualquer pessoa".
- **Sugestão da comunidade nasce sempre pendente.** O INSERT em
  `sugestoes_local` trava `status`, `local_id`, `revisado_por` e
  `revisado_em` no estado inicial — sem isso, um usuário comum podia mandar
  a própria sugestão já marcada como aprovada, forjando uma decisão de
  curadoria que ninguém tomou.
- **Catálogo de apoio agora tem RLS.** `tags_diversidade`, `acessibilidade`,
  `ambiente_sensorial`, `eventos` e `locais_tags` não guardam dado de
  pessoa, mas ficaram sem trava de escrita numa primeira versão — qualquer
  usuário autenticado podia alterar ou apagar o catálogo inteiro (inclusive
  por cascata, apagando uma tag). Leitura pública, escrita só curador.

Três auditorias independentes (rodando o DDL de verdade fora do Supabase,
em três momentos) acharam coisas que já estão corrigidas: sete tabelas de
dado pessoal (`usuarios`, `visitas`, `favoritos`, `sugestoes_local`,
`preferencias`, `avaliacoes`, `roteiros`) tinham RLS ligado mas não
`FORCE ROW LEVEL SECURITY` — sem `FORCE`, o dono da tabela passa por cima
de toda política. No Supabase isso raramente aparece na prática, mas é
defesa em profundidade barata. A segunda auditoria achou que a política de
exclusão em volta de `locais` tinha quatro regras diferentes apontando pro
mesmo lugar — duas delas nunca chegavam a executar — e que "lugar se
despublica, não se apaga" (decisão 7) não tinha, de fato, um despublicar.
A terceira, testando os três casos de local arquivado em separado em vez
de como um problema só, achou que `eventos` vazava título e descrição de
um lugar arquivado pra qualquer anônimo, porque tem texto próprio e a
política de leitura não olhava pro arquivamento do local referenciado.
As três coisas viraram a seção abaixo.

## O que acontece ao apagar uma conta, e o que acontece ao tirar um lugar de cena

Curadoria é o ativo mais caro do projeto (decisões 3, 7 e 8 de
`docs/DECISOES.md`). Apagar a conta de alguém não pode apagar o que essa
pessoa cadastrou, e um lugar nunca é apagado — só arquivado. As duas regras
trabalham juntas:

- **Dado pessoal some com a conta.** `favoritos`, `preferencias`, `visitas`,
  `roteiros` (e as paradas desses roteiros) e `avaliacoes` são dado
  puramente pessoal, sem valor nenhum fora do dono. Apagar a conta apaga
  tudo isso — é o "direito ao esquecimento" funcionando.
- **A autoria vira nula, o conteúdo de curadoria fica.** Quem cadastrou um
  lugar (`locais.criado_por`), quem escreveu ou revisou uma curadoria
  (`revisoes_local.autor_id`, `revisoes_local.revisado_por`) e quem sugeriu
  ou avaliou uma sugestão (`sugestoes_local.usuario_id`,
  `sugestoes_local.revisado_por`) some da autoria, mas o lugar, a revisão e
  a sugestão continuam existindo — é o mesmo estado do conteúdo de carga
  inicial, que nunca teve curador.
- **Lugar nunca se apaga — só arquiva.** Tudo que é histórico de pessoa ou
  de curadoria sobre um lugar (`favoritos`, `avaliacoes`, `visitas`,
  `roteiro_paradas`, `eventos`, `revisoes_local`) bloqueia a exclusão desse
  lugar com erro de chave estrangeira — silenciosamente sumir com o
  favorito, a visita ou a revisão de alguém é pior do que a operação falhar.
  O caminho de verdade pra tirar um lugar errado de cena é `locais.arquivado_em`:
  preenchido, o lugar some da leitura pública mas continua existindo (e
  visível pro curador, que é quem desarquiva se for o caso). O que é *do*
  próprio lugar e não faz sentido sem ele — as tags de diversidade, a
  acessibilidade, o ambiente sensorial, uma sugestão que virou esse lugar —
  esses sim cascateiam quando o lugar (hipoteticamente) some.
- **Arquivar esconde o lugar, e também o que outra tabela expõe sobre
  ele.** Não basta a linha de `locais` sumir da leitura pública — quem lê
  `eventos` direto, por exemplo, não passa pela política de `locais`
  nenhuma. `eventos` tem título e descrição próprios, então a política de
  leitura de `eventos` também checa se o local dele está arquivado (exceto
  pra curador); um evento sem `local_id` (solto, sem endereço fixo)
  continua público — arquivamento de lugar não tem o que esconder ali.
  `roteiro_paradas` ganhou a mesma checagem, embora nesse caso não
  houvesse vazamento de texto: a linha só tem ids, e o JOIN com `locais`
  pra pegar nome ou história já vinha vazio por causa do filtro em
  `locais`. Favorito com local arquivado (`favoritos`) fica como item
  quebrado na lista de alguém, de propósito — decisão 9 de
  `docs/DECISOES.md`: é a tela de favoritos, quando existir, que decide se
  esconde ou mostra "lugar indisponível", não o banco.

## Observação sobre relacionamento e chave estrangeira

O enunciado da atividade dispensa mostrar relacionamento no desenho, mas eles
existem de verdade no banco — cada tabela deste documento referencia a outra
por chave estrangeira (`local_id`, `usuario_id`, `roteiro_id` etc.), garantida
pelo Postgres, não só pela convenção do nome da coluna. O diagrama mostra isso
de forma discreta, sem virar a atração principal do desenho.
