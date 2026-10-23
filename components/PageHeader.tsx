export function PageHeader({
  label = "慶應競走部 中距離ブロック",
  title,
  right,
  children,
}: {
  label?: string;
  title: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b-4 border-keio-red bg-keio-navy px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] text-white">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-blue-200">{label}</p>
          <h1 className="text-lg font-bold">{title || " "}</h1>
        </div>
        {right}
      </div>
      {children}
    </header>
  );
}
