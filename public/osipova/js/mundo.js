import * as THREE from 'three';
import { ANEL, BRILHO, CENA, TEMPO, VOLTAS_CARROSSEL, VOLTAS_ORBITA } from './config.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const rampa = (t, a, b) => clamp01((t - a) / (b - a));
const suave = (x) => x * x * (3 - 2 * x);
const DIR = 1; // 1 = a bailarina gira para a sua esquerda

export function brilhoEm(t) {
  const i = Math.max(0, Math.min(BRILHO.length - 2, Math.floor(t)));
  const f = clamp01(t - i);
  return BRILHO[i] * (1 - f) + BRILHO[i + 1] * f;
}

// 0 -> 1 durante a dança (começa e termina devagar)
const progresso = (t) => suave(rampa(t, TEMPO.danca_in, TEMPO.danca_out));

export function alphaTela(modo, t) {
  if (modo === 'cinema') return 1;
  if (t < TEMPO.danca_in) return 1;
  if (t < TEMPO.tela_some) return 1 - suave(rampa(t, TEMPO.danca_in, TEMPO.tela_some));
  if (t < TEMPO.anel_some) return 0;
  return suave(rampa(t, TEMPO.anel_some, TEMPO.cartao_in + 0.4));
}

export function alphaAnel(modo, t) {
  if (modo === 'cinema') return 0;
  const entra = suave(rampa(t, TEMPO.danca_in, TEMPO.danca_in + 1.0));
  const sai = 1 - suave(rampa(t, TEMPO.anel_some, TEMPO.anel_some + 0.8));
  return entra * sai;
}

const VERT_UV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

const base = {
  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
};

export class Mundo {
  constructor(texturaVideo, captura) {
    this.captura = captura;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    const { raio: R, olho, alturaBailarina, pes, corpo, recorte } = CENA;
    const H = alturaBailarina / corpo;          // altura do quadro do vídeo, em metros
    const W = H * (16 / 9);
    const cy = H * (pes - 0.5);                 // centro do quadro: os pés ficam no chão
    this.H = H; this.W = W; this.cy = cy;

    this.grupoTela = new THREE.Group();
    this.scene.add(this.grupoTela);

    // ── tela de cinema ──────────────────────────────────────────────
    this.matTela = new THREE.ShaderMaterial({
      ...base,
      uniforms: { uMap: { value: texturaVideo }, uAlpha: { value: 1 }, uLift: { value: 0.03 } },
      vertexShader: VERT_UV,
      fragmentShader: `varying vec2 vUv; uniform sampler2D uMap; uniform float uAlpha; uniform float uLift;
        void main(){
          vec3 c = texture2D(uMap, vUv).rgb;
          float bordaX = smoothstep(0.0, 0.004, vUv.x) * smoothstep(0.0, 0.004, 1.0 - vUv.x);
          float bordaY = smoothstep(0.0, 0.006, vUv.y) * smoothstep(0.0, 0.006, 1.0 - vUv.y);
          vec3 base = vec3(uLift * 0.9, uLift * 0.96, uLift) * bordaX * bordaY;
          gl_FragColor = vec4(c + base, uAlpha);
        }`,
    });
    this.tela = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.matTela);
    this.tela.position.set(0, cy, -R);
    this.grupoTela.add(this.tela);

    // brilho suave em volta da tela
    this.matHalo = new THREE.ShaderMaterial({
      ...base,
      uniforms: { uAlpha: { value: 0.1 }, uSize: { value: new THREE.Vector2(W * 0.5, H * 0.5) } },
      vertexShader: VERT_UV,
      fragmentShader: `varying vec2 vUv; uniform float uAlpha; uniform vec2 uSize;
        void main(){
          vec2 p = (vUv - 0.5) * uSize * 2.0 * vec2(1.7, 1.9);
          vec2 d = abs(p) - uSize;
          float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
          float a = exp(-max(dist, 0.0) * 1.1) * smoothstep(1.0, 0.7, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0);
          gl_FragColor = vec4(vec3(0.55, 0.68, 1.0) * a, uAlpha);
        }`,
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.7, H * 1.9), this.matHalo);
    halo.position.set(0, cy, -R - 0.05);
    this.grupoTela.add(halo);

    // cortinas nas laterais, iluminadas pela luz da tela
    this.matCortina = new THREE.ShaderMaterial({
      ...base,
      uniforms: { uAlpha: { value: 0.1 }, uLado: { value: 1 } },
      vertexShader: VERT_UV,
      fragmentShader: `varying vec2 vUv; uniform float uAlpha; uniform float uLado;
        void main(){
          float x = uLado > 0.0 ? vUv.x : 1.0 - vUv.x;     // 1 = lado da tela
          float dobras = 0.55 + 0.45 * sin(vUv.x * 6.2831853 * 6.0 + sin(vUv.y * 3.0) * 0.8);
          float luz = pow(x, 2.2) * dobras;
          float v = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
          gl_FragColor = vec4(vec3(0.42, 0.5, 0.78) * luz * v, uAlpha);
        }`,
    });
    const largCortina = 3.2, altCortina = 7.5;
    for (const lado of [-1, 1]) {
      const mat = this.matCortina.clone();
      mat.uniforms = { uAlpha: this.matCortina.uniforms.uAlpha, uLado: { value: -lado } };
      const c = new THREE.Mesh(new THREE.PlaneGeometry(largCortina, altCortina), mat);
      c.position.set(lado * (W / 2 + largCortina / 2 - 0.15), altCortina / 2 - 0.4, -R - 0.2);
      this.grupoTela.add(c);
    }

