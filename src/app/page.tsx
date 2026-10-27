import { site } from "@/content/site";

// provisória: a Home real entra nos prompts 04 e 08–13
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <h1 className="font-condensed text-5xl font-bold uppercase md:text-8xl">
        {site.tagline}
      </h1>
    </main>
  );
}
