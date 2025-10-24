"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Scissors, RotateCcw, Play, Pause, Download, Loader2 } from "lucide-react"
import type { VideoFile } from "@/components/video-editor"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

type VideoTimelineProps = {
  videoFile: VideoFile
  onReset: () => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

export function VideoTimeline({ videoFile, onReset, isProcessing, setIsProcessing }: VideoTimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const { toast } = useToast()

  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [isDraggingStart, setIsDraggingStart] = useState(false)
  const [isDraggingEnd, setIsDraggingEnd] = useState(false)
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string | null>(null)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        console.log("[v0] Starting FFmpeg load...")
        const ffmpeg = new FFmpeg()
        ffmpegRef.current = ffmpeg

        ffmpeg.on("progress", ({ progress }) => {
          setProcessingProgress(Math.round(progress * 100))
        })

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"

        await ffmpeg.load({
          coreURL: `${baseURL}/ffmpeg-core.js`,
          wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        })

        console.log("[v0] FFmpeg loaded successfully")
        setFfmpegLoaded(true)
      } catch (error) {
        console.error("[v0] FFmpeg load error:", error)
        toast({
          title: "Failed to load video editor",
          description: "Please check your internet connection and refresh the page",
          variant: "destructive",
        })
      }
    }

    loadFFmpeg()
  }, [toast])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration
      setDuration(videoDuration)
      setEndTime(videoDuration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isProcessing) {
        e.preventDefault()
        togglePlayPause()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isPlaying, isProcessing])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * duration

    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleMarkerDrag = (clientX: number, isStart: boolean) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const time = percentage * duration

    if (isStart) {
      setStartTime(Math.min(time, endTime - 0.1))
    } else {
      setEndTime(Math.max(time, startTime + 0.1))
    }
  }

  const handleMove = (e: MouseEvent | TouchEvent) => {
    e.preventDefault() // Prevent scrolling on mobile
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX

    if (isDraggingStart) {
      handleMarkerDrag(clientX, true)
    } else if (isDraggingEnd) {
      handleMarkerDrag(clientX, false)
    }
  }

  const handleEnd = () => {
    setIsDraggingStart(false)
    setIsDraggingEnd(false)
  }

  useEffect(() => {
    if (isDraggingStart || isDraggingEnd) {
      window.addEventListener("mousemove", handleMove)
      window.addEventListener("mouseup", handleEnd)
      window.addEventListener("touchmove", handleMove, { passive: false })
      window.addEventListener("touchend", handleEnd)

      return () => {
        window.removeEventListener("mousemove", handleMove)
        window.removeEventListener("mouseup", handleEnd)
        window.removeEventListener("touchmove", handleMove)
        window.removeEventListener("touchend", handleEnd)
      }
    }
  }, [isDraggingStart, isDraggingEnd])

  const handleTrim = async () => {
  if (!ffmpegRef.current || !ffmpegLoaded) {
    toast({
      title: "Please wait",
      description: "Video editor is still loading",
    })
    return
  }

  setIsProcessing(true)
  setTrimmedVideoUrl(null)
  setProcessingProgress(0)

  try {
    console.log("[v0] Starting trim process...")
    const ffmpeg = ffmpegRef.current
    const fileExtension = videoFile.filename.split(".").pop()?.toLowerCase() || "mp4"
    const inputFileName = `input.${fileExtension}`
    const outputFileName = `output.${fileExtension}`

    console.log("[v0] Reading video file...")
    let videoData: Uint8Array

    // Always use the pre-loaded data which we now ensure exists
    if (videoFile.data) {
      console.log("[v0] Using pre-loaded data")
      videoData = new Uint8Array(videoFile.data)
    } else {
      // Fallback: This shouldn't happen with the new approach, but keep for safety
      console.error("[v0] Warning: No pre-loaded data found, attempting direct read...")
      throw new Error("Video data not available. Please re-upload the video.")
    }

    console.log("[v0] Writing file to FFmpeg...")
    await ffmpeg.writeFile(inputFileName, videoData)

    console.log("[v0] Executing FFmpeg trim command...")
    await ffmpeg.exec([
      "-ss",
      startTime.toString(),
      "-to",
      endTime.toString(),
      "-i",
      inputFileName,
      "-c",
      "copy",
      "-avoid_negative_ts",
      "make_zero",
      outputFileName,
    ])

    console.log("[v0] Reading trimmed video...")
    const data = await ffmpeg.readFile(outputFileName)
    const blob = new Blob([data], { type: `video/${fileExtension}` })
    const url = URL.createObjectURL(blob)

    setTrimmedVideoUrl(url)
    setIsProcessing(false)
    setProcessingProgress(100)

    toast({
      title: "Video trimmed successfully",
      description: "Your video is ready to download",
    })

    console.log("[v0] Cleaning up files...")
    await ffmpeg.deleteFile(inputFileName)
    await ffmpeg.deleteFile(outputFileName)
    console.log("[v0] Trim complete!")
  } catch (error) {
    console.error("[v0] Trim error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    toast({
      title: "Failed to trim video",
      description: errorMessage,
      variant: "destructive",
    })
    setIsProcessing(false)
    setProcessingProgress(0)
  }
}

  const handleDownload = () => {
    if (!trimmedVideoUrl) return

    const link = document.createElement("a")
    link.href = trimmedVideoUrl
    link.download = `trimmed-${videoFile.filename}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Download started",
      description: "Your trimmed video is being downloaded",
    })
  }

  const startPercentage = (startTime / duration) * 100
  const endPercentage = (endTime / duration) * 100
  const currentPercentage = (currentTime / duration) * 100

  return (
    <div className="space-y-8">
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl ring-1 ring-border">
        <video ref={videoRef} src={videoFile.url} className="w-full h-full" onClick={togglePlayPause} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!isPlaying && (
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-6 transition-all duration-200">
              <Play className="h-16 w-16 text-white" fill="white" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 px-2">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayPause}
          disabled={isProcessing}
          className="shrink-0 bg-transparent"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="flex-1 text-sm font-medium text-muted-foreground tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <Button variant="outline" onClick={onReset} disabled={isProcessing} className="shrink-0 bg-transparent">
          <RotateCcw className="mr-2 h-4 w-4" />
          New Video
        </Button>
      </div>

      <div className="space-y-6 px-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trim Timeline</h3>
          <div className="text-sm font-medium text-muted-foreground tabular-nums">
            {formatTime(startTime)} → {formatTime(endTime)} ({formatTime(endTime - startTime)})
          </div>
        </div>

        <div
          ref={timelineRef}
          className="relative h-32 md:h-24 bg-secondary/50 rounded-xl cursor-pointer select-none overflow-visible ring-1 ring-border transition-all hover:ring-primary/50 touch-none"
          onClick={handleTimelineClick}
          onTouchStart={handleTimelineClick}
        >
          <div
            className="absolute top-0 bottom-0 bg-primary/20 border-l-4 border-r-4 border-primary transition-all"
            style={{
              left: `${startPercentage}%`,
              right: `${100 - endPercentage}%`,
            }}
          />

          <div
            className="absolute top-0 bottom-0 w-1 bg-foreground z-10 transition-all pointer-events-none"
            style={{ left: `${currentPercentage}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-foreground rounded-full shadow-lg" />
          </div>

          <div className="absolute top-0 bottom-0 z-20 group" style={{ left: `${startPercentage}%` }}>
            <div
              className={`absolute inset-0 w-2 md:w-1.5 bg-primary transition-all ${isDraggingStart ? "w-3" : "group-hover:w-3"}`}
            />

            <div
              className="absolute top-0 bottom-0 -left-6 w-12 cursor-ew-resize"
              onMouseDown={() => setIsDraggingStart(true)}
              onTouchStart={(e) => {
                e.stopPropagation()
                setIsDraggingStart(true)
              }}
            />

            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 md:py-1.5 rounded-md whitespace-nowrap shadow-lg transition-all pointer-events-none ${isDraggingStart ? "scale-110" : ""}`}
            >
              {formatTime(startTime)}
            </div>
          </div>

          <div className="absolute top-0 bottom-0 z-20 group" style={{ left: `${endPercentage}%` }}>
            <div
              className={`absolute inset-0 w-2 md:w-1.5 bg-primary transition-all ${isDraggingEnd ? "w-3" : "group-hover:w-3"}`}
            />

            <div
              className="absolute top-0 bottom-0 -left-6 w-12 cursor-ew-resize"
              onMouseDown={() => setIsDraggingEnd(true)}
              onTouchStart={(e) => {
                e.stopPropagation()
                setIsDraggingEnd(true)
              }}
            />

            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 md:py-1.5 rounded-md whitespace-nowrap shadow-lg transition-all pointer-events-none ${isDraggingEnd ? "scale-110" : ""}`}
            >
              {formatTime(endTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 px-2">
        <Button
          onClick={handleTrim}
          disabled={isProcessing || !ffmpegLoaded || endTime - startTime < 0.1}
          size="lg"
          className="flex-1"
        >
          {!ffmpegLoaded ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading Editor...
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing {processingProgress}%
            </>
          ) : (
            <>
              <Scissors className="mr-2 h-5 w-5" />
              Trim Video
            </>
          )}
        </Button>

        {trimmedVideoUrl && (
          <Button onClick={handleDownload} size="lg" variant="outline" className="flex-1 bg-transparent">
            <Download className="mr-2 h-5 w-5" />
            Download
          </Button>
        )}
      </div>

      {isProcessing && (
        <div className="space-y-2 px-2">
          <Progress value={processingProgress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">Processing your video...</p>
        </div>
      )}

      {trimmedVideoUrl && (
        <div className="space-y-4 pt-8 border-t px-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-500">Trimmed Video Preview</h3>
            <span className="text-sm text-muted-foreground">Ready to download</span>
          </div>
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-xl ring-1 ring-border">
            <video src={trimmedVideoUrl} controls className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  )
}
