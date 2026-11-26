// Ganchos da plataforma. Na página do Claude ficam vazios; no site aberto,
// src/site.js os preenche (hospedar a mesa, convidar, conectar, backup).
export const platform = {
  site: false,
  hostSession: null,   // (code) => começa a servir a mesa a partir deste aparelho
  inviteLink: null,    // (code) => link do convite com a impressão digital do Mestre
  connect: null,       // (code, fp) => Promise<boolean> conecta o jogador ao Mestre
  connectProblem: null, // () => { text, detail } por que a última conexão falhou
  onLinkState: null,   // (fn) => avisa o Mestre se o aparelho dele está alcançável
  toMaster: null,      // () => vira Mestre neste aparelho
  toPlayer: null,      // () => volta para a entrada de jogador
  exportSession: null, // (sid) => objeto de backup
  importBackup: null,  // (obj) => restaura
  seedCodex: null,     // () => carrega bíblia e bestiário do servidor
  testLink: null,      // (code) => link para abrir um jogador de teste em outra aba
  storageWarning: null,
};
