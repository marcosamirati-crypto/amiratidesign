import { site } from "@/content/site";

export default function Footer() {
  return (
    <footer className="border-t border-line py-10 text-sm text-muted">
      <div className="container-x flex flex-col justify-between gap-3 md:flex-row">
        <p>
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </p>
        <p>
          <a href={site.instagramUrl} className="link-u hover:text-fg" target="_blank" rel="noreferrer">
            {site.instagram}
          </a>
        </p>
      </div>
    </footer>
  );
}