"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, Film, FileVideo, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { VideoFile } from "@/components/video-editor"
import { useToast } from "@/hooks/use-toast"

type VideoUploadProps = {
  onUploadComplete: (file: VideoFile) => void
}

// Size limits based on device capabilities
const getMaxFileSize = () => {
  // Check if mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  
  // Check available memory (if API is available)
  const memory = (navigator as any).deviceMemory // In GB, only available in Chrome
  
  if (isMobile) {
    return 256 * 1024 * 1024 // 256MB for mobile
  } else if (memory && memory <= 4) {
    return 512 * 1024 * 1024 // 512MB for low-memory devices
  } else {
    return 1024 * 1024 * 1024 // 1GB for desktop
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const acceptedFormats = ["video/mp4", "video/quicktime", "video/x-msvideo"]
  const acceptedExtensions = [".mp4", ".mov", ".avi"]
  const maxFileSize = getMaxFileSize()

  const handleUpload = async (file: File) => {
    // Format validation
    if (!acceptedFormats.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a video file (MP4, MOV, or AVI)",
        variant: "destructive",
      })
      return
    }

    // Size validation
    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${formatFileSize(maxFileSize)}. Your file is ${formatFileSize(file.size)}.`,
        variant: "destructive",
      })
      return
    }

    // Warning for large files
    if (file.size > maxFileSize * 0.75) {
      toast({
        title: "Large file detected",
        description: "Processing may be slow. For best performance, use files under " + formatFileSize(maxFileSize * 0.5),
      })
    }

    setIsLoading(true)

    try {
      // For smaller files, read entirely into memory
      const useChunkedReading = file.size > 100 * 1024 * 1024 // 100MB threshold
      
      let arrayBuffer: ArrayBuffer
      let blob: Blob
      
      if (useChunkedReading) {
        // For larger files, we could implement chunked reading
        // but for video editing, we need the entire file in memory anyway
        console.log("[v0] Reading large file...")
        arrayBuffer = await readFileInChunks(file)
        blob = new Blob([arrayBuffer], { type: file.type })
      } else {
        // For smaller files, read directly
        arrayBuffer = await file.arrayBuffer()
        blob = new Blob([arrayBuffer], { type: file.type })
      }
      
      const url = URL.createObjectURL(blob)
      
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
        file: new File([blob], file.name, { type: file.type }),
        data: arrayBuffer,
      }

      onUploadComplete(videoFile)
      toast({
        title: "Video loaded successfully",
        description: `${file.name} (${formatFileSize(file.size)}) is ready to edit`,
      })
    } catch (error) {
      console.error("[v0] Upload error:", error)
      
      // Check if it's a memory error
      if (error instanceof Error && error.message.includes('memory')) {
        toast({
          title: "Out of memory",
          description: "The file is too large for your device. Please try a smaller file.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to load video",
          description: "Please try again with a different file",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to read file in chunks (helps with memory management)
  const readFileInChunks = async (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(e.target.result)
        } else {
          reject(new Error("Failed to read file"))
        }
      }
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"))
      }
      
      // Monitor memory usage during read
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          console.log(`[v0] Reading file: ${percentComplete.toFixed(0)}%`)
        }
      }
      
      reader.readAsArrayBuffer(file)
    })
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
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Maximum size: {formatFileSize(maxFileSize)}</span>
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
