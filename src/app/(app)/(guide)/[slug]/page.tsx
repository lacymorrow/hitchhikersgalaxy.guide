import { guideService } from "@/server/services/guide-service";
import { notFound } from "next/navigation";
import { BookOpen, MapIcon, Shield, ChevronLeft } from "lucide-react";
import { ShareButton } from "@/components/buttons/share-button";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { Link } from "@/components/primitives/link-with-transition";
import { motion } from "framer-motion";

export default async function GuidePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const entry = await guideService.findExistingEntry(slug);

    if (!entry) {
        notFound();
    }

    return (
        <div className="container relative min-h-screen max-w-4xl py-6 lg:py-10">
            {/* Back button that peeks out */}
            <div className="absolute -left-4 top-8 z-10 lg:-left-8">
                <Link
                    href="/"
                    className="group flex items-center gap-2 rounded-r-lg border border-l-0 border-green-500/20 bg-black px-3 py-2 font-mono text-sm text-green-500/60 transition-all hover:border-green-500/40 hover:text-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                >
                    <motion.div
                        animate={{
                            x: [0, -4, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </motion.div>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                        Back to Guide
                    </span>
                </Link>
            </div>

            {/* Electronic book frame */}
            <div className="relative rounded-lg border-4 border-green-500 bg-black p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                {/* Screen interface */}
                <div className="flex flex-col space-y-8">
                    {/* Header */}
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="font-mono text-3xl font-bold text-green-500 capitalize sm:text-4xl">
                                {entry.searchTerm}
                            </h1>
                            <ShareButton title={entry.searchTerm} />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-green-400/80">
                            <div className="flex items-center gap-1">
                                <StarFilledIcon className="h-4 w-4" />
                                <span>Reliability: {entry.reliability}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                <span>Danger Level: {entry.dangerLevel}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                <span>Views: {entry.popularity}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="space-y-6">
                        <section>
                            <p className="whitespace-pre-wrap font-mono text-green-400/80">
                                {entry.content}
                            </p>
                        </section>

                        <section>
                            <h2 className="mb-2 font-mono text-xl font-bold text-green-500">
                                Travel Advice
                            </h2>
                            <p className="font-mono text-green-400/80">{entry.travelAdvice}</p>
                        </section>

                        <section>
                            <h2 className="mb-2 font-mono text-xl font-bold text-green-500">
                                Where to Find
                            </h2>
                            <p className="font-mono text-green-400/80">{entry.whereToFind}</p>
                        </section>

                        <section>
                            <h2 className="mb-2 font-mono text-xl font-bold text-green-500">
                                What to Avoid
                            </h2>
                            <p className="font-mono text-green-400/80">{entry.whatToAvoid}</p>
                        </section>

                        <section>
                            <h2 className="mb-2 font-mono text-xl font-bold text-green-500">
                                Fun Fact
                            </h2>
                            <p className="font-mono text-green-400/80">{entry.funFact}</p>
                        </section>

                        {entry.advertisement && (
                            <section className="rounded border border-green-500/20 bg-green-500/5 p-4">
                                <h2 className="mb-2 font-mono text-sm font-bold text-green-500">
                                    A word from our sponsors
                                </h2>
                                <p className="font-mono text-sm italic text-green-400/60">
                                    {entry.advertisement}
                                </p>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
