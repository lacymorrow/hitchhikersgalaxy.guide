"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TestPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setProcessedUrl(null);
    };

    const handleProcess = async () => {
        if (!selectedFile) return;

        try {
            setIsProcessing(true);
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch("/api/test", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to process image");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setProcessedUrl(url);
            toast.success("Face detected and cropped successfully!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container max-w-4xl py-8">
            <div className="space-y-8">
                <div className="space-y-4 text-center">
                    <h1 className="text-3xl font-bold">Face Detection Test</h1>
                    <p className="text-muted-foreground">
                        Upload an image to test face detection and cropping
                    </p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                        Select Image
                    </label>

                    <div className="flex w-full max-w-2xl justify-center gap-8">
                        <div className="space-y-2">
                            <h2 className="text-center font-semibold">Original</h2>
                            <div className="relative h-64 w-64 overflow-hidden rounded-lg border bg-muted">
                                {previewUrl ? (
                                    <Image
                                        src={previewUrl}
                                        alt="Original"
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No image selected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-center font-semibold">Processed</h2>
                            <div className="relative h-64 w-64 overflow-hidden rounded-lg border bg-muted">
                                {processedUrl ? (
                                    <Image
                                        src={processedUrl}
                                        alt="Processed"
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        {isProcessing ? "Processing..." : "Not processed"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleProcess}
                        disabled={!selectedFile || isProcessing}
                        className="min-w-32"
                    >
                        {isProcessing ? "Processing..." : "Process Image"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
