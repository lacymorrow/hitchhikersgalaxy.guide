import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/primitives/page-header"
import type { RegistryItem } from "../../../../registry/schema"

interface DocHeaderProps {
    item: RegistryItem
}

export function DocHeader({ item }: DocHeaderProps) {
    return (
        <PageHeader className="flex items-center justify-between">
            <div>
                <PageHeaderHeading>{item.name}</PageHeaderHeading>
                {item.description && (
                    <PageHeaderDescription>{item.description}</PageHeaderDescription>
                )}
            </div>
            <div className="flex items-center space-x-2">
                {item.categories?.map((category) => (
                    <span
                        key={category}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-sm font-medium"
                    >
                        {category}
                    </span>
                ))}
            </div>
        </PageHeader>
    )
}
