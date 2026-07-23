import {route, type RouteConfig,} from "@react-router/dev/routes";

export default [
    route("*", "./pages/default.tsx"),
    route("/", "./pages/home.tsx"),
    route("/race/:year/:round", "./pages/race.tsx"),
] satisfies RouteConfig;