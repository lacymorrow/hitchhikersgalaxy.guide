"use client";

import { Builder } from "@builder.io/react";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesGridProps {
  title: string;
  subtitle: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

export const FeaturesGrid = ({ title, subtitle, features, columns = 3 }: FeaturesGridProps) => {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">{subtitle}</p>
        </div>

        {/* Features Grid */}
        <div
          className={cn("grid gap-8", {
            "grid-cols-1 md:grid-cols-2": columns === 2,
            "grid-cols-1 md:grid-cols-3": columns === 3,
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4": columns === 4,
          })}
        >
          {features.map((feature, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
              key={index}
              className="rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-lg"
            >
              {feature.icon && (
                <div className="mb-4 h-12 w-12">
                  <img src={feature.icon} alt="" className="h-full w-full object-contain" />
                </div>
              )}
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Register the component with Builder.io
Builder.registerComponent(FeaturesGrid, {
  name: "FeaturesGrid",
  inputs: [
    {
      name: "title",
      type: "string",
      defaultValue: "Our Features",
    },
    {
      name: "subtitle",
      type: "string",
      defaultValue: "Everything you need to succeed",
    },
    {
      name: "columns",
      type: "number",
      defaultValue: 3,
      enum: [
        { label: "2 Columns", value: 2 },
        { label: "3 Columns", value: 3 },
        { label: "4 Columns", value: 4 },
      ],
    },
    {
      name: "features",
      type: "list",
      defaultValue: [
        {
          title: "Feature 1",
          description: "Description of feature 1",
          icon: "",
        },
        {
          title: "Feature 2",
          description: "Description of feature 2",
          icon: "",
        },
        {
          title: "Feature 3",
          description: "Description of feature 3",
          icon: "",
        },
      ],
      subFields: [
        {
          name: "title",
          type: "string",
        },
        {
          name: "description",
          type: "string",
        },
        {
          name: "icon",
          type: "string",
        },
      ],
    },
  ],
});
