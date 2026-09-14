import { motion } from "framer-motion";
import { Rocket, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Boost your productivity with our blazing fast CLI tool.",
  },
  {
    icon: Shield,
    title: "Secure",
    description: "Built with security in mind to keep your projects safe.",
  },
  {
    icon: Rocket,
    title: "Easy to Use",
    description: "Simple and intuitive commands for developers of all levels.",
  },
];

export function Features() {
  return (
    <section className="bg-muted px-4 py-20 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold">Why Choose Our CLI?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
              key={index}
              className="rounded-lg bg-background p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <feature.icon className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
