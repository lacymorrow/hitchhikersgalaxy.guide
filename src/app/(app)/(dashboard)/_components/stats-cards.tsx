import { CountUp } from "@/components/primitives/count-up";
import { Card } from "@/components/ui/card";
import { stats } from "./mock-data";

/** One strip, four cells, hairlines between. Not four cards. */
export function StatsCards() {
  return (
    <Card className="grid grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="flex flex-col gap-1.5 px-4 py-3.5 max-lg:[&:nth-child(3)]:shadow-[0_-0.5px_0_var(--hairline)] max-lg:[&:nth-child(4)]:shadow-[-0.5px_0_0_var(--hairline),0_-0.5px_0_var(--hairline)] [&:nth-child(n+2)]:shadow-[-0.5px_0_0_var(--hairline)]"
        >
          <span className="text-xs text-muted-foreground">{stat.title}</span>
          <CountUp
            value={stat.value}
            prefix={stat.prefix}
            className="text-[22px] font-medium leading-7 tracking-[-0.02em]"
          />
          <span className="flex items-center gap-1.5 text-[11px] leading-4">
            <span className="rounded bg-success/15 px-1.5 py-px font-medium text-success">
              {stat.delta}
            </span>
            <span className="text-muted-foreground">{stat.deltaLabel}</span>
          </span>
        </div>
      ))}
    </Card>
  );
}
