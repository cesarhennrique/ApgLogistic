type Props = { index: number; label: string };

export function ContainerCode({ index, label }: Props) {
  return (
    <span className="font-mono-tabular text-xs tracking-wider opacity-70">
      APGU 1996-{String(index).padStart(2, "0")} · {label.toLocaleUpperCase("pt-BR")}
    </span>
  );
}
