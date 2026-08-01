import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      {/* Glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl text-center">
        {/* Status badge */}
        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
          🚧 Under Construction
        </Badge>

        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
              📒
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Khata Assistant
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            AI-powered ledger for shopkeepers. Turn natural language into
            accurate credit tracking.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Natural Language Input",
            "Smart Ledger Updates",
            "Overdue Alerts",
            "Multi-Transaction Parsing",
          ].map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Button size="lg" disabled className="mt-4">
          Coming Soon
        </Button>

        {/* Tech stack footer */}
        <p className="text-xs text-muted-foreground/60 mt-8">
          Built with Next.js · Supabase · LangGraph · shadcn/ui
        </p>
      </div>
    </div>
  );
}
