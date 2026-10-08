import { categoryCopy } from "@/content/elle/copy";
import type { CategoryId } from "@/lib/elle/types";

/** O eixo principal vem cheio; os secundários, só com contorno. */
export default function CategoryBadge({ id, primary }: { id: CategoryId; primary: boolean }) {
  return (
    <span className="elle-badge" data-primary={primary ? "" : undefined}>
      <i aria-hidden="true" />
      {categoryCopy[id].name}
      {primary && <span className="elle-sr"> (eixo principal)</span>}
    </span>
  );
}
