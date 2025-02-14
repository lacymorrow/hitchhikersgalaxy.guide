import sharp from "sharp";
import { type ProcessOptions } from "../types";

export class ImageProcessor {
    private static instance: ImageProcessor;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): ImageProcessor {
        if (!ImageProcessor.instance) {
            ImageProcessor.instance = new ImageProcessor();
        }
        return ImageProcessor.instance;
    }

    public async processImage(
        input: Buffer,
        options: ProcessOptions,
    ): Promise<{ data: Buffer; metadata: sharp.Metadata }> {
        let processor = sharp(input);

        // Get original metadata
        const metadata = await processor.metadata();

        // Apply resize if specified
        if (options.resize) {
            const { width, height, maintainAspectRatio } = options.resize;
            processor = processor.resize(width, height, {
                fit: maintainAspectRatio ? "inside" : "fill",
                withoutEnlargement: true,
            });
        }

        // Apply transformations if specified
        if (options.transform) {
            const { rotate, flip, crop } = options.transform;

            if (rotate) {
                processor = processor.rotate(rotate);
            }

            if (flip === "horizontal") {
                processor = processor.flop();
            } else if (flip === "vertical") {
                processor = processor.flip();
            }

            if (crop) {
                processor = processor.extract({
                    left: crop.x,
                    top: crop.y,
                    width: crop.width,
                    height: crop.height,
                });
            }
        }

        // Apply compression and format conversion if specified
        if (options.compress) {
            const { quality, format } = options.compress;

            switch (format?.toLowerCase()) {
                case "jpeg":
                case "jpg":
                    processor = processor.jpeg({
                        quality: quality ?? 80,
                        mozjpeg: true,
                    });
                    break;
                case "png":
                    processor = processor.png({
                        quality: quality ?? 80,
                        compressionLevel: 9,
                        palette: true,
                    });
                    break;
                case "webp":
                    processor = processor.webp({
                        quality: quality ?? 80,
                        effort: 6,
                    });
                    break;
                case "avif":
                    processor = processor.avif({
                        quality: quality ?? 80,
                        effort: 9,
                    });
                    break;
                default:
                    // Default to WebP for best compression
                    processor = processor.webp({
                        quality: quality ?? 80,
                        effort: 6,
                    });
            }
        }

        // Process the image
        const data = await processor.toBuffer();

        // Get final metadata
        const finalMetadata = await sharp(data).metadata();

        return { data, metadata: finalMetadata };
    }

    public async generateThumbnail(input: Buffer, size = 256): Promise<Buffer> {
        return sharp(input)
            .resize(size, size, {
                fit: "cover",
                position: "centre",
            })
            .webp({
                quality: 80,
                effort: 6,
            })
            .toBuffer();
    }

    public async extractMetadata(input: Buffer): Promise<sharp.Metadata> {
        return sharp(input).metadata();
    }

    public async optimizeForWeb(input: Buffer): Promise<Buffer> {
        const metadata = await sharp(input).metadata();
        const processor = sharp(input);

        // Determine optimal format based on image characteristics
        if (metadata.hasAlpha) {
            // Use WebP for images with transparency
            return processor
                .webp({
                    quality: 85,
                    effort: 6,
                    alphaQuality: 90,
                })
                .toBuffer();
        } else {
            // Use AVIF for best compression on non-transparent images
            return processor
                .avif({
                    quality: 85,
                    effort: 9,
                })
                .toBuffer();
        }
    }

    public async analyzeImage(input: Buffer): Promise<{
        metadata: sharp.Metadata;
        stats: sharp.Stats;
        isAnimated: boolean;
        hasAlpha: boolean;
    }> {
        const metadata = await sharp(input).metadata();
        const stats = await sharp(input).stats();

        return {
            metadata,
            stats,
            isAnimated: metadata.pages ? metadata.pages > 1 : false,
            hasAlpha: metadata.hasAlpha ?? false,
        };
    }
}
