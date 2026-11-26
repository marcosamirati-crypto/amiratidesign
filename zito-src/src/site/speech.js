// Voz no site aberto: reconhecimento e síntese de fala do próprio navegador
// (Chrome e Android; Safari no iPhone a partir do iOS 14.5). Mesmo contrato
// do ditado e da voz da versão no Claude.
export function webDictation() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  let rec = null;
  const partial = new Set(), final = new Set(), state = new Set();
  const emit = (set, v) => set.forEach(f => { try { f(v); } catch {} });
  return {
    start() {
      return new Promise((res, rej) => {
        try { rec && rec.abort(); } catch {}
        rec = new SR();
        rec.lang = 'pt-BR'; rec.continuous = true; rec.interimResults = true;
        let started = false;
        rec.onstart = () => { started = true; emit(state, { state: 'listening' }); res(); };
        rec.onresult = e => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) emit(final, { text: r[0].transcript.trim() }); else interim += r[0].transcript;
          }
          emit(partial, { text: interim });
        };
        rec.onerror = e => { const code = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'not_granted' : e.error; if (!started) rej({ code }); emit(state, { state: 'idle', reason: code }); };
        rec.onend = () => emit(state, { state: 'idle', reason: 'stopped' });
        try { rec.start(); } catch (e) { rej({ code: 'start_failed' }); }
      });
    },
    stop() { try { rec && rec.stop(); } catch {} return new Promise(r => setTimeout(r, 300)); },
    onPartial: f => partial.add(f), onFinal: f => final.add(f), onState: f => state.add(f),
  };
}

export function webTTS() {
  if (!('speechSynthesis' in window)) return null;
  const pickVoice = () => { const vs = speechSynthesis.getVoices(); return vs.find(v => /pt-BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)); };
  return {
    speak(text, opts = {}) {
      return new Promise((res, rej) => {
        const u = new SpeechSynthesisUtterance(String(text).slice(0, 4000));
        u.lang = 'pt-BR'; u.rate = opts.rate || 1;
        const v = pickVoice(); if (v) u.voice = v;
        u.onend = () => res(); u.onerror = () => rej({ code: 'error' });
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      });
    },
    stop() { speechSynthesis.cancel(); },
    onState() {},
  };
}
