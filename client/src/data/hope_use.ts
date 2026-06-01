export interface HopeUse {
  id: string;
  nome: string;
  custo: number;
  efeito: string;
}

const hopeUses: HopeUse[] = [
  {
    id: 'h001',
    nome: 'Forçar a Sorte',
    custo: 1,
    efeito:
      'Após rolar um teste, você pode rerrolar um dos dados. Você deve ficar com o novo resultado.',
  },
  {
    id: 'h002',
    nome: 'Editar a Cena',
    custo: 1,
    efeito:
      'Você pode propor uma alteração pequena e plausível na cena para conseguir alguma vantagem. O mestre pode aprovar, negar ou ajustar a proposta.',
  },
  {
    id: 'h003',
    nome: 'Epifania',
    custo: 1,
    efeito:
      'Você pode fazer uma pergunta útil ao mestre ou receber uma dica sobre a cena, criatura, pista ou perigo atual.',
  },
  {
    id: 'h004',
    nome: 'Reação Instintiva',
    custo: 1,
    efeito:
      'Você pode usar uma ação defensiva como se tivesse gasto 1 Carga Defensiva.',
  },
  {
    id: 'h005',
    nome: 'Determinação',
    custo: 1,
    efeito:
      'Você pode remover uma condição de si mesmo.',
  },
  {
    id: 'h006',
    nome: 'Respirar Fundo',
    custo: 1,
    efeito:
      'Quando sofrer dano mental, você pode reduzir esse dano pela metade, arredondado para cima. Dano mental de medo ainda causa no mínimo 1 ponto de dano.',
  },
  {
    id: 'h007',
    nome: 'Fazer Sugestão',
    custo: 1,
    efeito:
      'Você pode propor um uso alternativo de Esperança. O mestre decide se aceita, ajusta ou exige um custo maior.',
  },
];

export default hopeUses;