import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="px-4 py-12 sm:py-16 lg:py-24 max-w-5xl mx-auto text-center">
        <span className="inline-block text-small font-medium text-primary bg-card border border-border rounded-sm px-3 py-1 mb-4">
          Skip the queue
        </span>
        <h1 className="mb-4 text-text-primary">
          Order ahead. <span className="text-primary">Walk straight in.</span>
        </h1>
        <p className="text-body text-text-secondary max-w-xl mx-auto mb-8">
          Browse kota spots and takeaways near you, order and pay in advance,
          and collect the moment it&apos;s ready — no queue, no delivery fees.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" href="/browse">Find food near you</Button>
          <Button variant="secondary" href="/register">List your business</Button>
        </div>
      </section>

      {/* How it works — three-step signature strip.
          Numbered here because it genuinely IS a sequence (order → pay → collect). */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Browse & order", body: "Pick your spot, add items, and place your order." },
            { step: "02", title: "Pay in-app", body: "Secure checkout — card, EFT, or Capitec Pay." },
            { step: "03", title: "Walk in & collect", body: "No queue. Your order's ready when you arrive." },
          ].map((item) => (
            <Card key={item.step}>
              <span className="text-small font-semibold text-accent">{item.step}</span>
              <h3 className="mt-2 mb-1">{item.title}</h3>
              <p className="text-small text-text-secondary">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
