import { notFound } from "next/navigation";
import ProjectForm from "../../ProjectForm";
import { createAuthClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAuthClient();
  const { data } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!data) notFound();
  return (
    <>
      <h1 className="display text-4xl">Editar projeto</h1>
      <ProjectForm project={data as Project} />
    </>
  );
}
