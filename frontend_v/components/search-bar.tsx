"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Search, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch: (query: string) => void
  isSearching: boolean
  disabled?: boolean
}

export function SearchBar({ onSearch, isSearching, disabled }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim() && !isSearching && !disabled) {
        onSearch(query.trim())
      }
    },
    [query, isSearching, disabled, onSearch]
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          "relative flex items-center rounded-xl border bg-card transition-all duration-300",
          isFocused
            ? "border-primary/50 shadow-[0_0_20px_-5px] shadow-primary/20 ring-1 ring-primary/20"
            : "border-border hover:border-primary/30",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-center pl-4">
          {isSearching ? (
            <Loader2 className="size-5 text-primary animate-spin" />
          ) : (
            <Search className={cn("size-5 transition-colors", isFocused ? "text-primary" : "text-muted-foreground")} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Describe what you're looking for..."
          disabled={disabled}
          className="flex-1 bg-transparent px-3 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mr-2 p-1 rounded-md hover:bg-secondary transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        )}

        <div className="pr-3">
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className={cn(
              "h-8 px-4 rounded-lg text-sm font-medium transition-all",
              query.trim() && !isSearching
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            Search
          </button>
        </div>
      </div>
    </form>
  )
}
