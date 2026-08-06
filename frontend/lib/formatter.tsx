import React from "react";

export const formatText = (text: string): React.JSX.Element[] => {
    const textParts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g);
    const boldRegex = /^\*\*[^*]+\*\*$/;
    const italicRegex = /^\*[^*]+\*$/;
    const boldAndItalicRegex = /^_[^_]+_$/;

    const textStyle = {
        bold: "font-bold text-foreground",
        italic: "italic text-foreground",
        boldAndItalic: "font-bold italic text-foreground",
    };

    return textParts.map((part, index) => {
        // Bold text
        if (boldRegex.test(part)) {
            return (
                <span key={index} className={textStyle.bold}>
                    {part.slice(2, -2)}
                </span>
            );
        }

        // Italic text
        if (italicRegex.test(part)) {
            return (
                <span key={index} className={textStyle.italic}>
                    {part.slice(1, -1)}
                </span>
            );
        }

        // Bold and italic text
        if (boldAndItalicRegex.test(part)) {
            return (
                <span key={index} className={textStyle.boldAndItalic}>
                    {part.slice(1, -1)}
                </span>
            );
        }

        // Default text
        return <span key={index}>{part}</span>;
    });
};