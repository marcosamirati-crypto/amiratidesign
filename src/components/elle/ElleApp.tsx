"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { elleCopy } from "@/content/elle/copy";
import { analyzeImage } from "@/lib/elle/client";
import { ImageError, prepareImage, type PreparedImage } from "@/lib/elle/image";
import type { OrbState } from "@/lib/elle/orb-engine";
import type { Analysis, ElleErrorCode } from "@/lib/elle/types";
import AboutSheet from "./AboutSheet";
import ElleIntro from "./ElleIntro";
import ElleOrb from "./ElleOrb";
import ErrorState from "./ErrorState";
import ImagePreview from "./ImagePreview";
import ThinkingState, { type StageInfo } from "./ThinkingState";
import { DropVeil, useUploadIntake } from "./UploadZone";

// O resultado é a parte pesada: só carrega depois que a análise termina.
const AnalysisResult = dynamic(() => import("./AnalysisResult"), { loading: () => null });

type Screen = "home" | "preview" | "thinking" | "result" | "error";

/**
 * Máquina de estados da experiência:
 * home → (print) → preview → thinking → result, com error em qualquer ponto.
 * Um único orbe acompanha home, preview, thinking e error; o resultado tem o seu, pequeno.
 */
export default function ElleApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [stage, setStage] = useState<StageInfo | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<{ code: ElleErrorCode; fromImage: boolean } | null>(null);
  const [about, setAbout] = useState(false);
  const [beat, setBeat] = useState(false); // breve "achei" antes de abrir o resultado
  const abort = useRef<AbortController | null>(null);
  const imageRef = useRef<PreparedImage | null>(null);
  imageRef.current = image;

  const pick = useCallback(async (file: File) => {
    try {
      const prepared = await prepareImage(file);
      setImage((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return prepared;
      });
      setError(null);
      setScreen("preview");
    } catch (e) {
      setError({ code: e instanceof ImageError ? e.code : "unreadable", fromImage: true });
      setScreen("error");
    }
  }, []);

  const intake = useUploadIntake({ enabled: screen === "home" || screen === "preview" || screen === "error", onFile: pick });

  const start = useCallback(async () => {
    const img = imageRef.current;
    if (!img) return;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setStage({ id: "reading" });
    setError(null);
    setBeat(false);
    setScreen("thinking");

    await analyzeImage(
      img.blob,
      (e) => {
        if (ac.signal.aborted) return;
        if (e.type === "stage") setStage({ id: e.stage, detail: e.detail, demo: e.demo });
        else if (e.type === "result") {
          setAnalysis(e.analysis);
          setBeat(true);
          window.setTimeout(
            () => {
              if (ac.signal.aborted) return;
              setScreen("result");
              window.scrollTo({ top: 0 });
            },
            window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650,
          );
        } else {
          setError({ code: e.code, fromImage: false });
          setScreen("error");
        }
      },
      ac.signal,
    );
  }, []);

  const cancel = useCallback(() => {
    abort.current?.abort();
    setStage(null);
    setScreen(imageRef.current ? "preview" : "home");
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setImage((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    setAnalysis(null);
    setError(null);
    setStage(null);
    setBeat(false);
    setScreen("home");
    window.scrollTo({ top: 0 });
  }, []);

  const retry = useCallback(() => {
    // Se o problema foi o arquivo, não adianta repetir: abre a escolha de outro print.
    if (error?.fromImage || !imageRef.current) intake.openPicker();
    else start();
  }, [error, intake, start]);

  useEffect(() => () => abort.current?.abort(), []);

  const orbState: OrbState = screen === "thinking" ? (beat ? "found" : "thinking") : screen === "error" ? "error" : "idle";

  if (screen === "result" && analysis) {
    return (
      <div className="elle-root" data-screen="result">
        <ElleTop onAbout={() => setAbout(true)} />
        <main className="elle-main elle-main--result">
          <AnalysisResult analysis={analysis} onReset={reset} onRetry={start} />
        </main>
        <AboutSheet open={about} onClose={() => setAbout(false)} />
        {intake.inputs}
      </div>
    );
  }

  return (
    <div className="elle-root" data-screen={screen}>
      <ElleTop onAbout={() => setAbout(true)} />
      <main className="elle-main">
        <div className="elle-stage" data-screen={screen}>
          <div className="elle-orb-slot">
            <ElleOrb
              state={orbState}
              interactive={screen === "home"}
              onPress={() => setAbout(true)}
              label={screen === "home" ? elleCopy.home.orbLabel : screen === "thinking" ? "A Elle está investigando" : "Elle"}
              data-orb="stage"
            />
          </div>

          {screen === "home" && <ElleIntro onPick={intake.openPicker} onCamera={intake.openCamera} />}
          {screen === "preview" && image && <ImagePreview image={image} onGo={start} onSwap={intake.openPicker} onCancel={reset} />}
          {screen === "thinking" && <ThinkingState stage={stage} onCancel={cancel} />}
          {screen === "error" && error && <ErrorState code={error.code} onRetry={retry} onOther={intake.openPicker} />}
        </div>
      </main>

      {(screen === "home" || screen === "preview") && (
        <footer className="elle-foot">
          <p>{elleCopy.home.privacy}</p>
          <p>{elleCopy.home.privacyDetail}</p>
        </footer>
      )}

      <AboutSheet open={about} onClose={() => setAbout(false)} />
      <DropVeil show={intake.dragging} />
      {intake.inputs}
    </div>
  );
}

function ElleTop({ onAbout }: { onAbout: () => void }) {
  return (
    <header className="elle-top">
      <p className="elle-mark">
        <span>{elleCopy.brand}</span>
        <small>{elleCopy.tagline}</small>
      </p>
      <button type="button" className="elle-link" onClick={onAbout} aria-haspopup="dialog">
        Sobre
      </button>
    </header>
  );
}
