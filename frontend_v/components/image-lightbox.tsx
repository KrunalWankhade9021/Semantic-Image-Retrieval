"use client"

import { useEffect, useCallback } from "react"
import { type SearchResult, getImageUrl } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Download, FileImage } from "lucide-react"

interface ImageLightboxProps {
  results: SearchResult[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function ImageLightbox({
  results,
  currentIndex,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const current = results[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < results.length - 1

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1)
  }, [hasNext, currentIndex, onNavigate])

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1)
  }, [hasPrev, currentIndex, onNavigate])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose, goPrev, goNext])

  // Prevent scroll on body
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <a
          href={getImageUrl(current.image_path)}
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
            <Download className="size-4" />
            <span className="sr-only">Download</span>
          </Button>
        </a>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-9 text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
          <span className="sr-only">Close lightbox</span>
        </Button>
      </div>

      {/* Navigation */}
      {hasPrev && (
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          className="absolute left-4 z-10 size-10 rounded-full bg-secondary/50 backdrop-blur-sm hover:bg-secondary"
        >
          <ChevronLeft className="size-6" />
          <span className="sr-only">Previous image</span>
        </Button>
      )}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          className="absolute right-4 z-10 size-10 rounded-full bg-secondary/50 backdrop-blur-sm hover:bg-secondary"
        >
          <ChevronRight className="size-6" />
          <span className="sr-only">Next image</span>
        </Button>
      )}

      {/* Image */}
      <div className="relative z-[5] flex max-h-[85vh] max-w-[90vw] flex-col items-center gap-4">
        <img
          src={getImageUrl(current.image_path)}
          alt={current.filename}
          crossOrigin="anonymous"
          className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
        />

        {/* Info bar */}
        <div className="flex items-center gap-3 rounded-lg border bg-card/80 backdrop-blur-sm px-4 py-2.5">
          <FileImage className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate max-w-[300px]">
            {current.filename}
          </span>
          <div className="h-4 w-px bg-border" />
          <Badge variant="outline" className="text-xs shrink-0">
            {(current.score * 100).toFixed(1)}% match
          </Badge>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground shrink-0">
            {currentIndex + 1} / {results.length}
          </span>
        </div>
      </div>
    </div>
  )
}
