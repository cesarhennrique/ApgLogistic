import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { site } from "@/content/site";

export const metadata = { title: site.legal.privacy.label };

export default function Page() {
  return <PagePlaceholder title={site.legal.privacy.label} />;
}
