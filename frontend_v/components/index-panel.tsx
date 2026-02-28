"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useIndexProgress } from "@/hooks/use-api"
import { startIndexing, startSystemScan, getApiUrl } from "@/lib/api"
import { toast } from "sonner"
import { FolderSearch, HardDrive, Loader2, FolderOpen, Database } from "lucide-react"

interface IndexPanelProps {
  isIndexing: boolean
  setIsIndexing: (v: boolean) => void
  onIndexComplete?: () => void
}

export function IndexPanel({ isIndexing, setIsIndexing, onIndexComplete }: IndexPanelProps) {
  const [dirPath, setDirPath] = useState("")
  const [open, setOpen] = useState(false)

  const { data: progress } = useIndexProgress(isIndexing)

  const handleIndex = async () => {
    if (!dirPath.trim()) {
      toast.error("Please enter a directory path")
      return
    }
    try {
      setIsIndexing(true)
      const res = await startIndexing(dirPath.trim())
      toast.success(res.message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start indexing")
      setIsIndexing(false)
    }
  }

  const handleScan = async () => {
    try {
      setIsIndexing(true)
      const res = await startSystemScan()
      toast.success(res.message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start scan")
      setIsIndexing(false)
    }
  }

  // Check if indexing completed
  if (progress && !progress.in_progress && isIndexing) {
    setIsIndexing(false)
    if (progress.status === "done") {
      toast.success(progress.message)
      onIndexComplete?.()
    } else if (progress.status === "error") {
      toast.error(progress.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="size-4" />
          <span className="hidden sm:inline">Index Images</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderSearch className="size-5 text-primary" />
            Index Images
          </DialogTitle>
          <DialogDescription>
            Scan and index images from your filesystem to enable semantic search.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Custom directory */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Custom Directory
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="/path/to/your/images"
                value={dirPath}
                onChange={(e) => setDirPath(e.target.value)}
                disabled={isIndexing}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={async () => {
                  try {
                    const res = await fetch(`${getApiUrl()}/api/browse`)
                    if (!res.ok) throw new Error("No folder selected")
                    const data = await res.json()
                    if (data.path) setDirPath(data.path)
                  } catch {
                    // user cancelled the dialog — do nothing
                  }
                }}
                disabled={isIndexing}
                className="shrink-0 gap-2"
              >
                <FolderOpen className="size-4" />
                Browse
              </Button>
              <Button
                onClick={handleIndex}
                disabled={isIndexing || !dirPath.trim()}
                size="default"
                className="shrink-0 gap-2"
              >
                {isIndexing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FolderOpen className="size-4" />
                )}
                Index
              </Button>
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* System scan */}
          <Button
            variant="secondary"
            onClick={handleScan}
            disabled={isIndexing}
            className="w-full gap-2"
          >
            {isIndexing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <HardDrive className="size-4" />
            )}
            Scan System Folders
            <Badge variant="outline" className="ml-auto text-[10px]">
              Pictures, Downloads, etc.
            </Badge>
          </Button>

          {/* Progress */}
          {isIndexing && progress && (
            <div className="flex flex-col gap-2 rounded-lg border bg-secondary/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Indexing...</span>
                <Badge variant="outline" className="text-[10px]">
                  {progress.image_count.toLocaleString()} images
                </Badge>
              </div>
              <Progress value={progress.status === "running" ? undefined : 100} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{progress.message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
