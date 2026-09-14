import {
  IconBrandNextjs,
  IconBrandReact,
  IconBrandStripeFilled,
  IconBrandTailwind,
  IconBrandTypescript,
  IconDatabase,
  IconMail,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const brands = [
  {
    name: "Next.js",
    Logo: IconBrandNextjs,
    description: "React framework for production",
  },
  {
    name: "React",
    Logo: IconBrandReact,
    description: "UI component library",
  },
  {
    name: "TypeScript",
    Logo: IconBrandTypescript,
    description: "Type-safe JavaScript",
  },
  {
    name: "Tailwind",
    Logo: IconBrandTailwind,
    description: "Utility-first CSS framework",
  },
  {
    name: "PostgreSQL",
    Logo: IconDatabase,
    description: "Relational database with Drizzle ORM",
  },
  {
    name: "Stripe",
    Logo: IconBrandStripeFilled,
    description: "Payment processing",
  },
  {
    name: "Resend",
    Logo: IconMail,
    description: "Transactional email",
  },
];

export const BrandLogos = () => {
  return (
    <div className="grid grid-cols-3 gap-4 md:grid-cols-7">
      {brands.map(({ name, Logo, description }) => (
        <Tooltip key={name}>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2",
                "cursor-pointer rounded-lg p-4",
                "bg-white/5 hover:bg-white/10",
                "border border-transparent hover:border-primary/10",
                "transition-all duration-200"
              )}
            >
              <Logo className="h-10 w-10 text-muted-foreground transition-colors duration-200" />
              <span className="text-xs text-muted-foreground">{name}</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-center">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
