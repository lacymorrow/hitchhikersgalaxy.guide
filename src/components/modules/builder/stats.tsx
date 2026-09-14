import { cn } from "@/lib/utils";

interface Stat {
  value: string;
  label: string;
  description?: string;
}

interface StatsProps {
  title: string;
  subtitle: string;
  stats: Stat[];
  columns?: 2 | 3 | 4;
  background?: "white" | "gray";
}

export const Stats = ({
  title,
  subtitle,
  stats,
  columns = 3,
  background = "white",
}: StatsProps) => {
  return (
    <section
      className={cn("py-20", {
        "bg-white": background === "white",
        "bg-gray-50": background === "gray",
      })}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">{subtitle}</p>
        </div>

        {/* Stats Grid */}
        <div
          className={cn("mx-auto grid max-w-6xl gap-8", {
            "grid-cols-1 md:grid-cols-2": columns === 2,
            "grid-cols-1 md:grid-cols-3": columns === 3,
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4": columns === 4,
          })}
        >
          {stats.map((stat, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
              key={index}
              className="rounded-lg border border-gray-200 p-6 text-center transition-shadow hover:shadow-lg"
            >
              <div className="mb-2 text-4xl font-bold text-primary">{stat.value}</div>
              <div className="mb-2 text-lg font-semibold">{stat.label}</div>
              {stat.description && <p className="text-gray-600">{stat.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
