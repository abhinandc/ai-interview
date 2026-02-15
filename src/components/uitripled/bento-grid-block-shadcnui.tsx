"use client"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import {
  ArrowRight,
  Atom,
  BookOpenCheck,
  Globe,
  HeartHandshake,
  MountainSnow,
  Rocket,
  ShieldCheck,
  Sparkles
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

function SurfaceCard({
  title,
  description,
  icon: Icon,
  kicker,
  children
}: {
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  kicker?: string
  children?: React.ReactNode
}) {
  return (
    <div className="group relative h-full overflow-hidden rounded-[22px] border border-border/50 bg-background/60 p-6 backdrop-blur transition-colors hover:border-border/70">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-transparent" />
      </div>

      <div className="relative space-y-4">
        {kicker ? (
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="w-fit rounded-full bg-background/70 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-foreground/70">
              {kicker}
            </Badge>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-pretty text-xl font-semibold leading-tight tracking-tight md:text-2xl">
            {title}
          </h3>
          {description ? (
            <p className="text-sm leading-7 text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {children ? <div className="pt-2">{children}</div> : null}
      </div>
    </div>
  )
}

export function BentoGridBlock() {
  return (
    <section className="relative w-full overflow-hidden pb-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-foreground/[0.03] blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-primary/[0.06] blur-[140px]" />
        <div className="absolute left-8 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-foreground/[0.02] blur-[170px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <motion.header
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="w-fit border-border/60 bg-background/60 backdrop-blur">
              The OneOrigin story
            </Badge>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="rounded-full">
                <a href="https://www.oneorigin.us/" target="_blank" rel="noreferrer">
                  Visit OneOrigin
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/candidate/login">
                  Enter Live Assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              AI-native delivery, built for institutions that cannot afford lag.
            </h2>
            <p className="max-w-3xl text-pretty text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              OneOrigin blends adaptive AI, high-precision engineering, and immersive experience design. The goal is simple:
              ship outcomes faster, with better governance, and with evidence you can audit.
            </p>
          </div>
        </motion.header>

        <motion.div
          className="mt-10 grid auto-rows-[minmax(220px,auto)] gap-4 md:gap-6 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.55, ease: "easeOut", staggerChildren: 0.08, delayChildren: 0.08 }
            }
          }}
        >
          <motion.article variants={cardVariants} className="lg:col-span-2 lg:row-span-2">
            <SurfaceCard
              kicker="Flagship"
              title="Sia: adaptive AI for learning + operations"
              description="Real-time analytics, automation, and decision support designed to serve learners and teams without losing governance."
              icon={Atom}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Signal</p>
                  <p className="mt-1 text-lg font-semibold">Realtime</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Workflow</p>
                  <p className="mt-1 text-lg font-semibold">Automated</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Output</p>
                  <p className="mt-1 text-lg font-semibold">Auditable</p>
                </div>
              </div>
            </SurfaceCard>
          </motion.article>

          <motion.article variants={cardVariants} className="lg:col-span-2">
            <SurfaceCard
              kicker="Immersive"
              title="OneXperience: XR training that feels real"
              description="Training environments and simulations designed for retention, confidence, and measurable outcomes."
              icon={MountainSnow}
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">VR</Badge>
                <Badge variant="outline" className="rounded-full">AR</Badge>
                <Badge variant="outline" className="rounded-full">Simulation</Badge>
              </div>
            </SurfaceCard>
          </motion.article>

          <motion.article variants={cardVariants}>
            <SurfaceCard
              kicker="Principle"
              title="Engineering. Perfected."
              description="Performance, security, and scale are not extras. They are the baseline."
              icon={ShieldCheck}
            />
          </motion.article>

          <motion.article variants={cardVariants}>
            <SurfaceCard
              kicker="Culture"
              title="Ignite: build boldly, ship fast"
              description="Hackathons and rapid iteration that keep creativity close to delivery."
              icon={Rocket}
            />
          </motion.article>

          <motion.article variants={cardVariants} className="lg:col-span-2">
            <SurfaceCard
              kicker="Values"
              title="Innovation. Collaboration. Purpose."
              description="We design teams, systems, and decisions so the work compounds."
              icon={Sparkles}
            >
              <div className="mt-1 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                  <p className="text-xs font-semibold">Innovation</p>
                  <p className="mt-1 text-xs text-muted-foreground">Curiosity with output.</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                  <p className="text-xs font-semibold">Collaboration</p>
                  <p className="mt-1 text-xs text-muted-foreground">Cross-timezone execution.</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                  <p className="text-xs font-semibold">Purpose</p>
                  <p className="mt-1 text-xs text-muted-foreground">Outcomes that matter.</p>
                </div>
              </div>
            </SurfaceCard>
          </motion.article>

          <motion.article variants={cardVariants}>
            <SurfaceCard
              kicker="Community"
              title="OneHeart: give back, build forward"
              description="Initiatives that invest in people, opportunity, and future talent."
              icon={HeartHandshake}
            />
          </motion.article>

          <motion.article variants={cardVariants}>
            <SurfaceCard
              kicker="Footprint"
              title="Scottsdale HQ. Global teams."
              description="North America, Middle East, and India. Built for velocity."
              icon={Globe}
            />
          </motion.article>

          <motion.article variants={cardVariants} className="lg:col-span-2">
            <SurfaceCard
              kicker="Why this app exists"
              title="We hire for AI fluency, not AI dependency"
              description="This assessment measures how candidates think, verify, and ship with an always-on sidekick under real time pressure."
              icon={BookOpenCheck}
            >
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link href="/interviewer">Open Interviewer Console</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/candidate/login">
                    Candidate Entry
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </SurfaceCard>
          </motion.article>
        </motion.div>
      </div>
    </section>
  )
}

