import { Link } from "@/components/primitives/link";
import { routes } from "@/config/routes";

const links = [
  { label: "Docs", href: routes.docs },
  { label: "Support", href: routes.contact },
  { label: "Changelog", href: "/changelog" },
  { label: "Privacy", href: routes.privacy },
];

/** One quiet status line. The app's footer is not the marketing footer. */
export const DashboardFooter = () => {
  return (
    <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-[11px] leading-4 text-muted-foreground/70">
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-success" aria-hidden />
        All systems normal
      </span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="transition-colors duration-100 hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </footer>
  );
};
