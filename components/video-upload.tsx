"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, Film, FileVideo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { VideoFile } from "@/components/video-editor"
import { useToast } from "@/hooks/use-toast"

type VideoUploadProps = {
  onUploadComplete: (file: VideoFile) => void
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const acceptedFormats = ["video/mp4", "video/quicktime", "video/x-msvideo"]
  const acceptedExtensions = [".mp4", ".mov", ".avi"]

  const handleUpload = async (file: File) => {
    if (!acceptedFormats.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a video file (MP4, MOV, or AVI)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const url = URL.createObjectURL(file)
      const video = document.createElement("video")
      video.preload = "metadata"

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject(new Error("Failed to load video"))
        video.src = url
      })

      const videoFile: VideoFile = {
        url,
        filename: file.name,
        size: file.size,
        type: file.type,
        duration: video.duration,
        file,
      }

      onUploadComplete(videoFile)
      toast({
        title: "Video loaded successfully",
        description: `${file.name} is ready to edit`,
      })
    } catch (error) {
      toast({
        title: "Failed to load video",
        description: "Please try again with a different file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed transition-all duration-200",
        isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50",
        isLoading && "pointer-events-none opacity-60",
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="p-16 text-center">
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              "rounded-full p-8 transition-all duration-200",
              isDragging ? "bg-primary/20 scale-110" : "bg-primary/10",
            )}
          >
            {isLoading ? (
              <Upload className="h-16 w-16 text-primary animate-pulse" />
            ) : (
              <FileVideo className="h-16 w-16 text-primary" />
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <p className="text-xl font-semibold text-foreground">Loading video...</p>
            <p className="text-sm text-muted-foreground">Processing in your browser</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-foreground">Upload your video</h3>
              <p className="text-muted-foreground">Drag and drop your video file here, or click to browse</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Film className="h-4 w-4" />
                <span>Supported formats: MP4, MOV, AVI</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Videos are processed entirely in your browser — no upload required
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <Button asChild size="lg" className="px-8">
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-5 w-5" />
                  Choose Video File
                  <input
                    type="file"
                    className="hidden"
                    accept={acceptedExtensions.join(",")}
                    onChange={handleFileSelect}
                  />
                </label>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
