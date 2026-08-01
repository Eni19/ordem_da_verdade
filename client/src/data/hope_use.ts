export interface HopeUse {
  id: string;
  nome: string;
  custo: number;
  efeito: string;
  coord: { x: number; y: number };
}

// Coordenadas em pixels sobre a imagem original (client/public/hope.png, 1200x2133)
const hopeUses: HopeUse[] = [
  {
    id: 'h001',
    nome: 'Forçar a Sorte',
    custo: 1,
    efeito:
      'Após rolar um teste, você pode rerrolar um dos dados. Você deve ficar com o novo resultado.',
    coord: { x: 632, y: 511 },
  },
  {
    id: 'h002',
    nome: 'Editar a Cena',
    custo: 1,
    efeito:
      'Você pode propor uma alteração pequena e plausível na cena para conseguir alguma vantagem. O mestre pode aprovar, negar ou ajustar a proposta.',
    coord: { x: 458, y: 777 },
  },
  {
    id: 'h003',
    nome: 'Epifania',
    custo: 1,
    efeito:
      'Você pode fazer uma pergunta útil ao mestre ou receber uma dica sobre a cena, criatura, pista ou perigo atual.',
    coord: { x: 839, y: 981 },
  },
  {
    id: 'h004',
    nome: 'Reação Instintiva',
    custo: 1,
    efeito:
      'Você pode usar uma ação defensiva como se tivesse gasto 1 Carga Defensiva.',
    coord: { x: 470, y: 1118 },
  },
  {
    id: 'h006',
    nome: 'Respirar Fundo',
    custo: 1,
    efeito:
      'Quando sofrer dano mental, você pode reduzir esse dano pela metade, arredondado para cima. Dano mental de medo ainda causa no mínimo 1 ponto de dano.',
    coord: { x: 781, y: 1407 },
  },
  {
    id: 'h007',
    nome: 'Fazer Sugestão',
    custo: 1,
    efeito:
      'Você pode propor um uso alternativo de Esperança. O mestre decide se aceita, ajusta ou exige um custo maior.',
    coord: { x: 494, y: 1663 },
  },
];

export const HOPE_IMAGE_WIDTH = 1200;
export const HOPE_IMAGE_HEIGHT = 2133;

export default hopeUses;
