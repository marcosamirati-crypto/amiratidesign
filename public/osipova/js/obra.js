import * as THREE from 'three';
import { ANEL, CENA } from './config.js';

// Carrega o vídeo inteiro antes de começar (assim não trava no meio da obra,
// e depois de carregado ele funciona mesmo se a internet cair).
export class Obra {
  constructor(url) {
    this.url = url;
    this.video = null;
    this.textura = null;
    this.novoQuadro = false;
  }

  async carregar(aoProgredir) {
    let src = this.url;
    try {
      const resp = await fetch(this.url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const total = Number(resp.headers.get('Content-Length')) || 0;
      const leitor = resp.body.getReader();
      const partes = [];
      let lido = 0;
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        partes.push(value);
        lido += value.length;
        aoProgredir?.(total ? lido / total : -1);
      }
      src = URL.createObjectURL(new Blob(partes, { type: 'video/mp4' }));
    } catch (e) {
      console.warn('Carregamento direto falhou, usando o arquivo normal.', e);
    }

    const v = document.createElement('video');
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.preload = 'auto';
    v.loop = false;
    v.crossOrigin = 'anonymous';
    v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;';
    v.src = src;
    document.body.appendChild(v);
    this.video = v;

    await new Promise((ok) => {
      const fim = () => ok();
      v.addEventListener('loadeddata', fim, { once: true });
      v.addEventListener('canplay', fim, { once: true });
      v.addEventListener('error', fim, { once: true });
      setTimeout(fim, 6000);
      v.load();
    });
    aoProgredir?.(1);

    const t = new THREE.VideoTexture(v);
    t.colorSpace = THREE.NoColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    this.textura = t;

    // Avisa a cada quadro novo do vídeo (para o buffer de quadros do anel).
    if ('requestVideoFrameCallback' in v) {
      const laco = () => {
        this.novoQuadro = true;
        v.requestVideoFrameCallback(laco);
      };
      v.requestVideoFrameCallback(laco);
      this.temRVFC = true;
    }
    this._ultimo = 0;
  }

  get tempo() { return this.video ? this.video.currentTime : 0; }
  get duracao() { return this.video && isFinite(this.video.duration) ? this.video.duration : 63.3; }
  get tocando() { return !!this.video && !this.video.paused && !this.video.ended; }

  // Sem requestVideoFrameCallback: marca um quadro novo a cada 40 ms de vídeo.
  sondar() {
    if (this.temRVFC || !this.video) return;
    const t = this.video.currentTime;
    if (Math.abs(t - this._ultimo) >= 0.04) {
      this._ultimo = t;
      this.novoQuadro = true;
    }
  }

  async tocar() {
    this.video.muted = false;
    this.video.volume = 1;
    await this.video.play();
  }
  pausar() { this.video.pause(); }

  // Faz o navegador "liberar" o áudio do vídeo no toque do usuário.
  async destravar() {
    this.video.muted = false;
    try {
      await this.video.play();
      this.video.pause();
    } catch (e) { console.warn('destravar', e); }
    this.video.currentTime = 0;
  }

  ir(segundos) { this.video.currentTime = Math.max(0, segundos); }
}

// Guarda os últimos quadros do vídeo (só a faixa onde a bailarina dança).
// Cada cópia da bailarina mostra um quadro de um momento diferente.
export class Captura {
  constructor(renderer, texturaVideo) {
    this.renderer = renderer;
    this.n = ANEL.fatias * ANEL.atrasoCarrossel + 1;
    this.cabeca = 0;
    this.quantos = 0;

    const opcoes = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.rts = [];
    for (let i = 0; i < this.n; i++) {
      const rt = new THREE.WebGLRenderTarget(ANEL.larguraRT, ANEL.alturaRT, opcoes);
      rt.texture.colorSpace = THREE.NoColorSpace;
      this.rts.push(rt);
    }

    const [x0, x1] = CENA.recorte;
    this.material = new THREE.ShaderMaterial({
      uniforms: { uVideo: { value: texturaVideo }, uCrop: { value: new THREE.Vector4(x0, 0, x1 - x0, 1) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform sampler2D uVideo; uniform vec4 uCrop;' +
        'void main(){ gl_FragColor = vec4(texture2D(uVideo, uCrop.xy + vUv * uCrop.zw).rgb, 1.0); }',
      depthTest: false,
      depthWrite: false,
    });
    this.cena = new THREE.Scene();
    this.cena.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.cam = new THREE.Camera();

    // começa tudo preto
    const atual = renderer.getRenderTarget();
    renderer.setClearColor(0x000000, 1);
    for (const rt of this.rts) {
      renderer.setRenderTarget(rt);
      renderer.clear();
    }
    renderer.setRenderTarget(atual);
  }

  empurrar() {
    const r = this.renderer;
    const atual = r.getRenderTarget();
    this.cabeca = (this.cabeca + 1) % this.n;
    r.setRenderTarget(this.rts[this.cabeca]);
    r.render(this.cena, this.cam);
    r.setRenderTarget(atual);
    this.quantos = Math.min(this.quantos + 1, this.n);
  }

  // textura do quadro de "atraso" quadros atrás (null se ainda não existe)
  textura(atraso) {
    if (atraso >= this.quantos) return null;
    return this.rts[(this.cabeca - atraso + this.n * 2) % this.n].texture;
  }

  zerar() { this.quantos = 0; }
}
