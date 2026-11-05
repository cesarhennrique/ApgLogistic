// A Brazilian phone's mask as it is typed: "(81) 3202-1800", "(81) 93202-1800". Digits only, at most 11; a pasted
// "+55" country code is dropped.
export function maskPhone(value: string): string {
  let d = value.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d && `(${d}`;
  const [ddd, rest] = [d.slice(0, 2), d.slice(2)];
  const split = rest.length > 8 ? 5 : 4;
  return rest.length <= split ? `(${ddd}) ${rest}` : `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
