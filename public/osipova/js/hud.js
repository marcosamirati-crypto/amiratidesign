import * as THREE from 'three';
import { CENA } from './config.js';

const FONTE = '"Stack Sans Headline", system-ui, sans-serif';
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const suave = (x) => x * x * (3 - 2 * x);
const PX = 420; // pixels de textura por metro

function desenhar(canvas, linhas, fundo) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  if (fundo) {
    ctx.fillStyle = fundo.cor;
    const r = fundo.raio;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(2, 2, w - 4, h - 4, r); else ctx.rect(2, 2, w - 4, h - 4);
    ctx.fill();
    if (fundo.borda) { ctx.strokeStyle = fundo.borda; ctx.lineWidth = 3; ctx.stroke(); }
  }
  const total = linhas.reduce((s, l) => s + l.s * 1.25, 0);
  let y = (h - total) / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const l of linhas) {
    ctx.font = `${l.w || 500} ${l.s}px ${FONTE}`;
    ctx.fillStyle = l.c || '#fff';
    ctx.globalAlpha = l.a ?? 1;
    let txt = l.t;
    if (l.ls) txt = txt.split('').join(String.fromCharCode(8202));
    ctx.fillText(txt, w / 2, y + l.s * 0.62);
    y += l.s * 1.25;
  }
  ctx.globalAlpha = 1;
}

function painel(largura, altura, linhas, fundo) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(largura * PX);
  canvas.height = Math.round(altura * PX);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  desenhar(canvas, linhas, fundo);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(largura, altura), mat);
  mesh.renderOrder = 100;
  return { mesh, canvas, tex, mat, linhas, fundo };
}

