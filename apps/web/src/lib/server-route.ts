export type RouteHandler = (ctx: {
  request: Request;
  params: Record<string, string>;
}) => Promise<Response> | Response;

export interface ServerFileRouteConfig {
  path: string;
  methods: Record<string, RouteHandler>;
}

export function createServerFileRoute(path: string) {
  return {
    methods(handlers: Record<string, RouteHandler>) {
      return {
        path,
        handlers,
      };
    },
  };
}
