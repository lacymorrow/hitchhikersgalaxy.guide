import ffmpeg from "fluent-ffmpeg";
import { type ProcessOptions } from "../types";

interface VideoMetadata {
    duration: number;
    format: string;
    bitrate: number;
    size: number;
    dimensions: {
        width: number;
        height: number;
    };
    fps: number;
    hasAudio: boolean;
    audioCodec?: string;
    videoCodec?: string;
}

interface VideoProcessOptions extends ProcessOptions {
    video?: {
        codec?: "h264" | "h265" | "vp9" | "av1";
        bitrate?: number;
        fps?: number;
        keyframeInterval?: number;
    };
    audio?: {
        codec?: "aac" | "opus" | "mp3";
        bitrate?: number;
        channels?: 1 | 2;
        sampleRate?: 44100 | 48000;
    };
}

export class VideoProcessor {
    private static instance: VideoProcessor;

    private constructor() {
        // Private constructor for singleton
        // Configure FFmpeg path if needed
        // ffmpeg.setFfmpegPath("/path/to/ffmpeg");
    }

    public static getInstance(): VideoProcessor {
        if (!VideoProcessor.instance) {
            VideoProcessor.instance = new VideoProcessor();
        }
        return VideoProcessor.instance;
    }

    public async processVideo(
        input: string,
        output: string,
        options: VideoProcessOptions,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            let command = ffmpeg(input);

            // Apply video processing options
            if (options.video) {
                const { codec, bitrate, fps, keyframeInterval } = options.video;

                if (codec) {
                    switch (codec) {
                        case "h264":
                            command = command
                                .videoCodec("libx264")
                                .addOption("-preset", "slow")
                                .addOption("-crf", "23");
                            break;
                        case "h265":
                            command = command
                                .videoCodec("libx265")
                                .addOption("-preset", "slow")
                                .addOption("-crf", "28");
                            break;
                        case "vp9":
                            command = command
                                .videoCodec("libvpx-vp9")
                                .addOption("-b:v", "0")
                                .addOption("-crf", "30")
                                .addOption("-row-mt", "1");
                            break;
                        case "av1":
                            command = command
                                .videoCodec("libaom-av1")
                                .addOption("-crf", "30")
                                .addOption("-strict", "experimental");
                            break;
                    }
                }

                if (bitrate) {
                    command = command.videoBitrate(bitrate);
                }

                if (fps) {
                    command = command.fps(fps);
                }

                if (keyframeInterval) {
                    command = command.addOption("-g", keyframeInterval.toString());
                }
            }

            // Apply audio processing options
            if (options.audio) {
                const { codec, bitrate, channels, sampleRate } = options.audio;

                if (codec) {
                    switch (codec) {
                        case "aac":
                            command = command.audioCodec("aac").audioBitrate("128k");
                            break;
                        case "opus":
                            command = command.audioCodec("libopus").audioBitrate("96k");
                            break;
                        case "mp3":
                            command = command.audioCodec("libmp3lame").audioBitrate("192k");
                            break;
                    }
                }

                if (bitrate) {
                    command = command.audioBitrate(bitrate);
                }

                if (channels) {
                    command = command.audioChannels(channels);
                }

                if (sampleRate) {
                    command = command.audioFrequency(sampleRate);
                }
            }

            // Apply resize if specified
            if (options.resize) {
                const { width, height, maintainAspectRatio } = options.resize;
                if (maintainAspectRatio) {
                    command = command.size(`${width}x?`);
                } else {
                    command = command.size(`${width}x${height}`);
                }
            }

            // Save the processed video
            command
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .save(output);
        });
    }

    public async generateThumbnail(
        input: string,
        output: string,
        timestamp = "00:00:01",
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(input)
                .screenshots({
                    timestamps: [timestamp],
                    filename: output,
                    size: "320x?",
                })
                .on("end", () => resolve())
                .on("error", (err) => reject(err));
        });
    }

    public async extractMetadata(input: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(input, (err, metadata) => {
                if (err) return reject(err);

                const videoStream = metadata.streams.find(
                    (s) => s.codec_type === "video",
                );
                const audioStream = metadata.streams.find(
                    (s) => s.codec_type === "audio",
                );

                if (!videoStream) {
                    return reject(new Error("No video stream found"));
                }

                resolve({
                    duration: metadata.format.duration ?? 0,
                    format: metadata.format.format_name ?? "",
                    bitrate: parseInt(metadata.format.bit_rate ?? "0", 10),
                    size: metadata.format.size ?? 0,
                    dimensions: {
                        width: videoStream.width ?? 0,
                        height: videoStream.height ?? 0,
                    },
                    fps: eval(videoStream.r_frame_rate ?? "0"),
                    hasAudio: !!audioStream,
                    audioCodec: audioStream?.codec_name,
                    videoCodec: videoStream.codec_name,
                });
            });
        });
    }

    public async optimizeForWeb(
        input: string,
        output: string,
        quality: "low" | "medium" | "high" = "medium",
    ): Promise<void> {
        const options: VideoProcessOptions = {
            video: {
                codec: "h264", // Most compatible
                fps: 30,
                keyframeInterval: 60,
            },
            audio: {
                codec: "aac",
                channels: 2,
                sampleRate: 44100,
            },
            resize: {
                width: 1280,
                height: 720,
                maintainAspectRatio: true,
            },
        };

        // Adjust quality settings
        switch (quality) {
            case "low":
                options.video.bitrate = 1000; // 1 Mbps
                options.audio.bitrate = 96; // 96 kbps
                break;
            case "medium":
                options.video.bitrate = 2500; // 2.5 Mbps
                options.audio.bitrate = 128; // 128 kbps
                break;
            case "high":
                options.video.bitrate = 5000; // 5 Mbps
                options.audio.bitrate = 192; // 192 kbps
                break;
        }

        return this.processVideo(input, output, options);
    }

    public async extractFrames(
        input: string,
        outputPattern: string,
        fps = 1,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(input)
                .fps(fps)
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .save(outputPattern);
        });
    }
}
