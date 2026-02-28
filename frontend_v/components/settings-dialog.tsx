"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getApiUrl, setApiUrl } from "@/lib/api"
import { toast } from "sonner"
import { Settings, Check } from "lucide-react"

export function SettingsDialog() {
  const [url, setUrl] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setUrl(getApiUrl())
  }, [open])

  const handleSave = () => {
    const cleaned = url.replace(/\/+$/, "")
    setApiUrl(cleaned)
    setUrl(cleaned)
    toast.success("API URL updated. Refresh to reconnect.")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Settings className="size-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure the backend API URL for your FastAPI server.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">API URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:8000"
            className="font-mono text-sm"
          />
          <Button onClick={handleSave} className="gap-2">
            <Check className="size-4" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
