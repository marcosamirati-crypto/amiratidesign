// Criptografia ponta a ponta entre cada jogador e o Mestre.
// ECDH P-256 para combinar a chave, AES-GCM para cada mensagem.
// O identificador de cada aparelho é a impressão digital da sua chave pública:
// ninguém consegue falar em nome de outro aparelho.

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = buf => { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
const unb64 = str => { const s = atob(str); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
const B32 = 'abcdefghijkmnpqrstuvwxyz23456789';

export async function fingerprint(rawPubB64) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', unb64(rawPubB64)));
  let out = '';
  for (let i = 0; i < 16; i++) out += B32[h[i] % 32];
  return out;
}

// Par de chaves persistente por aparelho (perfil permite vários "aparelhos" no mesmo navegador, para testes)
export async function deviceKeys(storageKey) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch {}
  if (saved && saved.priv && saved.pub) {
    try {
      const priv = await crypto.subtle.importKey('jwk', saved.priv, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
      return { priv, pub: saved.pub, privJwk: saved.priv, uid: await fingerprint(saved.pub) };
    } catch {}
  }
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const pub = b64(await crypto.subtle.exportKey('raw', kp.publicKey));
  const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  try { localStorage.setItem(storageKey, JSON.stringify({ pub, priv: privJwk })); } catch {}
  return { priv: kp.privateKey, pub, privJwk, uid: await fingerprint(pub) };
}

export async function importKeys(saved, storageKey) {
  localStorage.setItem(storageKey, JSON.stringify(saved));
  return deviceKeys(storageKey);
}

export async function sharedKey(myPriv, theirPubB64) {
  const pub = await crypto.subtle.importKey('raw', unb64(theirPubB64), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  return crypto.subtle.deriveKey({ name: 'ECDH', public: pub }, myPriv, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv: b64(iv), ct: b64(ct) };
}

export async function open(key, { iv, ct }) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
  return JSON.parse(dec.decode(pt));
}
