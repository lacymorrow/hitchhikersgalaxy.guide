"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/primitives/section";
import { Separator } from "@/components/ui/separator";
import { BrandLogos } from "./brand-logos";
import { SocialMarquee } from "./social-marquee";

const stats = [
  {
    value: "10+",
    label: "Production Sites",
    description: "running on Shipkit right now",
  },
  {
    value: "100+",
    label: "Components",
    description: "ready to use, not demos",
  },
  {
    value: "30-Day",
    label: "Refund Policy",
    description: "no questions asked",
  },
];

export const SocialProof = () => {
  return (
    <Section className="relative overflow-hidden">
      {/* Stats Grid */}
      <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2 }}
            className="text-center"
          >
            <div className="text-4xl font-bold tracking-tight">{stat.value}</div>
            <div className="mt-2 text-base font-semibold">{stat.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">{stat.description}</div>
          </motion.div>
        ))}
      </div>

      {/* Real Projects Marquee */}
      <div className="mb-16">
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Real projects built with Shipkit
        </p>
        <SocialMarquee />
      </div>

      <Separator className="mb-16" />

      {/* Tech Stack Logos */}
      <div className="mb-16">
        <h3 className="mb-8 text-center text-sm font-semibold text-muted-foreground">Built on</h3>
        <BrandLogos />
      </div>
    </Section>
  );
};
