import { Button } from "@/components/ui/button";

interface HeroProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage?: string;
}

export const Hero = ({ title, subtitle, buttonText, buttonLink, backgroundImage }: HeroProps) => {
  return (
    <div className="relative flex min-h-[600px] items-center justify-center">
      {/* Background Image with Overlay */}
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="mb-6 text-balance text-4xl font-bold text-white md:text-6xl">{title}</h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-200 md:text-2xl">{subtitle}</p>
        <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
          <a href={buttonLink}>{buttonText}</a>
        </Button>
      </div>
    </div>
  );
};
