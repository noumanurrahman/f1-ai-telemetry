import {route, type RouteConfig,} from "@react-router/dev/routes";

export default [
    route("*", "./pages/default.tsx"),
    route("/", "./pages/home.tsx"),
    route("/:year/:round", "./pages/race.tsx"),
    route("/:year/:round/:driver", "./pages/dashboard.tsx"),
] satisfies RouteConfig;