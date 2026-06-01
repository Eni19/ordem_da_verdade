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
    descricaoNarrativa:
      'Às vezes, o medo traz o melhor de nós. Em vez de quebrar, você encontra uma força inesperada.',
    descricaoMecanica:
      'Escolha um atributo para aumentar em 1 passo até o final da cena. Você recupera 1 Ponto de Determinação por nível, mas não pode ultrapassar seu máximo de PD.',
  },
  {
    resultado: '3',
    nome: 'Surto de Adrenalina',
    descricaoNarrativa:
      'Seu corpo assume o controle. O medo acelera seus músculos, seus reflexos e seus impulsos, mas sua mente perde clareza.',
    descricaoMecanica:
      'Até o fim da cena, aumente em 1 passo seus dados de Força e Agilidade. Porém, reduza em 1 passo seus dados de Inteligência e Presença. Além disso, você sofre -3 em testes que exijam calma, paciência ou delicadeza.',
  },
  {
    resultado: '4',
    nome: 'Hesitação',
    descricaoNarrativa:
      'Você trava, gagueja ou perde o momento certo. Seu corpo demora demais para obedecer.',
    descricaoMecanica:
      'Até o fim da cena, reduza em 1 passo seu dado de Agilidade para testes de reação, fuga, perseguição, iniciativa, equilíbrio e ações feitas sob pressão imediata. Além disso, na próxima situação urgente, você age depois dos demais envolvidos.',
  },
  {
    resultado: '5',
    nome: 'Fraqueza',
    descricaoNarrativa:
      'O medo atinge seu corpo. Você começa a passar mal, suar frio e sentir suas forças abandonando seus membros.',
    descricaoMecanica:
      'Até o fim da cena, reduza em 1 passo seus dados de Força. Além disso, você fica limitado a uma única ação por turno.',
  },
  {
    resultado: '6',
    nome: 'Lapso',
    descricaoNarrativa:
      'Sua memória fica instável. Pensamentos escapam, eventos recentes se embaralham e conexões óbvias parecem distantes.',
    descricaoMecanica:
      'Até o fim da cena, reduza em 1 passo seu dado de Inteligência. Além disso, você tem dificuldade para lembrar, conectar pistas, interpretar símbolos, reconstruir eventos ou explicar algo que presenciou.',
  },
  {
    resultado: '7',
    nome: 'Histeria',
    descricaoNarrativa:
      'Você ri, chora, grita, repete frases ou perde o controle da voz. Seu medo transborda para fora de você.',
    descricaoMecanica:
      'Enquanto estiver histérico, reduza seu dado de Presença em 1 passo. Você não consegue se comunicar com clareza e sofre -3 em testes que envolvam Furtividade, Diplomacia, Enganação, Intimidação, concentração, comando ou conjuração verbal.',
  },
  {
    resultado: '8',
    nome: 'Desorientação',
    descricaoNarrativa:
      'Você perde noção de espaço, tempo e prioridade. Por um momento, a cena deixa de fazer sentido.',
    descricaoMecanica:
      'Enquanto estiver desorientado, sofre -3 de Evasão e não pode usar Cargas Defensivas ou reações. Fora de combate, sofre -3 em testes para se orientar, perceber perigo, seguir rastros, fugir, perseguir ou reagir rapidamente.',
  },
  {
    resultado: '9',
    nome: 'Paranoia',
    descricaoNarrativa:
      'Você desconfia de tudo e acaba se tornando reativo demais. Cada sombra, gesto ou silêncio parece esconder uma ameaça.',
    descricaoMecanica:
      'Enquanto estiver paranoico, você não pode ser pego desprevenido e pode sempre agir em situações de emboscada, susto ou ameaça repentina. Enquanto estiver paranoico, quando recuperaria Sanidade, recupera apenas metade do valor que recuperaria, arredondado para cima. Durante seu próximo descanso, escolha entre recuperar PV ou PD, não os dois.',
  },
  {
    resultado: '10',
    nome: 'Ansiedade',
    descricaoNarrativa:
      'Para você, qualquer pequeno erro parece devastador. Cada falha mínima parece anunciar uma catástrofe inevitável.',
    descricaoMecanica:
      'Enquanto estiver ansioso, sempre que um dos seus dados naturais rolar 1, o teste falha automaticamente, mesmo que o total fosse suficiente. Se o teste já falharia, a falha gera uma complicação adicional.',
  },
  {
    resultado: '11',
    nome: 'Desespero',
    descricaoNarrativa:
      'Você treme, hesita e perde precisão. A sensação de que nada vai dar certo contamina seus movimentos.',
    descricaoMecanica:
      'Enquanto estiver desesperado, todos os seus dados de Perícia são reduzidos em 1 passo.',
  },
  {
    resultado: '12',
    nome: 'Alucinação',
    descricaoNarrativa:
      'Você vê, ouve, sente ou lembra coisas que não estão acontecendo. Para você, essas percepções parecem reais.',
    descricaoMecanica:
      'Enquanto estiver alucinando, o mestre pode inserir alucinações na cena como se fossem reais para você. Você não pode verificar diretamente se algo é alucinação; para o personagem, aquilo é real. Sempre que você interagir com uma alucinação como se ela fosse real, o mestre aplica uma consequência apropriada: perder 1 PD, desperdiçar uma ação, deslocar-se para uma posição ruim, chamar atenção, gastar munição, danificar um objeto, revelar informação, separar-se do grupo ou sofrer uma complicação narrativa. A alucinação não pode, sozinha, causar dano direto inevitável, mas pode levar você a uma decisão perigosa.',
  },
  {
    resultado: '13',
    nome: 'Confusão',
    descricaoNarrativa:
      'Sua intenção, impulso e raciocínio se misturam. Você tenta agir, mas sua mente escolhe o caminho errado.',
    descricaoMecanica:
      'Enquanto estiver confuso, sempre que fizer um teste sob pressão, jogue uma moeda. Em cara, use o atributo normalmente. Em coroa, o atributo é trocado por seu par confuso: Inteligência ↔ Presença e Força ↔ Agilidade. Se o teste usaria Vigor, não troque o atributo.',
  },
  {
    resultado: '14',
    nome: 'Pânico Somático',
    descricaoNarrativa:
      'O medo fecha sua garganta. Seu coração bate rápido demais, seu peito aperta e respirar parece difícil.',
    descricaoMecanica:
      'Reduza em 2 passos sua Fortitude. Além disso, você não consegue gritar, falar frases longas, manter conversas calmas ou realizar ações que exijam respiração controlada.',
  },
  {
    resultado: '15',
    nome: 'Paralisia',
    descricaoNarrativa:
      'Você congela. Seus músculos endurecem, e até o menor movimento parece exigir uma força impossível.',
    descricaoMecanica:
      'Você fica incapaz de agir por 1 rodada ou por alguns segundos críticos. Depois, sempre que quiser se mover, precisa passar em um teste de Vontade para vencer a rigidez dos seus músculos.',
  },
  {
    resultado: '16',
    nome: 'Egoísmo de Sobrevivente',
    descricaoNarrativa:
      'Você precisa sobreviver. Todo o resto parece secundário diante da urgência de continuar vivo.',
    descricaoMecanica:
      'Até o fim da cena, você não pode gastar suas ações ou recursos para ajudar outro personagem se isso colocar você em risco direto.',
  },
  {
    resultado: '17',
    nome: 'Desmaio',
    descricaoNarrativa:
      'O medo gera um choque na sua mente, que se desliga para se proteger.',
    descricaoMecanica:
      'Você cai inconsciente.',
  },
  {
    resultado: '18',
    nome: 'Trauma',
    descricaoNarrativa:
      'O medo deixa uma marca. Algo naquela cena se prende à sua mente e passa a fazer parte de você.',
    descricaoMecanica:
      'Você fica paralisado por 1 rodada e ganha uma Fobia ou Mania temporária relacionada à cena até o fim da missão. Enquanto essa Fobia ou Mania temporária estiver ativa, ela pode ser invocada normalmente, mas só concede Esperança uma vez por missão.',
  },
  {
    resultado: '19',
    nome: 'Dissociação',
    descricaoNarrativa:
      'O medo ultrapassa sua capacidade de reagir. Você se sente distante do próprio corpo, como se estivesse assistindo à cena acontecer com outra pessoa.',
    descricaoMecanica:
      'Até o fim da cena ou ser acalmado, você não reconhece a fonte do medo como ameaça, a menos que ela cause dano direto a você. Enquanto estiver dissociado, sofre -5 em testes para reagir com urgência, fugir, pedir ajuda, alertar aliados, proteger alguém ou interromper a fonte do medo. Você recebe +3 em testes para suportar dor, encarar cenas horríveis, permanecer imóvel, mentir sobre seu estado emocional ou observar a fonte do medo sem demonstrar reação. Se alguém chamar seu nome, tocar em você ou te confrontar diretamente, você pode fazer um teste de Vontade para ignorar a Dissociação naquela rodada.',
  },
  {
    resultado: '20+',
    nome: 'Choque Sistêmico',
    descricaoNarrativa:
      'O medo domina corpo e mente. Sua consciência entra em colapso e seu corpo simplesmente deixa de responder.',
    descricaoMecanica:
      'Você cai incapaz de agir. Precisa ser estabilizado, removido da fonte do medo ou acalmado por outro personagem. Quando se recupera, volta com 1 Sanidade, mas não recupera PV, PD ou Cargas Defensivas com descanso curto até o fim da cena.',
  },
];

export default fearEffects;