import { VideoEditor } from "@/components/video-editor"
import { Scissors } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="mb-12 text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="rounded-xl bg-primary/10 p-3" aria-hidden="true">
              <Scissors className="h-8 w-8 text-primary" aria-label="Scissors icon" />
            </div>
            <h1 className="text-5xl font-bold text-foreground tracking-tight">Trimflow</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trim videos instantly in your browser. Fast, private, and completely free. No upload required.
          </p>
        </header>

        <article>
          <h2 className="sr-only">Video Editor Tool</h2>
          <VideoEditor />
        </article>

        <footer className="mt-16 pt-8 border-t border-border/40">
          <div className="text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Features</h3>
                <ul className="space-y-1">
                  <li>✓ Trim MP4, MOV, and AVI videos</li>
                  <li>✓ No file size limits</li>
                  <li>✓ 100% client-side processing</li>
                  <li>✓ Your videos never leave your device</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">How It Works</h3>
                <ul className="space-y-1">
                  <li>1. Upload your video file</li>
                  <li>2. Drag markers to select trim points</li>
                  <li>3. Click trim and download</li>
                  <li>4. All processing happens in your browser</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Trimflow. Free online video trimming tool.
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
