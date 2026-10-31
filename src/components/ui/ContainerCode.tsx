// tone: its strength, quieter by default; full over a photo, where it must still pass AA.
type Props = { index: number; label: string; tone?: string };

export function ContainerCode({ index, label, tone = "opacity-70" }: Props) {
  return (
    <span className={`font-mono-tabular text-xs tracking-wider ${tone}`}>
      APGU 1996-{String(index).padStart(2, "0")} · {label.toLocaleUpperCase("pt-BR")}
    </span>
  );
}
