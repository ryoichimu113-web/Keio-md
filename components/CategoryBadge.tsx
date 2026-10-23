import { CATEGORY_STYLE, type Category } from "@/lib/types";

export function CategoryBadge({ category }: { category: Category }) {
  return <span className={`mr-1 rounded px-1 py-px text-[10px] font-bold ${CATEGORY_STYLE[category]}`}>{category}</span>;
}
