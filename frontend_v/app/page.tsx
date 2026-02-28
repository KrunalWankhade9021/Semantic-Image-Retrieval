"use client"

import { useState, useCallback } from "react"
import { SearchBar } from "@/components/search-bar"
import { StatusPanel } from "@/components/status-panel"
import { IndexPanel } from "@/components/index-panel"
import { SettingsDialog } from "@/components/settings-dialog"
import { ImageGrid } from "@/components/image-grid"
import { EmptyState } from "@/components/empty-state"
import { searchImages, type SearchResult } from "@/lib/api"
import { useStatus } from "@/hooks/use-api"
import { toast } from "sonner"
import { Slider } from "@/components/ui/slider"
import { Sparkles } from "lucide-react"

export default function HomePage() {
  const { data: status } = useStatus()
  const [results, setResults] = useState<SearchResult[]>([])
  const [lastQuery, setLastQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [resultCount, setResultCount] = useState(20)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(
    async (query: string) => {
      setIsSearching(true)
      setHasSearched(true)
      try {
        const data = await searchImages(query, resultCount)
        setResults(data)
        setLastQuery(query)
        if (data.length === 0) {
          toast.info("No results found. Try a different query.")
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Search failed")
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [resultCount]
  )

  const canSearch = status?.indexed && status?.model_loaded

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex items-center justify-between gap-2 px-3 sm:px-4 py-3 max-w-7xl">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/25">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-foreground leading-none tracking-tight">
                PixelMind
              </h1>
              <span className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Semantic Image Search</span>
            </div>
          </div>

          <StatusPanel />

          <div className="flex items-center gap-1 shrink-0">
            <IndexPanel
              isIndexing={isIndexing}
              setIsIndexing={setIsIndexing}
              modelLoaded={status?.model_loaded ?? false}
              onIndexComplete={() => {
                window.location.reload()
              }}
            />
            <SettingsDialog />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 flex flex-col gap-6">
        {/* Search section */}
        <section className="flex flex-col items-center gap-4">
          <SearchBar
            onSearch={handleSearch}
            isSearching={isSearching}
            disabled={!canSearch}
          />



          {!canSearch && status && (
            <p className="text-xs text-muted-foreground text-center">
              {!status.model_loaded
                ? "Model is loading, please wait..."
                : "No images indexed yet. Click 'Index Images' to get started."}
            </p>
          )}
        </section>

        {/* Results or empty state */}
        <section className="flex-1">
          {hasSearched && results.length > 0 ? (
            <ImageGrid results={results} query={lastQuery} />
          ) : hasSearched && results.length === 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-muted-foreground text-sm">No images matched your query.</p>
              <p className="text-muted-foreground text-xs mt-1">Try broader or different search terms.</p>
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Powered by CLIP + FAISS
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {status?.model_name || "openai/clip-vit-base-patch32"}
          </p>
        </div>
      </footer>
    </div>
  )
}
