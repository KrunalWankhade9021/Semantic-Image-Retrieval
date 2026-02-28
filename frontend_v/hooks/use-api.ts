"use client"

import useSWR from "swr"
import { fetchStatus, fetchIndexProgress, type StatusResponse, type IndexProgressResponse } from "@/lib/api"

export function useStatus() {
  return useSWR<StatusResponse>("api-status", fetchStatus, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  })
}

export function useIndexProgress(enabled: boolean) {
  return useSWR<IndexProgressResponse>(
    enabled ? "index-progress" : null,
    fetchIndexProgress,
    {
      refreshInterval: 1000,
      revalidateOnFocus: false,
    }
  )
}
