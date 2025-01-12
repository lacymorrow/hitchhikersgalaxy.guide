"use client"

import { Badge } from "@/components/ui/badge"
import { type RegistryItem } from "../../../../registry/schema"

interface DocMetadataProps {
    item: RegistryItem
}

export function DocMetadata({ item }: DocMetadataProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Metadata</h2>
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Type */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                    <Badge variant="secondary">{item.type.replace("registry:", "")}</Badge>
                </div>

                {/* Categories */}
                {item.categories && item.categories.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                            {item.categories.map((category) => (
                                <Badge key={category} variant="outline">
                                    {category}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Library */}
                {item.meta?.library && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Library</h3>
                        <Badge variant="secondary">{item.meta.library}</Badge>
                    </div>
                )}

                {/* Author */}
                {item.meta?.author && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Author</h3>
                        <p className="text-sm">{item.meta.author}</p>
                    </div>
                )}

                {/* License */}
                {item.meta?.license && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">License</h3>
                        <p className="text-sm">{item.meta.license}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
