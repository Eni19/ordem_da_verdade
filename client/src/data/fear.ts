export interface FearEffect {
  resultado: string;
  nome: string;
  descricaoNarrativa: string;
  descricaoMecanica: string;
}

const fearEffects: FearEffect[] = [
  {
    resultado: '2',
    nome: 'Encorajamento',
    descricaoNarrativa: 'Às vezes, o medo traz o melhor de nós. Em vez de quebrar, você encontra uma força inesperada e primária que impulsiona sua vontade de viver.',
    descricaoMecanica: 'Escolha um Atributo. Ele é aumentado em 1 passo até o final da cena. Além disso, você recupera 1 Ponto de Sanidade por nível de personagem (lembrando que não pode ultrapassar o seu máximo de PD).',
  },
  {
    resultado: '3',
    nome: 'Surto de Adrenalina',
    descricaoNarrativa: 'Seu corpo assume o controle. O medo acelera seus músculos, seus reflexos e seus impulsos, mas sua mente perde qualquer traço de clareza ou empatia.',
    descricaoMecanica: 'Até o fim da cena, aumente em 1 passo o seu dado de Força ou Agilidade (à sua escolha). Em contrapartida, reduza em 1 passo o seu dado de Inteligência.',
  },
  {
    resultado: '4',
    nome: 'Amnesia',
    descricaoNarrativa: 'Sua memória fica instável. Pensamentos escapam, eventos recentes se embaralham e conexões lógicas que antes pareciam óbvias tornam-se distantes.',
    descricaoMecanica: 'Reduza em 1 passo seu dado de Inteligência. Narrativamente, o personagem tem extrema dificuldade para lembrar de informações vitais, conectar pistas, interpretar símbolos ou reconstruir eventos recentes.',
  },
  {
    resultado: '5',
    nome: 'Torpor',
    descricaoNarrativa: 'Você trava, gagueja ou perde a janela do momento certo. Seu corpo simplesmente demora demais para obedecer aos comandos do seu cérebro.',
    descricaoMecanica: 'Reduza em 1 passo seu dado de Agilidade. Além disso, na próxima situação urgente (como o início de um combate ou armadilha), você age depois de todos os demais envolvidos, independentemente da sua iniciativa rolada.',
  },
  {
    resultado: '6',
    nome: 'Fraqueza',
    descricaoNarrativa: 'O medo atinge diretamente o seu físico. Você começa a passar mal, suar frio e sentir suas forças abandonando seus membros de forma debilitante.',
    descricaoMecanica: 'Até o fim da cena, reduza em 1 passo todos os seus dados de Força.',
  },
  {
    resultado: '7',
    nome: 'Tremor Incontrolável',
    descricaoNarrativa: 'Seus dentes batem violentamente, seu corpo tem espasmos e pequenos soluços de pânico escapam dos seus lábios, por mais que você tente segurá-los.',
    descricaoMecanica: 'Até o fim da cena, você se torna um risco de exposição. Você não consegue ser furtivo, fazer silêncio absoluto ou ter controle corporal da respiração.',
  },
  {
    resultado: '8',
    nome: 'Histeria',
    descricaoNarrativa: 'Você ri, chora, grita, repete frases desconexas ou perde o controle do volume da própria voz. Seu medo transborda para fora de você, impossível de esconder.',
    descricaoMecanica: 'Reduza o seu dado de Presença em 1 passo. Você não consegue se comunicar com clareza '
  },
  {
    resultado: '9',
    nome: 'Visão de Túnel',
    descricaoNarrativa: 'Sua mente foca inteiramente na fonte do seu pavor. Tudo ao seu redor se torna um borrão periférico insignificante.',
    descricaoMecanica: 'Enquanto este efeito estiver ativo, você sofre uma penalidade de -3 na sua Evasão contra ataques de qualquer criatura que não seja a origem do seu medo.	',
  },
  {
    resultado: '10',
    nome: 'Desespero',
    descricaoNarrativa: 'A certeza de que nada vai dar certo contamina a sua alma. A resiliência vai embora.',
    descricaoMecanica: 'Reduza o seu dado de Vontade em 1 passo. '
  },
  {
    resultado: '11',
    nome: 'Desorientação',
    descricaoNarrativa: 'Você perde a noção de espaço, tempo e prioridade. Por um momento angustiante, a geografia do cenário e o fluxo da batalha deixam de fazer sentido.',
    descricaoMecanica: 'Você perde a capacidade de reagir de forma consciente a ataques inimigos e não pode usar Cargas Defensivas (Aparar, Esquivar, Bloquear).',
  },
  {
    resultado: '12',
    nome: 'Paranoia',
    descricaoNarrativa: 'Você desconfia de tudo e acaba se tornando reativo demais. Cada sombra, silêncio ou aliado se aproximando parece esconder uma ameaça velada ou uma traição iminente.',
    descricaoMecanica: 'Você não pode ser alvo de ações voluntárias benéficas de aliados (como ser alvo de Acalmar, primeiros socorros, entrega de itens ou buffs) sem que o aliado primeiro passe em um teste de Persuasão contra a sua Vontade (você resiste ativamente à ajuda). Além disso, dominado pela desconfiança, você se recusa a dar as costas aos outros e não pode usar a ação de Ajudar aliados durante o combate.',
  },
  {
    resultado: '13',
    nome: 'Ansiedade',
    descricaoNarrativa: 'Para você, qualquer pequeno erro parece devastador. Cada falha mínima parece anunciar uma catastrophe inevitável, sabotando sua própria competência.',
    descricaoMecanica: 'Sempre que um dos seus dados naturais rolar 1 em qualquer teste, a ação falha automaticamente, mesmo que o resultado matemático total (somando modificadores ou outros dados) fosse suficiente para passar. Se o teste já seria uma falha natural, essa falha gera uma complicação narrativa drástica ditada pelo Mestre.',
  },
  {
    resultado: '14',
    nome: 'Tique Nervoso',
    descricaoNarrativa: 'Sua mente fragmentada exige que você repita um padrão inútil para tentar organizar o caos, drenando sua atenção do combate real.',
    descricaoMecanica: 'No início de cada um de seus turnos, você deve gastar uma Ação de Movimento para realizar o seu tique (exemplos: checar obsessivamente a munição que já sabe que tem, balbuciar uma reza, limpar o sangue do rosto). Se você decidir ignorar o tique ou não tiver a ação disponível, a agonia psicológica drena a sua energia vital, fazendo com que você perca 1d4 Pontos de Determinação (PD).',
  },
  {
    resultado: '15',
    nome: 'Assombro (Pesadelos)',
    descricaoNarrativa: 'A imagem do horror gruda na parte de trás dos seus olhos. Toda vez que pisca, você vê a morte.',
    descricaoMecanica: 'O verdadeiro terror vem depois: no seu próximo Descanso, o pesadelo te impede de dormir. A qualidade do seu descanso diminui em 2 passos',
  },
  {
    resultado: '16',
    nome: 'Pânico Somático',
    descricaoNarrativa: 'O medo fecha sua garganta. Seu coração bate rápido demais, o peito aperta e puxar o ar torna-se um esforço consciente e doloroso. O mundo ao seu redor fica abafado pelo som da sua própria respiração irregular.',
    descricaoMecanica: 'A hiperventilação impede qualquer esforço contínuo. Primeiro, você fica incomunicável na cena: não consegue gritar ou discutir planos (o jogador só pode sussurrar 2 ou 3 palavras ofegantes por turno). Segundo, o seu corpo não suporta explosões de energia. Se você utilizar uma Ação Padrão e uma Ação de Movimento no mesmo turno, a privação de oxigênio cobra o preço: você sofre automaticamente 1 Corte no Relógio de Vitalidade no final do seu turno.',
  },
  {
    resultado: '17',
    nome: 'Alucinação',
    descricaoNarrativa: 'Sua mente fragmenta a realidade de forma intermitente. Em um instante você vê o mundo com clareza agonizante; no segundo seguinte, as sombras distorcem rostos, documentos e distâncias. O que é real e o que é delírio tornam-se impossíveis de separar.',
    descricaoMecanica: 'A sua confiança é sabotada pelas ilusões dentro e fora de combate. Sempre que você realizar um teste rolando seus dados, olhe primeiro para o valor natural do seu Dado de Interferência: Se for PAR, você tem um momento de clareza e o teste é resolvido normalmente.Se for ÍMPAR, a alucinação ataca no exato momento da ação. Você é obrigado a re-rolar o seu maior dado entre Atributo e Perícia, e deve ficar com o novo resultado. Se essa re-rolagem transformar um Sucesso em Falha, a ilusão engoliu sua ação. Você (o jogador) narra como a alucinação sabotou a realidade ',
  },
  {
    resultado: '18',
    nome: 'Fuga Cega',
    descricaoNarrativa: 'O instinto primário de sobrevivência entra em curto-circuito. Ficar no mesmo ambiente que a ameaça torna-se fisicamente insuportável.',
    descricaoMecanica: 'Durante o seu turno, você é obrigado a usar pelo menos uma de suas Ações de Movimento para se afastar o máximo possível da origem do medo. Sob nenhuma circunstância você pode se mover voluntariamente em direção à ameaça enquanto este efeito durar.',
  },
  {
    resultado: '19',
    nome: 'Covardia',
    descricaoNarrativa: 'Você precisa sobreviver, custe o que custar. Todo o resto, incluindo a vida de seus amigos, parece secundário diante da urgência de continuar respirando.',
    descricaoMecanica: 'Até o fim da cena, você está proibido de gastar suas ações, itens ou Pontos de Determinação para curar, acalmar, proteger ou ajudar outro personagem se essa ação colocar você em qualquer nível de risco direto ou consumir recursos que salvariam sua vida.',
  },
  {
    resultado: '20',
    nome: 'Descolamento da Realidade',
    descricaoNarrativa: 'Você se torna um passageiro no próprio corpo, assistindo a tudo em terceira pessoa. O mundo fica abafado e com um atraso terrível. Sua mente entra em piloto automático para tentar sobreviver, alheia ao caos imediato.',
    descricaoMecanica: 'No início exato de cada rodada (antes de qualquer pessoa agir), você é obrigado a declarar em voz alta e de forma definitiva como vai gastar suas ações (Movimento e Padrão) e quais serão seus alvos. Quando o seu turno chegar na ordem de iniciativa, você deve executar rigorosamente o que planejou, independentemente de como o campo de batalha mudou. Se a ação se tornar inválida ou impossível (ex: o monstro morreu, o aliado saiu da frente, a porta foi trancada), seu corpo em dissociação tentará executá-la mesmo assim (atirando no cadáver, golpeando o vazio ou trombando na porta), desperdiçando o turno..',
  },
  {
    resultado: '21',
    nome: 'Trauma Psicosomático',
    descricaoNarrativa: 'O horror rasga a sua mente de tal forma que se torna uma trauma fisico. Algo nas sombras, no cheiro ou no som desta cena fará parte dos seus pesadelos para sempre.',
    descricaoMecanica: 'Sua mente afeta severamente seu corpo. Você adquire imediatamente um Trauma Fisico.',
  },
  {
    resultado: '22',
    nome: 'Paralisia',
    descricaoNarrativa: 'Você congela no lugar. Seus músculos endurecem como pedra, e até o menor movimento exige uma força titânica que você não possui no momento.',
    descricaoMecanica: ' Sempre que quiser realizar uma Ação de Movimento voluntária, você precisará primeiro passar em um teste de Vontade para conseguir vencer a rigidez dos seus músculos.',
  },
  {
    resultado: '23',
    nome: 'Desmaio',
    descricaoNarrativa: 'A sua mente não suporta o peso escurecedor da realidade e simplesmente desliga os disjuntores do seu corpo como um mecanismo drástico de defesa.',
    descricaoMecanica: 'Você cai imediatamente Inconsciente e recebe a condição Indefeso. Você só despertará se for alvo de uma ação médica bem-sucedida, se sofrer qualquer ponto de dano físico direto que cause dor, ou de forma natural ao final da cena, quando a adrenalina baixar.',
  },
  {
    resultado: '24+',
    nome: 'Choque Sistêmico',
    descricaoNarrativa: 'O colapso mental e físico absoluto. Você se torna uma casca vazia, letárgica e catatônica.',
    descricaoMecanica: 'O seu jogo na cena atual acabou. Você está enlouquecendo. A insanidade te consome',
  },
];

export const mentalDegradation: FearEffect[] = [
  {
    resultado: 'DM1',
    nome: '1º Estresse Mental',
    descricaoNarrativa: 'O cérebro entra em estado de alerta, dificultando o foco.',
    descricaoMecanica: 'O custo para ativar qualquer Habilidade ou Ritual aumenta em +1 Ponto de Determinação (PD).'
  },
  {
    resultado: 'DM2',
    nome: '2º Fadiga Mental',
    descricaoNarrativa: 'O esforço drena a mente.',
    descricaoMecanica: 'O custo para ativar qualquer Habilidade ou Ritual aumenta em mais +1 PD (totalizando um acréscimo de +2 PD junto ao Estresse Mental).'
  },
  {
    resultado: 'DM3',
    nome: '3º Colapso',
    descricaoNarrativa: 'O limite humano é rompido.',
    descricaoMecanica: 'O personagem não recebe uma terceira condição; em vez disso, é forçado a realizar uma rolagem na Tabela de Efeitos de Medo imediatamente. Após o resultado, a degradação é zerada e as condições de Estresse e Fadiga são removidas, deixando apenas o novo trauma na mente.'
  }
];

export default fearEffects;