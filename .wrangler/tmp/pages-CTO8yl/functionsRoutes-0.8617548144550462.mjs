import { onRequest as ___middleware_ts_onRequest } from "C:\\Users\\vaibh\\PROGRAMMING\\PROJECTS\\tryonlinecalculator.com\\functions\\_middleware.ts"
import { onRequest as __index_ts_onRequest } from "C:\\Users\\vaibh\\PROGRAMMING\\PROJECTS\\tryonlinecalculator.com\\functions\\index.ts"

export const routes = [
    {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [__index_ts_onRequest],
    },
  ]