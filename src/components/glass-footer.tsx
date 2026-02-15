import Link from "next/link"
import { Github, Linkedin, Twitter, Youtube } from "lucide-react"

export function GlassFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/25 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-[1880px] flex-wrap items-center justify-between gap-4 px-4 py-2 text-sm md:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <p className="font-semibold tracking-[0.01em] text-foreground">© {new Date().getFullYear()} OneOrigin Inc.</p>
          <Link href="/about-oneorigin" className="font-medium text-foreground transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/admin" className="font-medium text-foreground transition-colors hover:text-primary">
            Admin
          </Link>
          <a href="https://www.oneorigin.us/" target="_blank" rel="noreferrer" className="font-medium text-foreground transition-colors hover:text-primary">
            Website
          </a>
        </div>

        <div className="flex items-center gap-2">
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="rounded-md border px-2 py-1 hover:bg-muted">
            <Linkedin className="h-4 w-4" />
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="rounded-md border px-2 py-1 hover:bg-muted">
            <Twitter className="h-4 w-4" />
          </a>
          <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="rounded-md border px-2 py-1 hover:bg-muted">
            <Youtube className="h-4 w-4" />
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="rounded-md border px-2 py-1 hover:bg-muted">
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  )
}
