import * as THREE from 'three';

const RAD = 180 / Math.PI;

// Desenha dois olhos lado a lado e corrige a distorção da lente do óculos
// (a lente "estica" as bordas; aqui a imagem é comprimida do jeito contrário).
export class Estereo {
  constructor(renderer) {
    this.r = renderer;
    this.camE = new THREE.PerspectiveCamera();
    this.camD = new THREE.PerspectiveCamera();
    this.rtE = null;
    this.rtD = null;
    this.p = { distorcao: 1, separacao: 0, zoom: 1, fovV: 80, ipd: 0.064 };
    this.k = { k1: 0.2, k2: 0.06 };

    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uL: { value: null }, uR: { value: null },
        uK: { value: new THREE.Vector2() }, uShift: { value: 0 },
        uAsp: { value: 1 }, uRazao: { value: 1 }, uZoom: { value: 1 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `varying vec2 vUv; uniform sampler2D uL; uniform sampler2D uR;
        uniform vec2 uK; uniform float uShift; uniform float uAsp; uniform float uRazao; uniform float uZoom;
        void main(){
          bool esq = vUv.x < 0.5;
          vec2 e = vec2(esq ? vUv.x * 2.0 : vUv.x * 2.0 - 1.0, vUv.y);
          vec2 c = vec2(0.5 + (esq ? uShift : -uShift), 0.5);
          vec2 p = (e - c) * vec2(2.0 * uAsp, 2.0);
          float r2 = dot(p, p);
          p *= 1.0 + uK.x * r2 + uK.y * r2 * r2;
          p /= uZoom;
          vec2 s = 0.5 + 0.5 * vec2(p.x / uAsp, p.y) * uRazao;
          vec2 dentro = smoothstep(vec2(0.0), vec2(0.015), s) * smoothstep(vec2(0.0), vec2(0.015), 1.0 - s);
          vec3 cor = esq ? texture2D(uL, s).rgb : texture2D(uR, s).rgb;
          float miolo = smoothstep(0.0, 0.004, abs(vUv.x - 0.5));
          gl_FragColor = vec4(cor * dentro.x * dentro.y * miolo, 1.0);
        }`,
      depthTest: false,
      depthWrite: false,
    });
    this.cenaQuad = new THREE.Scene();
    this.cenaQuad.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
    this.camQuad = new THREE.Camera();
  }

  ajustar(p) { Object.assign(this.p, p); }

  redimensionar(w, h) {
    const ew = Math.max(2, Math.floor(w / 2));
    if (this.rtE && this.rtE.width === ew && this.rtE.height === h) return;
    this.rtE?.dispose(); this.rtD?.dispose();
    const op = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, depthBuffer: true };
    this.rtE = new THREE.WebGLRenderTarget(ew, h, op);
    this.rtD = new THREE.WebGLRenderTarget(ew, h, op);
    this.rtE.texture.colorSpace = THREE.NoColorSpace;
    this.rtD.texture.colorSpace = THREE.NoColorSpace;
    this.asp = ew / h;
  }

  desenhar(scene, q, pos) {
    const { distorcao, separacao, zoom, fovV, ipd } = this.p;
    const k1 = this.k.k1 * distorcao, k2 = this.k.k2 * distorcao;
    const asp = this.asp;
    const tanV = Math.tan((fovV / 2) / RAD);
    const escala = (r) => 1 + k1 * r * r + k2 * Math.pow(r, 4);
    const maxEsc = Math.max(escala(asp), escala(1), 1);
    const tanR = Math.min(Math.tan(75 / RAD), (tanV * maxEsc) / Math.min(zoom, 1));
    const fovR = 2 * Math.atan(tanR) * RAD;

    const u = this.mat.uniforms;
    u.uK.value.set(k1, k2);
    u.uShift.value = separacao;
    u.uAsp.value = asp;
    u.uRazao.value = tanV / tanR;
    u.uZoom.value = zoom;
    u.uL.value = this.rtE.texture;
    u.uR.value = this.rtD.texture;

    const direita = new THREE.Vector3(1, 0, 0).applyQuaternion(q).multiplyScalar(ipd / 2);
    for (const [cam, sinal, rt] of [[this.camE, -1, this.rtE], [this.camD, 1, this.rtD]]) {
      cam.fov = fovR; cam.aspect = asp; cam.near = 0.1; cam.far = 100;
      cam.updateProjectionMatrix();
      cam.quaternion.copy(q);
      cam.position.copy(pos).addScaledVector(direita, sinal);
      cam.updateMatrixWorld(true);
      this.r.setRenderTarget(rt);
      this.r.render(scene, cam);
    }
    this.r.setRenderTarget(null);
    this.r.render(this.cenaQuad, this.camQuad);
  }
}
