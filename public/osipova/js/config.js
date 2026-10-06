// Tudo o que você pode querer mudar fica neste arquivo.

export const OBRA = {
  titulo: 'IA mata Osipova',
  subtitulo: 'O Lago dos Cisnes · 32 fouettés',
  creditos: 'TCC · UFC · Marcos Amirati',
  video: 'media/osipova.mp4',
};

// Linha do tempo do vídeo, em segundos (medida quadro a quadro).
export const TEMPO = {
  danca_in: 17.0,     // o título sai e a bailarina aparece
  danca_out: 53.8,    // ela termina sentada (já monstro)
  anel_some: 58.3,    // o anel de cópias começa a sumir
  cartao_in: 59.0,    // a tela de cinema volta para o cartão "IA"
  tela_some: 18.2,    // a tela de cinema termina de sumir (nos modos de anel)
};

// Quantas voltas a bailarina dá ao seu redor no modo "Órbita".
export const VOLTAS_ORBITA = 32;
// Quantas voltas o anel inteiro dá no modo "Carrossel" (ele é bem lento).
export const VOLTAS_CARROSSEL = 1;

export const CENA = {
  olho: 1.6,            // altura dos olhos, em metros
  raio: 5.2,            // distância da bailarina / da tela
  alturaBailarina: 2.3, // tamanho da bailarina, em metros
  // onde a bailarina fica dentro do quadro do vídeo (0 = topo, 1 = base)
  pes: 0.86,
  corpo: 0.62,
  // faixa horizontal do quadro onde ela dança (0 a 1)
  recorte: [0.2, 0.8],
};

export const ANEL = {
  fatias: 32,           // 32 cópias: uma por fouetté
  atrasoCarrossel: 3,   // quadros de diferença entre uma cópia e a vizinha
  ecosOrbita: 16,       // rastro atrás da bailarina no modo Órbita
  atrasoOrbita: 1,
  larguraRT: 320,
  alturaRT: 300,
};

export const MODOS = {
  orbita:    { nome: 'Órbita',    curto: 'Ela gira 32 vezes ao seu redor' },
  carrossel: { nome: 'Carrossel', curto: '32 cópias dela em volta de você' },
  cinema:    { nome: 'Cinema',    curto: 'O vídeo numa tela grande' },
};
export const ORDEM_MODOS = ['orbita', 'carrossel', 'cinema'];

// Brilho médio do vídeo, 1 por segundo (usado só para a luz do projetor).
export const BRILHO = [51,50,49.4,48.5,48,46.4,45,43.5,41.8,39.9,38,36.5,34.2,31.6,28.6,24.1,18.3,9.7,10.6,10.4,
  9.3,8.3,7.5,5.6,2.1,5.2,10.5,12.9,11.8,12.7,13.6,11.8,11.3,11.7,11.7,11.1,12.2,10,9.9,10.3,
  9.3,11.3,10.2,10.9,18.6,11.2,9.5,11.2,10.8,11.3,11.4,11,12.1,10.4,2,2,2,2,2,2,47.1,47.1,47.1,47.1].map((v) => v / 50);

// Ajustes padrão do óculos (dá para mudar na tela inicial).
export const OCULOS_PADRAO = {
  distorcao: 1,   // 0 = sem correção, 1 = padrão, 2 = forte
  separacao: 0,   // aproxima (+) ou afasta (−) o centro dos dois olhos
  zoom: 1,        // aproxima ou afasta a imagem
};