// Mensagens, dicas e o menu (selecionado olhando fixo por ~1 segundo).
export class Hud {
  constructor(scene, aoEscolher) {
    this.aoEscolher = aoEscolher;
    this.grupo = new THREE.Group();
    scene.add(this.grupo);
    this.ray = new THREE.Raycaster();
    this.tmp = new THREE.Vector3();
    this.pos = new THREE.Vector3();

    // mensagem central
    this.msg = painel(3.4, 1.7, [{ t: '', s: 40 }]);
    this.msg.mesh.position.set(0, CENA.olho, -2.3);
    this.msg.mesh.visible = false;
    this.grupo.add(this.msg.mesh);
    this.msgTxt = '';

    // dica discreta, ao nível do chão
    this.dica = painel(3.0, 0.5, [{ t: '↓  olhe para baixo para abrir o menu', s: 52, w: 400, a: 0.8 }]);
    this.dica.mesh.position.set(0, 0.55, -2.4);
    this.dica.mesh.visible = false;
    this.grupo.add(this.dica.mesh);
    this.dicaAte = 0;

    // botões
    this.botoes = [];
    const defs = [
      { id: 'pausa', rot: (c) => (c.pausado ? 'CONTINUAR' : 'PAUSAR') },
      { id: 'centro', rot: () => 'CENTRALIZAR' },
      { id: 'modo', rot: (c) => c.nomeModo.toUpperCase() },
      { id: 'pular', rot: (c) => (c.fase === 'fim' ? 'REVER' : 'PULAR') },
      { id: 'sair', rot: () => 'SAIR' },
    ];
    const raioMenu = 1.9, yMenu = 0.4;
    const az = [-56, -28, 0, 28, 56];
    defs.forEach((d, i) => {
      const b = painel(0.9, 0.42, [{ t: d.rot({ pausado: false, nomeModo: 'orbita' }), s: 42, w: 600 }],
        { cor: 'rgba(8,10,16,0.82)', raio: 36, borda: 'rgba(190,212,255,0.55)' });
      const a = (az[i] * Math.PI) / 180;
      b.mesh.position.set(-raioMenu * Math.sin(a), yMenu, -raioMenu * Math.cos(a));
      b.mesh.lookAt(0, CENA.olho * 0.8, 0);
      b.id = d.id; b.rot = d.rot; b.txt = '';
      const barra = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.03),
        new THREE.MeshBasicMaterial({ color: 0xbcd4ff, transparent: true, depthTest: false, depthWrite: false }));
      barra.position.set(0, -0.16, 0.002);
      barra.scale.x = 0.0001;
      barra.renderOrder = 101;
      b.mesh.add(barra);
      b.barra = barra;
      this.grupo.add(b.mesh);
      this.botoes.push(b);
    });
    this.menuAlpha = 0;

    // mira
    this.mira = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uP: { value: 0 }, uA: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uP; uniform float uA;
        void main(){
          vec2 p = vUv - 0.5; float r = length(p) * 2.0;
          float t = fract(atan(p.x, p.y) / 6.2831853 + 1.0);
          float anel = smoothstep(0.84, 0.8, r) * smoothstep(0.62, 0.66, r);
          float prog = anel * step(t, uP);
          float ponto = smoothstep(0.1, 0.07, r);
          float a = (anel * 0.35 + prog * 0.75 + ponto * 0.9) * uA;
          gl_FragColor = vec4(vec3(0.9, 0.95, 1.0), a);
        }`,
    }));
    this.mira.renderOrder = 102;
    this.mira.visible = false;
    this.grupo.add(this.mira);

    this.alvo = null;
    this.dwell = 0;
    this.travado = null;
    this.DWELL = 1.4;
  }

  mensagem(linhas, placa = false) {
    if (!linhas) { this.msg.mesh.visible = false; this.msgTxt = ''; return; }
    const chave = JSON.stringify(linhas) + placa;
    if (chave !== this.msgTxt) {
      this.msgTxt = chave;
      this.msg.linhas = linhas;
      this.msg.fundo = placa ? { cor: 'rgba(0,0,0,0.9)', raio: 70, borda: 'rgba(190,212,255,0.4)' } : null;
      desenhar(this.msg.canvas, linhas, this.msg.fundo);
      this.msg.tex.needsUpdate = true;
    }
    this.msg.mesh.visible = true;
  }

  mostrarDica(segundos, agora) { this.dicaAte = agora + segundos; }

  recarregarFonte() {
    for (const p of [this.msg, this.dica, ...this.botoes]) { desenhar(p.canvas, p.linhas, p.fundo); p.tex.needsUpdate = true; }
    this.msgTxt = '';
  }

  atualizar(q, posOlho, dt, agora, ctx) {
    // direção do olhar
    const frente = this.tmp.set(0, 0, -1).applyQuaternion(q);
    const pitch = Math.asin(THREE.MathUtils.clamp(frente.y, -1, 1));
    const menuOk = ctx.menuLiberado;
    const alvoAlpha = menuOk ? suave(clamp01((-pitch - 0.3) / 0.25)) : 0;
    this.menuAlpha += (alvoAlpha - this.menuAlpha) * Math.min(1, dt * 10);

    this.dica.mesh.visible = agora < this.dicaAte && this.menuAlpha < 0.2;
    this.dica.mat.opacity = this.dica.mesh.visible ? clamp01(this.dicaAte - agora) : 0;

    // raio do centro da tela
    let tocado = null;
    if (this.menuAlpha > 0.6) {
      this.ray.set(posOlho, frente.clone());
      const hits = this.ray.intersectObjects(this.botoes.map((b) => b.mesh), false);
      if (hits.length) tocado = this.botoes.find((b) => b.mesh === hits[0].object);
    }
    if (tocado !== this.alvo) { this.alvo = tocado; this.dwell = 0; if (!tocado) this.travado = null; }
    if (this.alvo && this.alvo.id !== this.travado) {
      this.dwell += dt;
      if (this.dwell >= this.DWELL) {
        const id = this.alvo.id;
        this.travado = id;
        this.dwell = 0;
        this.aoEscolher(id);
      }
    } else if (!this.alvo) this.dwell = 0;

    for (const b of this.botoes) {
      const txt = b.rot(ctx);
      if (txt !== b.txt) {
        b.txt = txt;
        b.linhas = [{ t: txt, s: txt.length > 10 ? 38 : 44, w: 600 }];
        desenhar(b.canvas, b.linhas, b.fundo);
        b.tex.needsUpdate = true;
      }
      const hover = b === this.alvo;
      b.mesh.visible = this.menuAlpha > 0.02;
      b.mat.opacity = this.menuAlpha * (hover ? 1 : 0.8);
      b.mesh.scale.setScalar(hover ? 1.07 : 1);
      const prog = hover ? Math.max(0.0001, this.dwell / this.DWELL) : 0.0001;
      b.barra.scale.x = prog;
      b.barra.position.x = -0.4 + 0.4 * prog;
      b.barra.material.opacity = this.menuAlpha;
    }

    // mira (fica no meio da tela)
    this.mira.visible = this.menuAlpha > 0.25;
    if (this.mira.visible) {
      this.mira.position.copy(posOlho).addScaledVector(frente, 1.4);
      this.mira.quaternion.copy(q);
      this.mira.material.uniforms.uA.value = this.menuAlpha;
      this.mira.material.uniforms.uP.value = this.alvo ? this.dwell / this.DWELL : 0;
    }
  }
}
