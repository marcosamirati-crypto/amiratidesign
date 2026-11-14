import type { Metadata } from "next";
import BriefingForm from "@/components/BriefingForm";
import { briefingIntro } from "@/content/briefing";

export const metadata: Metadata = {
  title: "Briefing",
  description: "Briefing de projeto: 12 perguntas para começar um projeto de marca com o Amirati.",
  robots: { index: false, follow: true },
};

export default function BriefingPage() {
  return (
    <section className="pb-24 pt-36 md:pb-40 md:pt-48">
      <div className="container-x max-w-5xl">
        <p className="mb-6 text-sm text-muted">{briefingIntro.label}</p>
        <h1 className="display text-5xl md:text-8xl">{briefingIntro.title}</h1>
        <p className="mt-8 max-w-2xl text-lg text-muted md:text-xl">{briefingIntro.line}</p>
        <div className="mt-20 border-t border-line pt-16">
          <BriefingForm />
        </div>
      </div>
    </section>
  );
}
