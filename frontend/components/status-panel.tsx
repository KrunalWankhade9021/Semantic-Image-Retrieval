"use client"

import { Badge } from "@/components/ui/badge"
import { useStatus } from "@/hooks/use-api"
import { Cpu, Database, HardDrive, Loader2, Wifi, WifiOff } from "lucide-react"

export function StatusPanel() {
  const { data: status, error, isLoading } = useStatus()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-3.5 animate-spin" />
        <span className="hidden sm:inline">Connecting...</span>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className="flex items-center gap-2">
        <WifiOff className="size-3.5 text-destructive" />
        <span className="text-sm text-destructive">Offline</span>
      </div>
    )
  }

  return (
    <div className="hidden md:flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Wifi className="size-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">Connected</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <Cpu className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-mono">
          {status.device.toUpperCase()}
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <HardDrive className="size-3.5 text-muted-foreground" />
        <Badge variant={status.model_loaded ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
          {status.model_loaded ? "Model Ready" : "No Model"}
        </Badge>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <Database className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {status.image_count.toLocaleString()} images
        </span>
      </div>
    </div>
  )
}
