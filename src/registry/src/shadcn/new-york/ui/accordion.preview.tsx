"use client";

import * as React from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./accordion";

export default function AccordionPreview() {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Is it keyboard navigable?</AccordionTrigger>
                <AccordionContent>
                    Yes. You can use Tab to focus on the trigger and Space/Enter to toggle it.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>Can it be styled?</AccordionTrigger>
                <AccordionContent>
                    Yes. It uses CSS classes for styling and can be fully customized.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
