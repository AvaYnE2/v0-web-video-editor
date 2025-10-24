"use client"

import { useState } from "react"
import { VideoUpload } from "@/components/video-upload"
import { VideoTimeline } from "@/components/video-timeline"
import { Card } from "@/components/ui/card"

export type VideoFile = {
  url: string // Blob URL for video preview
  filename: string
  size: number
  type: string
  duration?: number
  file: File
  data: ArrayBuffer // File data stored in memory to avoid read errors
}

export function VideoEditor() {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleVideoUpload = (file: VideoFile) => {
    setVideoFile(file)
  }

  const handleReset = () => {
    if (videoFile?.url) {
      URL.revokeObjectURL(videoFile.url)
    }
    setVideoFile(null)
    setIsProcessing(false)
  }

  return (
    <div className="space-y-6">
      {!videoFile ? (
        <VideoUpload onUploadComplete={handleVideoUpload} />
      ) : (
        <Card className="p-6">
          <VideoTimeline
            videoFile={videoFile}
            onReset={handleReset}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </Card>
      )}
    </div>
  )
}
