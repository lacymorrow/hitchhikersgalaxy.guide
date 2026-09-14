import Image from "next/image";
import { Link } from "@/components/primitives/link";
import { siteConfig } from "@/config/site-config";
import logoImage from "@/public/logo.png";
export const BlogHero = () => {
  return (
    <header className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-[37.5rem] pb-20 pt-20 text-center">
        <div className="flex items-center justify-center space-x-3">
          {/* <Icon name="logo" className="w-10 h-10" /> */}
          <Image src={logoImage} alt="Shipkit" width={100} height={100} priority />
          <h1 className="text-4xl font-extrabold tracking-tight text-primary/90 sm:text-5xl">
            {siteConfig.name} Blog
          </h1>
        </div>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Shipkit is a starter template made with Next.js, React, and Tailwind CSS. Subscribe to our
          newsletter to get the latest updates or follow us on{" "}
          <Link
            href={siteConfig.links.x}
            className="text-primary underline hover:text-primary/70"
            target="_blank"
          >
            twitter
          </Link>
          .
        </p>
      </div>
    </header>
  );
};
