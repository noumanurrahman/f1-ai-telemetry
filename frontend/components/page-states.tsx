import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {AlertTriangle, Loader2} from "lucide-react";
import {isRouteErrorResponse, useNavigate, useRouteError} from "react-router";

export function InlineLoading({label}: { label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin"/>
            <span>{label}</span>
        </div>
    );
}

export function InlineError({message, onRetry}: { message: string; onRetry?: () => void }) {
    return (
        <Card className="border-destructive/35 bg-destructive/5">
            <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="size-4"/>
                    <span>{message}</span>
                </div>
                {onRetry ? (
                    <Button size="sm" variant="outline" onClick={onRetry}>
                        Retry
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}

export function RouteErrorBoundary() {
    const error = useRouteError();
    const navigate = useNavigate();

    let title = "Request failed";
    let description = "Something went wrong while loading this page.";

    if (isRouteErrorResponse(error)) {
        title = `${error.status} ${error.statusText || "Error"}`;
        description = typeof error.data === "string" ? error.data : description;
    } else if (error instanceof Error) {
        description = error.message;
    }

    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Try reloading the page, or go back to home and select the race again.
                </CardContent>
                <CardFooter className="gap-2">
                    <Button variant="outline" onClick={() => navigate(0)}>
                        Reload
                    </Button>
                    <Button onClick={() => navigate("/")}>
                        Go Home
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
