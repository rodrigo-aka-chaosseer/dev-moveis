# RAÍZES-04 — Tela de Perfil

Decisões fechadas antes da implementação. Quem for mexer nesta tela depois
lê isto primeiro, para não desfazer sem querer o que foi decidido de propósito.

## O que a tela é

Um **passaporte cultural**. Não é uma lista de configurações com avatar em
cima. A tela inteira se comporta como um documento: moldura contínua, número
de série, campos preenchidos, carimbos.

A referência veio de pesquisa em telas de perfil premiadas — Duolingo (Apple
Design Award 2023) trata perfil como prateleira de troféus, Airbnb desenhou o
Host Passport como passaporte físico, Oura mostra o dado antes da identidade.
O padrão comum é abandonar a lista de linhas e assumir uma metáfora.

## Decisões e por quê

**Seis carimbos, não oito.** As dimensões de diversidade em `src/db/schema.ts`
são oito, mas acessibilidade e neurodiversidade ficaram de fora dos carimbos.
Conhecer cultura indígena é aprendizado; visitar um lugar com rampa não é
conquista. Tratar as duas coisas como a mesma coisa seria constrangedor.

**Acessibilidade fica junto das preferências, sem seção própria.** "Ruído
baixo" e "Rotas acessíveis" aparecem na mesma lista e com o mesmo peso de
"Gastronomia". Necessidade é preferência, não diagnóstico. Isso segue o
princípio "resolva para um, estenda para muitos" dos Inclusive Design
Principles da Microsoft.

**O passaporte não é placar.** A legenda abaixo dos carimbos diz isso em voz
alta. A literatura de gamificação (Yu-kai Chou, e a análise do Untappd sobre
badges como sinal social) mostra que contagem comparável entre pessoas
transforma descoberta em competição. O modelo seguido é o do passaporte dos
parques nacionais americanos e do AllTrails: registro pessoal, sem ranking.

**Iniciais em disco, não foto.** Não inventamos rosto de pessoa que não
existe. Também é o estado real de quem ainda não subiu foto.

**Papel de fibra.** A textura é um PNG em tons de cinza tingido com a cor da
tinta do documento, a 16% de opacidade. É a "restrição material" que designers
premiados usaram em 2026 como antídoto à planura de design gerado por máquina.
Se alguém achar que pesa, o caminho é baixar a opacidade — não remover.

**Superfície clara.** Contrasta com a abertura escura e dá ritmo ao app.

**Moldura 2px por fora, 1px nas divisórias.** É como documento impresso se
comporta e alivia o peso numa tela rolável.

## Estados vazios são requisito

Dois carimbos conquistados e quatro pendentes nos dados fictícios, para que os
dois estados apareçam sempre. A lista de favoritos tem o vazio desenhado. Isso
não é capricho: estado vazio bem escrito é exatamente o que interface gerada
automaticamente não entrega.

## Fora desta entrega

Banco de dados, login, persistência, tela de editar preferências (o botão leva
ao stub do onboarding), detalhe de favoritos, navegação por abas, animação.

A tela vive em `/perfil` e ainda não tem entrada na navegação — a barra de abas
é a RAÍZES-03. Para vê-la hoje, rode o projeto e abra `/perfil` no navegador,
ou use o menu de rotas do Expo.
