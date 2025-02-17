"use client";

import { Button } from "@/components/ui/button";
import { ALLOWED_FILE_TYPES, FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isUploading?: boolean;
}

export const FileUpload = ({ onFileSelect, isUploading = false }: FileUploadProps) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isValidFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error(`${file.name} is not an image file.`);
            return false;
        }
        if (file.size > FILE_UPLOAD_MAX_SIZE) {
            toast.error(`${file.name} exceeds the size limit.`);
            return false;
        }
        return true;
    };

    const handleFile = (file: File) => {
        if (isValidFile(file)) {
            onFileSelect(file);
        }
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    return (
        <div className="w-full">
            <motion.div
                className={cn(
                    "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                    isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50",
                    isUploading && "pointer-events-none opacity-50"
                )}
                onClick={handleButtonClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isUploading}
                />
                <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {isUploading
                            ? "Uploading..."
                            : "Drag and drop an image here, or click to select"}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
