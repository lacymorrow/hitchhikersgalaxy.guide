import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sales } from "./mock-data";

export function RecentSales() {
  return (
    <ul className="-mx-6 -mb-6">
      {sales.map((sale) => (
        <li
          key={sale.id}
          className="flex items-center gap-3 px-6 py-2.5 shadow-hairline-t transition-colors duration-100 ease-out-quart hover:bg-muted/60"
        >
          <Avatar className="size-7 text-[10px]">
            <AvatarImage src={sale.avatar} alt="" />
            <AvatarFallback>{sale.fallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium leading-4">{sale.name}</p>
            <p className="truncate text-[11px] leading-4 text-muted-foreground">{sale.email}</p>
          </div>
          <div className="ml-auto font-medium tabular-nums">{sale.amount.replace(/^\+/, "")}</div>
        </li>
      ))}
    </ul>
  );
}
