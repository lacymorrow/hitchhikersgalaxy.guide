import { ArrowRight, Box, Code2, Layers, Palette, Rocket, Shield, Zap } from "lucide-react";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/primitives/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    id: "lightning-fast",
    title: "Lightning Fast",
    description:
      "Built on Next.js 13 with React Server Components for optimal performance and instant page loads.",
    icon: Zap,
    color: "text-yellow-500",
  },
  {
    id: "type-safe",
    title: "Type-Safe",
    description:
      "Full TypeScript support with strict type checking for robust, error-free development.",
    icon: Shield,
    color: "text-blue-500",
  },
  {
    id: "component-library",
    title: "Component Library",
    description: "Pre-built, accessible components powered by shadcn/ui and Radix UI primitives.",
    icon: Box,
    color: "text-purple-500",
  },
  {
    id: "modern-stack",
    title: "Modern Stack",
    description: "Includes Tailwind CSS, ESLint, and other modern tools configured out of the box.",
    icon: Layers,
    color: "text-green-500",
  },
  {
    id: "beautiful-ui",
    title: "Beautiful UI",
    description: "Stunning design system with dark mode support and customizable themes.",
    icon: Palette,
    color: "text-pink-500",
  },
  {
    id: "developer-experience",
    title: "Developer Experience",
    description: "Hot reloading, detailed error reporting, and intuitive project structure.",
    icon: Code2,
    color: "text-orange-500",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <PageHeader className="mx-auto mb-16 max-w-3xl text-center">
            <PageHeaderHeading className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Supercharge Your Next.js Development
            </PageHeaderHeading>
            <PageHeaderDescription>
              Everything you need to build modern web applications, carefully crafted for the
              perfect development experience.
            </PageHeaderDescription>
          </PageHeader>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.id} className="p-6 transition-shadow hover:shadow-lg">
                <div className={`${feature.color} mb-4`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center rounded-full bg-secondary p-1">
              <Rocket className="mr-2 h-5 w-5" />
              <span className="px-2 py-1 text-sm font-medium">Ship Faster</span>
            </div>
            <h2 className="mb-8 mt-4 text-3xl font-bold">Ready to Start Building?</h2>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
