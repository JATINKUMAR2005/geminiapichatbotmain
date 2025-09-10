"use client"

import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { ChatDemo } from "@/components/chat-demo"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <ChatDemo />
      <Testimonials />
      <Footer />
    </div>
  )
}
