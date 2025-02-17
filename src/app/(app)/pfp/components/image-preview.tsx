"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
    src?: string;
    backgroundColor: string;
    className?: string;
    isProcessing?: boolean;
}

export const ImagePreview = ({
    src,
    backgroundColor,
    className,
    isProcessing = false,
}: ImagePreviewProps) => {
    return (
        <div
            className={cn(
                "relative w-64 h-64 rounded-full overflow-hidden",
                isProcessing && "animate-pulse",
                className
            )}
            style={{ backgroundColor }}
        >
            {src && (
                <Image
                    src={src}
                    alt="Profile preview"
                    width={256}
                    height={256}
                    className="object-contain"
                    priority
                />
            )}
            {!src && !isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    Preview
                </div>
            )}
            {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    Processing...
                </div>
            )}
        </div>
    );
};
