import {Button} from "@/components/ui/button.tsx";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {useNavigate} from "react-router";

export default function Component() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>404 — Page not found</CardTitle>
                    <CardDescription>The page you requested does not exist.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Check the URL or go back to the home page.
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => navigate("/")}>Go to Home</Button>
                </CardFooter>
            </Card>
        </div>
    );
}