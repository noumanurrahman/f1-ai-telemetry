import {useState} from "react";

function initials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export default function DriverHeadshot({
                                           src,
                                           name,
                                           teamColor,
                                           className = "size-16",
                                       }: {
    src: string | null | undefined;
    name: string;
    teamColor: string;
    className?: string;
}) {
    const [broken, setBroken] = useState(false);
    const showImage = Boolean(src) && !broken;

    return (
        <div
            className={`${className} shrink-0 overflow-hidden rounded-xl border-2 bg-muted/30`}
            style={{borderColor: teamColor}}
        >
            {showImage ? (
                <img
                    src={src ?? ""}
                    alt={name}
                    onError={() => setBroken(true)}
                    className="size-full object-cover object-top"
                    loading="lazy"
                />
            ) : (
                <div
                    className="flex size-full items-center justify-center text-sm font-medium text-foreground/90"
                    style={{background: `linear-gradient(145deg, color-mix(in oklch, ${teamColor}, transparent 75%), transparent)`}}
                >
                    {initials(name)}
                </div>
            )}
        </div>
    );
}