    // feixe de luz do projetor (passa por cima da sua cabeça)
    const apex = new THREE.Vector3(0, olho + 1.5, 4.5);
    const cantos = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => new THREE.Vector3(u * W / 2, cy + v * H / 2, -R));
    const pos = [apex, ...cantos].flatMap((p) => [p.x, p.y, p.z]);
    const aT = [0, 1, 1, 1, 1];
    const ind = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1];
    const gf = new THREE.BufferGeometry();
    gf.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gf.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
    gf.setIndex(ind);
    this.matFeixe = new THREE.ShaderMaterial({
      ...base,
      side: THREE.DoubleSide,
      uniforms: { uAlpha: { value: 0.05 } },
      vertexShader: 'attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying float vT; uniform float uAlpha; void main(){ gl_FragColor = vec4(vec3(0.7, 0.8, 1.0) * (1.0 - vT * 0.6), uAlpha); }',
    });
    this.grupoTela.add(new THREE.Mesh(gf, this.matFeixe));
    this.apex = apex;

    // ── anel de bailarinas ─────────────────────────────────────────
    this.grupoAnel = new THREE.Group();
    this.scene.add(this.grupoAnel);
    const largura = (recorte[1] - recorte[0]) * W;
    const geoFatia = new THREE.PlaneGeometry(1, 1);
    this.fatias = [];
    for (let k = 0; k < ANEL.fatias; k++) {
      const mat = new THREE.ShaderMaterial({
        ...base,
        uniforms: { uMap: { value: null }, uAlpha: { value: 1 }, uBlack: { value: 0.05 } },
        vertexShader: VERT_UV,
        fragmentShader: `varying vec2 vUv; uniform sampler2D uMap; uniform float uAlpha; uniform float uBlack;
          void main(){
            vec3 c = texture2D(uMap, vUv).rgb;
            c = max(c - vec3(uBlack), vec3(0.0)) / (1.0 - uBlack);
            float e = smoothstep(0.0, 0.17, vUv.x) * smoothstep(0.0, 0.17, 1.0 - vUv.x)
                    * smoothstep(0.0, 0.03, vUv.y) * smoothstep(0.0, 0.05, 1.0 - vUv.y);
            gl_FragColor = vec4(c * e, uAlpha);
          }`,
      });
      const m = new THREE.Mesh(geoFatia, mat);
      m.scale.set(largura, H, 1);
      m.visible = false;
      this.grupoAnel.add(m);
      this.fatias.push(m);
    }

    // plataforma giratória no chão
    this.matChao = new THREE.ShaderMaterial({
      ...base,
      uniforms: { uR: { value: R }, uRot: { value: 0 }, uAlpha: { value: 0 }, uTicks: { value: 1 } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vP; uniform float uR; uniform float uRot; uniform float uAlpha; uniform float uTicks;
        const float TAU = 6.2831853;
        void main(){
          float r = length(vP);
          float ang = atan(-vP.x, vP.y);
          float anel = smoothstep(0.05, 0.0, abs(r - (uR - 0.45))) * 0.5;
          float anel2 = smoothstep(0.025, 0.0, abs(r - (uR - 1.3))) * 0.14;
          float seg = TAU / 32.0;
          float f = abs(fract((ang - uRot) / seg + 0.5) - 0.5) * seg * r;
          float risco = smoothstep(0.035, 0.0, f) * smoothstep(0.45, 0.0, abs(r - (uR - 0.7))) * uTicks * 0.55;
          float disco = smoothstep(uR + 0.4, uR - 3.5, r) * 0.05;
          float a = anel + anel2 + risco + disco;
          gl_FragColor = vec4(vec3(0.62, 0.76, 1.0) * a, uAlpha);
        }`,
    });
    const chao = new THREE.Mesh(new THREE.PlaneGeometry((R + 2) * 2, (R + 2) * 2), this.matChao);
    chao.rotation.x = -Math.PI / 2;
    chao.position.y = 0.01;
    this.grupoAnel.add(chao);

    // ── poeira no ar ───────────────────────────────────────────────
    const N = 900;
    const p = new Float32Array(N * 3);
    const s = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let x, y, z;
      if (i < 600) {                      // espalhada pela sala
        const a = Math.random() * TAU;
        const r = 1.2 + Math.random() * 8;
        x = Math.cos(a) * r; z = Math.sin(a) * r; y = Math.random() * 5.5;
      } else {                            // concentrada no feixe do projetor
        const t = Math.random();
        const u = (Math.random() * 2 - 1) * 0.9, v = (Math.random() * 2 - 1) * 0.9;
        const alvo = new THREE.Vector3(u * W / 2, cy + v * H / 2, -R);
        const q = apex.clone().lerp(alvo, t);
        x = q.x; y = q.y; z = q.z;
      }
      p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
      s[i] = Math.random();
    }
    const gp = new THREE.BufferGeometry();
    gp.setAttribute('position', new THREE.BufferAttribute(p, 3));
    gp.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    this.matPoeira = new THREE.ShaderMaterial({
      ...base,
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uAlpha: { value: 0.7 } },
      vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPx; varying float vA;
        void main(){
          vec3 q = position;
          q.x += sin(uTime * 0.13 + aSeed * 17.0) * 0.35;
          q.y += sin(uTime * 0.11 + aSeed * 9.0) * 0.25;
          q.z += cos(uTime * 0.12 + aSeed * 13.0) * 0.35;
          vec4 mv = modelViewMatrix * vec4(q, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(uPx * (1.4 + 1.8 * fract(aSeed * 7.0)) * 5.0 / max(-mv.z, 1.0), 1.0, 7.0 * uPx);
          vA = (0.6 + 0.4 * sin(uTime * 0.7 + aSeed * 40.0)) * (0.25 + 0.75 * fract(aSeed * 3.0));
        }`,
      fragmentShader: `varying float vA; uniform float uAlpha;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(0.75, 0.85, 1.0), a * vA * uAlpha);
        }`,
    });
    this.poeira = new THREE.Points(gp, this.matPoeira);
    this.poeira.frustumCulled = false;
    this.scene.add(this.poeira);

    this.modo = 'orbita';
    this.alphas = { tela: 1, anel: 0 };
  }

  setPixelScale(px) { this.matPoeira.uniforms.uPx.value = px; }

  // posição de uma fatia: ângulo 0 = bem à sua frente; positivo = para a esquerda
  _colocar(k, ang, alpha, tex) {
    const m = this.fatias[k];
    if (!tex || alpha < 0.003) { m.visible = false; return; }
    const R = CENA.raio;
    m.visible = true;
    m.position.set(-R * Math.sin(ang), this.cy, -R * Math.cos(ang));
    m.rotation.y = ang;
    const u = m.material.uniforms;
    u.uMap.value = tex;
    u.uAlpha.value = alpha;
  }

  atualizar(t, modo, relogio) {
    this.modo = modo;
    const aT = alphaTela(modo, t);
    const aA = alphaAnel(modo, t);
    this.alphas.tela = aT; this.alphas.anel = aA;

    // tela de cinema + luz
    const lum = brilhoEm(t);
    this.grupoTela.visible = aT > 0.002;
    this.matTela.uniforms.uAlpha.value = aT;
    this.matTela.uniforms.uLift.value = 0.03 * aT;
    this.matHalo.uniforms.uAlpha.value = aT * (0.03 + 0.12 * clamp01(lum));
    this.matFeixe.uniforms.uAlpha.value = aT * (0.008 + 0.04 * clamp01(lum));
    this.matCortina.uniforms.uAlpha.value = aT * (0.05 + 0.55 * clamp01(lum));
    this.matPoeira.uniforms.uTime.value = relogio;
    this.matPoeira.uniforms.uAlpha.value = 0.55 + 0.35 * clamp01(lum) * aT;

    // anel
    this.grupoAnel.visible = aA > 0.002;
    for (const m of this.fatias) m.visible = false;
    if (aA > 0.002) {
      if (modo === 'carrossel') {
        const lider = DIR * TAU * VOLTAS_CARROSSEL * progresso(t);
        const passo = TAU / ANEL.fatias;
        for (let k = 0; k < ANEL.fatias; k++) {
          const tex = this.captura.textura(k * ANEL.atrasoCarrossel);
          const queda = 1 - 0.55 * Math.pow(k / (ANEL.fatias - 1), 0.7);
          this._colocar(k, lider - DIR * k * passo, aA * queda, tex);
        }
        this.matChao.uniforms.uRot.value = lider;
        this.matChao.uniforms.uTicks.value = 1;
      } else {
        // órbita: a bailarina corre em volta de você; atrás dela fica um rastro
        const ecos = ANEL.ecosOrbita;
        const angLider = DIR * TAU * VOLTAS_ORBITA * progresso(t);
        for (let k = 0; k <= ecos; k++) {
          const tk = t - k * ANEL.atrasoOrbita * 0.04;
          const ang = DIR * TAU * VOLTAS_ORBITA * progresso(tk);
          let queda = 1;
          if (k > 0) {
            // o eco só aparece quando já se afastou dela (parada, não há rastro)
            let sep = Math.abs(((ang - angLider + Math.PI) % TAU + TAU) % TAU - Math.PI);
            queda = 0.5 * Math.pow(1 - k / (ecos + 1), 1.4) * suave(clamp01((sep - 0.05) / 0.17));
          }
          this._colocar(k, ang, aA * queda, this.captura.textura(k * ANEL.atrasoOrbita));
        }
        this.matChao.uniforms.uRot.value = 0;
        this.matChao.uniforms.uTicks.value = 0;
      }
      this.matChao.uniforms.uAlpha.value = aA * 0.9;
    }
  }
}
