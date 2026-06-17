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
    descricaoMecanica: 'Até o fim da cena, aumente em 1 passo o seu dado de Força ou Agilidade (à sua escolha). Em contrapartida, reduza em 1 passo o seu dado de Inteligência ou Presença. Além disso, você sofre -3 de penalidade em quaisquer testes que exijam calma, paciência, mira ou delicadeza.',
  },
  {
    resultado: '4',
    nome: 'Amnesia',
    descricaoNarrativa: 'Sua memória fica instável. Pensamentos escapam, eventos recentes se embaralham e conexões lógicas que antes pareciam óbvias tornam-se distantes.',
    descricaoMecanica: 'Reduza em 1 passo seu dado de Inteligência. Narrativamente, o personagem tem extrema dificuldade para lembrar de informações vitais, conectar pistas, interpretar símbolos ou reconstruir eventos recentes.',
  },
  {
    resultado: '5',
    nome: 'Hesitação',
    descricaoNarrativa: 'Você trava, gagueja ou perde a janela do momento certo. Seu corpo simplesmente demora demais para obedecer aos comandos do seu cérebro.',
    descricaoMecanica: 'Reduza em 1 passo seu dado de Agilidade especificamente para testes de reação, fuga, perseguição, iniciativa e equilíbrio. Além disso, na próxima situação urgente (como o início de um combate ou armadilha), você age depois de todos os demais envolvidos, independentemente da sua iniciativa rolada.',
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
    descricaoMecanica: 'Até o fim da cena, você se torna um risco de exposição. Você sofre -1 passo em testes de Furtividade, Enganação ou qualquer outra ação que exija silêncio absoluto e controle corporal da respiração.',
  },
  {
    resultado: '8',
    nome: 'Histeria',
    descricaoNarrativa: 'Você ri, chora, grita, repete frases desconexas ou perde o controle do volume da própria voz. Seu medo transborda para fora de você, impossível de esconder.',
    descricaoMecanica: 'Reduza o seu dado de Presença em 1 passo. Você não consegue se comunicar com clareza e sofre -3 de penalidade em testes de Furtividade, Diplomacia, Enganação, Intimidação, concentração para habilidades e qualquer tentativa de comando ou conjuração verbal.',
  },
  {
    resultado: '9',
    nome: 'Visão de Túnel',
    descricaoNarrativa: 'Sua mente foca inteiramente na fonte do seu pavor. Tudo ao seu redor se torna um borrão periférico insignificante.',
    descricaoMecanica: 'Enquanto este efeito estiver ativo, você sofre uma penalidade de -3 na sua Evasão contra ataques de qualquer criatura que não seja a origem do seu medo. Além disso, você está tão focado na sua própria ameaça que não pode usar reações ativas para proteger ou alertar aliados adjacentes.',
  },
  {
    resultado: '10',
    nome: 'Desespero',
    descricaoNarrativa: 'A certeza de que nada vai dar certo contamina a sua alma. A resiliência vai embora.',
    descricaoMecanica: 'Reduza o seu dado de Vontade em 1 passo. O seu limite máximo de PD cai proporcionalmente na cena, e seus próximos testes para resistir à DT de Trauma tornam-se mecanicamente mais difíceis.',
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
    descricaoMecanica: 'Na cena atual, você sofre -2 em Percepção e Investigação. O verdadeiro terror vem depois: no seu próximo Descanso, o pesadelo te impede de dormir. Você deve escolher entre recuperar PV ou PD (não pode ambos) e não pode ser alvo da Terapia de Campo para remover Fraturas Mentais neste descanso.',
  },
  {
    resultado: '16',
    nome: 'Pânico Somático',
    descricaoNarrativa: 'O medo fecha sua garganta. Seu coração bate rápido demais, o peito aperta e puxar o ar torna-se um esforço consciente e doloroso.',
    descricaoMecanica: 'Reduza os seus dados de Perícia em 1 passo. Você perde o fôlego e não consegue gritar ou realizar ações de respiração controlada. Você não consegue falar frases longas.',
  },
  {
    resultado: '17',
    nome: 'Alucinação',
    descricaoNarrativa: 'Você vê, ouve ou sente coisas que simplesmente não estão lá. Para a sua psique estilhaçada, essas percepções são a realidade absoluta.',
    descricaoMecanica: 'O Mestre passa a descrever ilusões na cena como se fossem alvos reais. Sempre que você realizar um ataque ou ação direcionada, observe o valor natural do seu dado de Atributo principal: se o resultado for ÍMPAR, sua mente focou na alucinação. A ação e os recursos (munição, PD) são gastos, mas o ataque atinge o vazio e falha automaticamente. Se for PAR, sua mente encontrou a ameaça real e o ataque é resolvido normalmente.',
  },
  {
    resultado: '18',
    nome: 'Fuga Cega',
    descricaoNarrativa: 'O instinto primário de sobrevivência entra em curto-circuito. Ficar no mesmo ambiente que a ameaça torna-se fisicamente insuportável.',
    descricaoMecanica: 'Durante o seu turno, você é obrigado a usar pelo menos uma de suas Ações de Movimento para se afastar o máximo possível da origem do medo. Sob nenhuma circunstância você pode se mover voluntariamente em direção à ameaça enquanto este efeito durar.',
  },
  {
    resultado: '19',
    nome: 'Egoísmo de Sobrevivente',
    descricaoNarrativa: 'Você precisa sobreviver, custe o que custar. Todo o resto, incluindo a vida de seus amigos, parece secundário diante da urgência de continuar respirando.',
    descricaoMecanica: 'Até o fim da cena, você está proibido de gastar suas ações, itens ou Pontos de Determinação para curar, acalmar, proteger ou ajudar outro personagem se essa ação colocar você em qualquer nível de risco direto ou consumir recursos que salvariam sua vida.',
  },
  {
    resultado: '20',
    nome: 'Dissociação',
    descricaoNarrativa: 'Sua mente "desliga". O mundo ao redor parece um filme distante e irreal.',
    descricaoMecanica: 'Você sofre -5 em reações e evasão. O corpo está anestesiado; para conseguir focar na realidade e executar qualquer Ação Padrão, você precisa antes causar um choque físico em si mesmo (ex: morder o braço até sangrar). Isso causa 1d4 de dano físico inescapável (Ação Livre).',
  },
  {
    resultado: '21',
    nome: 'Trauma',
    descricaoNarrativa: 'O horror rasga o tecido da sua alma de forma permanente. Algo nas sombras, no cheiro ou no som desta cena fará parte dos seus pesadelos para sempre.',
    descricaoMecanica: 'Você fica paralisado (incapaz de agir) por 1 rodada. Além disso, você adquire imediatamente uma Fobia ou Mania temporária atrelada aos eventos do combate. Este trauma dura até o fim da missão atual, penalizando suas ações sempre que o gatilho estiver próximo. Diferente de fobias de histórico, este Trauma concede Esperança no máximo uma única vez por missão.',
  },
  {
    resultado: '22',
    nome: 'Paralisia',
    descricaoNarrativa: 'Você congela no lugar. Seus músculos endurecem como pedra, e até o menor movimento exige uma força titânica que você não possui no momento.',
    descricaoMecanica: 'Você fica totalmente incapaz de agir por 1 rodada completa. Após essa rodada, o bloqueio persiste: sempre que quiser realizar uma Ação de Movimento voluntária, você precisará primeiro passar em um teste de Vontade para conseguir vencer a rigidez dos seus músculos.',
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
    descricaoNarrativa: 'O colapso mental e físico absoluto. A mente apaga os disjuntores do corpo para não ser aniquilada pela impossibilidade do universo que acabou de testemunhar. Você se torna uma casca vazia, letárgica e catatônica.',
    descricaoMecanica: 'O seu jogo na cena atual acabou. Você cai no chão, recebendo as condições Inconsciente e Indefeso, totalmente incapaz de agir, falar ou se proteger. Para sobreviver, você precisa ser estabilizado e fisicamente arrastado do local do horror por seus aliados. Quando recuperar a consciência, você acorda com apenas 1 PD. Além disso, um de seus efeitos vira um Trauma Permanente, e você não pode mais recuperar PV, PD ou usar Cargas Defensivas em Descansos até o fim da missão.',
  },
];

export default fearEffects;