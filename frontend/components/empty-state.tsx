"use client"

import { Search, Sparkles, Image, Zap } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-8">
        <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Sparkles className="size-10 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 size-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
          <div className="size-2 rounded-full bg-primary" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2 text-balance text-center">
        Search your images with natural language
      </h2>
      <p className="text-sm text-muted-foreground max-w-md text-center mb-10 leading-relaxed">
        Type anything — objects, scenes, colors, moods — and let CLIP find the most relevant images from your indexed collection.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
        {[
          {
            icon: Search,
            title: "Natural Language",
            desc: "Search with everyday words",
          },
          {
            icon: Image,
            title: "Visual Match",
            desc: "AI understands image content",
          },
          {
            icon: Zap,
            title: "Instant Results",
            desc: "Vector similarity at speed",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card/50 border-border/60"
          >
            <div className="size-9 rounded-lg bg-secondary flex items-center justify-center">
              <item.icon className="size-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">{item.title}</span>
            <span className="text-[11px] text-muted-foreground text-center leading-tight">{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
