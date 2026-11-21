interface PagePlaceholderProps {
  title: string;
  intro: string;
}

export function PagePlaceholder({ title, intro }: PagePlaceholderProps) {
  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl font-normal tracking-tight text-ink">{title}</h1>
      <p className="mt-4 max-w-2xl text-ink-2">{intro}</p>
    </section>
  );
}
