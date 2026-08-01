// Auto-generated Cloudflare Worker configuration types.
// This project is a static site with no Worker bindings, so the interface is empty.
interface Env {}

interface EventContext<Env, P extends string, Data> {
  request: Request;
  functionPath: string;
  params: Record<P, string | string[]>;
  data: Data;
  env: Env;
  next: (input?: RequestInfo, init?: RequestInit) => Promise<Response>;
  waitUntil: (promise: Promise<any>) => void;
}

type PagesFunction<Env = unknown, P extends string = string, Data = Record<string, unknown>> = (
  context: EventContext<Env, P, Data>
) => Response | Promise<Response>;

