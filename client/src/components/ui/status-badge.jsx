import * as React from "react"
import { cn } from "@/lib/utils"
import { Mic, MicOff, Video, VideoOff, Crown } from "lucide-react"

export function StatusBadge({ 
  isInCall, 
  isAudioEnabled, 
  isVideoEnabled, 
  isOwner,
  size = "default" 
}) {
  const sizes = {
    sm: "w-3 h-3",
    default: "w-4 h-4",
    lg: "w-5 h-5"
  }

  if (isOwner) {
    return (
      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600">
        <Crown className="w-3 h-3 text-white" />
      </div>
    )
  }

  if (!isInCall) {
    return (
      <div className={cn(
        "rounded-full bg-muted-foreground/30",
        sizes[size]
      )} />
    )
  }

  if (isVideoEnabled) {
    return (
      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary animate-pulse">
        <Video className="w-3 h-3 text-white" />
      </div>
    )
  }

  if (isAudioEnabled) {
    return (
      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success">
        <Mic className="w-3 h-3 text-white" />
      </div>
    )
  }

  return (
    <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive/80">
      <MicOff className="w-3 h-3 text-white" />
    </div>
  )
}
