import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { site } from "@/content/site";

export function generateStaticParams() {
  return site.services.map((s) => ({ slug: s.slug }));
}

const findService = async (params: PageProps<"/servicos/[slug]">["params"]) => {
  const { slug } = await params;
  return site.services.find((s) => s.slug === slug);
};

export async function generateMetadata({ params }: PageProps<"/servicos/[slug]">): Promise<Metadata> {
  return { title: (await findService(params))?.title };
}

export default async function Page({ params }: PageProps<"/servicos/[slug]">) {
  const service = await findService(params);
  if (!service) notFound();
  return <PagePlaceholder title={service.title} />;
}
