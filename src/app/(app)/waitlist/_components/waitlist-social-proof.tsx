import { Clock, Star, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Senior Developer",
    company: "Stripe",
    avatar: "/examples/avatars/01.png",
    content:
      "Saved our team 3 weeks on auth setup alone. Finally, a starter that doesn't need half the code ripped out.",
    rating: 5,
  },
  {
    name: "Jordan Rivera",
    role: "Indie Hacker",
    company: "SaaS Builder",
    avatar: "/examples/avatars/02.png",
    content:
      "Built and launched my SaaS in a weekend. The payment integration actually worked on the first try.",
    rating: 5,
  },
  {
    name: "Casey Williams",
    role: "Full Stack Dev",
    company: "Freelancer",
    avatar: "/examples/avatars/04.png",
    content:
      "Client projects went from 'months of setup' to 'let's focus on features'. Absolute game changer.",
    rating: 5,
  },
];

const stats = [
  {
    icon: Users,
    value: "1,247",
    label: "Developers Waiting",
    description: "+47 today",
  },
  {
    icon: Clock,
    value: "3 weeks",
    label: "Time Saved",
    description: "Average setup time",
  },
  {
    icon: Star,
    value: "100%",
    label: "Would Recommend",
    description: "Beta tester feedback",
  },
];

export function WaitlistSocialProof() {
  return (
    <div className="bg-white py-24 dark:bg-slate-950">
      <div className="container px-4 md:px-6">
        {/* Stats Section */}
        <div className="mb-20">
          <div className="mb-12 text-center">
            <Badge
              variant="outline"
              className="mb-4 border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300"
            >
              Join the Movement
            </Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Developers Are Already Shipping
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Real developers, real results, real time saved.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/20">
                      <Icon className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                    </div>
                  </div>
                  <div className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </div>
                  <div className="mb-1 font-medium text-slate-700 dark:text-slate-300">
                    {stat.label}
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    {stat.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-2xl font-bold md:text-3xl">What Developers Are Saying</h3>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              From side projects to enterprise apps, developers love shipping faster.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.name}
                className="border-slate-200 transition-all duration-300 hover:shadow-lg dark:border-slate-800"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        // biome-ignore lint/suspicious/noArrayIndexKey: static star rating, index is the only identity
                        key={`star-${testimonial.name}-${i}`}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    &quot;{testimonial.content}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback className="bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
