"use client";

import DOMPurify from "isomorphic-dompurify";
import React from "react";

interface SafeHtmlProps {
    html: string;
    className?: string;
}

/**
 * Safely renders HTML content by sanitizing it with DOMPurify
 * @param html The HTML content to sanitize and render
 * @param className Optional CSS class name for the wrapper div
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
    // Sanitize the HTML before rendering
    const sanitizedHtml = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
            "p", "h1", "h2", "h3", "h4", "h5", "h6",
            "a", "ul", "ol", "li", "blockquote", "strong",
            "em", "s", "code", "pre", "br", "span", "div",
            "table", "thead", "tbody", "tr", "th", "td"
        ],
        ALLOWED_ATTR: [
            "href", "title", "target", "rel", "class", "id"
        ],
    });

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
}
