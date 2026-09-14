"use client";

import { Builder } from "@builder.io/react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  image?: string;
}

interface TestimonialsProps {
  title: string;
  subtitle: string;
  testimonials: Testimonial[];
}

export const Testimonials = ({ title, subtitle, testimonials }: TestimonialsProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = React.useCallback((emblaApi: any) => {
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, []);

  React.useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">{subtitle}</p>
        </div>

        {/* Carousel */}
        <div className="relative mx-auto max-w-4xl">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {testimonials.map((testimonial, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
                <div key={index} className="relative min-w-0 flex-[0_0_100%] pl-4">
                  <div className="rounded-lg bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center">
                      {testimonial.image && (
                        <div className="mr-4">
                          <img
                            src={testimonial.image}
                            alt={testimonial.author}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                    <blockquote className="text-lg text-gray-700">
                      &quot;{testimonial.quote}&quot;
                    </blockquote>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-0 top-1/2 -translate-x-full -translate-y-1/2",
              !canScrollPrev && "cursor-not-allowed opacity-50"
            )}
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-full",
              !canScrollNext && "cursor-not-allowed opacity-50"
            )}
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

// Register the component with Builder.io
Builder.registerComponent(Testimonials, {
  name: "Testimonials",
  inputs: [
    {
      name: "title",
      type: "string",
      defaultValue: "What Our Customers Say",
    },
    {
      name: "subtitle",
      type: "string",
      defaultValue: "Hear from our satisfied customers",
    },
    {
      name: "testimonials",
      type: "list",
      defaultValue: [
        {
          quote: "This product has completely transformed how we work.",
          author: "John Doe",
          role: "CEO at Company",
          image: "",
        },
        {
          quote: "The best solution we have found in the market.",
          author: "Jane Smith",
          role: "Director of Operations",
          image: "",
        },
      ],
      subFields: [
        {
          name: "quote",
          type: "string",
        },
        {
          name: "author",
          type: "string",
        },
        {
          name: "role",
          type: "string",
        },
        {
          name: "image",
          type: "string",
        },
      ],
    },
  ],
});
