import type {ReactNode} from "react";
import {Links, Meta, Outlet, Scripts, ScrollRestoration} from "react-router";

export function Layout({children}: { children: ReactNode }) {
    return (
        <html lang="en">
        <head>
            <meta charSet="UTF-8"/>
            <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <Meta/>
            <Links/>
            <title>F1 AI Telemetry</title>
        </head>
        <body id="root" className="dark">
        {children}
        <ScrollRestoration/>
        <Scripts/>
        </body>
        </html>
    )
}

export default function Root() {
    return <Outlet/>;
}