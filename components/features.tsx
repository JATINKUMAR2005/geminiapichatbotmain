"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Clock, Shield, Zap } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Advanced AI",
    description: "Powered by cutting-edge language models for natural, intelligent conversations.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Always available to help you, no matter the time or day.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your conversations are encrypted and your privacy is our priority.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get instant responses with our optimized AI infrastructure.",
  },
]

export function Features() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">Why Choose Our AI Assistant?</h2>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Discover the features that make our chatbot the perfect companion for all your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow border-border/50">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-pretty">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
