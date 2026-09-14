# Roteiro de apresentação — Esquema do banco (RAÍZES-09)

Uma página. Ler junto com `diagrama.png` na tela.

## Abertura (uma frase)

"O app saiu de 'um usuário por aparelho' pra 'servidor com todo mundo ao
mesmo tempo' — e isso muda o banco num ponto central: dado de pessoa
precisa de dono."

## Zona 1 — Lugar e contexto cultural (terracota, 7 tabelas)

- `locais` é o centro do app: cada lugar carrega categoria, coordenada, e o
  que nos diferencia de um Google Maps — por que conhecer, história, fonte
  e aviso de visitação pra espaço religioso em atividade. Esses quatro
  campos são obrigatórios desde o início do projeto.
- Cadastro não é escrita direta: passa por `revisoes_local`, um fluxo de
  curadoria com status (rascunho → em revisão → publicado).
- Novidade desta entrega: `sugestoes_local` — qualquer pessoa da comunidade
  pode sugerir um lugar, mais simples que uma revisão de curadoria de
  verdade.

## Zona 2 — Pessoa e preferências (marrom, 5 tabelas)

- `usuarios` não guarda senha — isso é trabalho do Supabase Auth. Guarda só
  o que o app precisa exibir.
- `preferencias`, `favoritos` e `visitas` (o Passaporte Cultural) agora têm
  dono. Antes existiam soltas, porque só havia uma pessoa por aparelho.
- Novidade: `avaliacoes` — nota e comentário público sobre um lugar,
  diferente do passaporte, que é privado e nunca vira ranking.

## Zona 3 — Roteiros e eventos (terracota escuro, 3 tabelas)

- Roteiro temático (curado pelo time) e roteiro gerado (por alguém) ficam
  na mesma tabela, diferenciados por dono — igual já era no protótipo.

## Segurança (o argumento técnico central)

"Supabase deixa o app falar direto com o banco, sem servidor no meio. Isso
significa que a única coisa impedindo alguém de ler o dado de outra pessoa
é a política de acesso dentro do próprio banco — chamada Row Level
Security. Todo dado de pessoa tem essa trava, testada de verdade: rodamos
o banco inteiro num Postgres real e confirmamos que uma usuária não
enxerga a preferência de acessibilidade da outra."

## Fechamento — o que apagar uma conta faz

"O que é puramente pessoal (favorito, preferência, passaporte, roteiro
gerado) some junto com a conta. Mas o conteúdo que a pessoa curou —
um lugar, uma revisão — continua existindo; só a autoria vira nula. O
conteúdo curado é o ativo mais caro do projeto, e apagar uma conta não
pode apagar ele junto."
