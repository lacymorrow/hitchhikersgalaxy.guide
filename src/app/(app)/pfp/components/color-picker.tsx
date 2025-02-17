"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ColorPickerProps {
    onChange: (color: string) => void;
    value: string;
}

const PRESET_COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#3498DB",
];

export const ColorPicker = ({ onChange, value }: ColorPickerProps) => {
    const [customColor, setCustomColor] = useState(value);

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="color">Background Color</Label>
                <div className="flex gap-2 mt-1">
                    <Input
                        type="color"
                        id="color"
                        value={customColor}
                        onChange={(e) => {
                            setCustomColor(e.target.value);
                            onChange(e.target.value);
                        }}
                        className="w-16 h-10 p-1"
                    />
                    <Input
                        type="text"
                        value={customColor}
                        onChange={(e) => {
                            setCustomColor(e.target.value);
                            onChange(e.target.value);
                        }}
                        placeholder="#000000"
                        className="flex-1"
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((color) => (
                    <Button
                        key={color}
                        type="button"
                        onClick={() => {
                            setCustomColor(color);
                            onChange(color);
                        }}
                        className="w-full h-10 p-0"
                        style={{ backgroundColor: color }}
                        variant="outline"
                    />
                ))}
            </div>
        </div>
    );
};
