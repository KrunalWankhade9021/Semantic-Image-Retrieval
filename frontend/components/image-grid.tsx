"use client"

import { useState } from "react"
import { type SearchResult, getThumbnailUrl } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { ImageLightbox } from "@/components/image-lightbox"
import { cn } from "@/lib/utils"

interface ImageGridProps {
  results: SearchResult[]
  query: string
}

export function ImageGrid({ results, query }: ImageGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index))
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{results.length}</span>{" "}
            results for{" "}
            <span className="text-primary font-medium">{`"${query}"`}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {results.map((result, index) => (
            <button
              key={`${result.image_path}-${index}`}
              onClick={() => setSelectedIndex(index)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary/50 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* Skeleton loader */}
              {!loadedImages.has(index) && (
                <div className="absolute inset-0 animate-pulse bg-secondary" />
              )}

              {/* Image */}
              <img
                src={getThumbnailUrl(result.image_path, 400)}
                alt={result.filename}
                crossOrigin="anonymous"
                loading="lazy"
                onLoad={() => handleImageLoad(index)}
                className={cn(
                  "size-full object-cover transition-all duration-300 group-hover:scale-105",
                  loadedImages.has(index) ? "opacity-100" : "opacity-0"
                )}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

              {/* Info overlay */}
              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-2.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="truncate text-xs font-medium text-foreground">{result.filename}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 border-transparent",
                      result.score > 0.3
                        ? "bg-primary/20 text-primary"
                        : result.score > 0.2
                        ? "bg-chart-4/20 text-chart-4"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {(result.score * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <ImageLightbox
          results={results}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </>
  )
}
