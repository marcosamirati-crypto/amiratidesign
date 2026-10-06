import * as THREE from 'three';

const GRAU = Math.PI / 180;
const _euler = new THREE.Euler();
const _qDev = new THREE.Quaternion();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // a câmera olha pela traseira do celular
const _q0 = new THREE.Quaternion();
const _qy = new THREE.Quaternion();
const _zee = new THREE.Vector3(0, 0, 1);
const _eixoY = new THREE.Vector3(0, 1, 0);

// Direção do olhar: giroscópio do celular, ou arrastar o dedo/mouse, ou setas do teclado.
export class Cabeca {
  constructor(elemento) {
    this.q = new THREE.Quaternion();
    this.sensor = false;
    this.ori = null;
    this.yaw0 = 0;
    this.yawAtual = 0;
    this.pedirCentro = true;
    this.yawArrasto = 0;
    this.pitchArrasto = 0;
    this._aoOrientar = (e) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      this.ori = { a: e.alpha, b: e.beta, g: e.gamma };
      this.sensor = true;
    };

    // arrastar
    let id = null, x = 0, y = 0, moveu = false;
    elemento.addEventListener('pointerdown', (e) => {
      id = e.pointerId; x = e.clientX; y = e.clientY; moveu = false;
      elemento.setPointerCapture?.(id);
    });
    elemento.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - x, dy = e.clientY - y;
      x = e.clientX; y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 0) moveu = true;
      this.yawArrasto += dx * 0.004;
      if (!this.sensor) this.pitchArrasto = Math.max(-1.35, Math.min(1.35, this.pitchArrasto + dy * 0.004));
    });
    const solta = (e) => { if (e.pointerId === id) id = null; };
    elemento.addEventListener('pointerup', solta);
    elemento.addEventListener('pointercancel', solta);

    window.addEventListener('keydown', (e) => {
      const passo = 0.06;
      if (e.key === 'ArrowLeft') this.yawArrasto += passo;
      else if (e.key === 'ArrowRight') this.yawArrasto -= passo;
      else if (e.key === 'ArrowUp' && !this.sensor) this.pitchArrasto = Math.min(1.35, this.pitchArrasto + passo);
      else if (e.key === 'ArrowDown' && !this.sensor) this.pitchArrasto = Math.max(-1.35, this.pitchArrasto - passo);
    });
  }

  // No iPhone o acesso ao giroscópio precisa ser pedido, dentro de um toque.
  static pedirPermissao() {
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') {
      return D.requestPermission().then((r) => r === 'granted').catch(() => false);
    }
    return Promise.resolve(true);
  }

  iniciar() {
    window.addEventListener('deviceorientation', this._aoOrientar, true);
  }

  // "Para frente" passa a ser para onde o celular aponta agora.
  recentrar() {
    this.pedirCentro = true;
    this.yawArrasto = 0;
    this.pitchArrasto = 0;
  }

  atualizar() {
    if (this.sensor && this.ori) {
      const o = this.ori;
      const tela = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * GRAU;
      _euler.set(o.b * GRAU, o.a * GRAU, -o.g * GRAU, 'YXZ');
      _qDev.setFromEuler(_euler);
      _qDev.multiply(_q1);
      _qDev.multiply(_q0.setFromAxisAngle(_zee, -tela));
      _euler.setFromQuaternion(_qDev, 'YXZ');
      this.yawAtual = _euler.y;
      if (this.pedirCentro) { this.yaw0 = this.yawAtual; this.pedirCentro = false; }
      _qy.setFromAxisAngle(_eixoY, this.yawArrasto - this.yaw0);
      this.q.copy(_qy).multiply(_qDev);
    } else {
      _euler.set(this.pitchArrasto, this.yawArrasto, 0, 'YXZ');
      this.q.setFromEuler(_euler);
    }
    return this.q;
  }
}
