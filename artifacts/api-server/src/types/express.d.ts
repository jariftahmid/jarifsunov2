import type { Logger } from "pino";
import type { ReqId } from "pino-http";

declare module "express-serve-static-core" {
  interface Request {
    id: ReqId;
    log: Logger;
    allLogs: Logger[];
  }

  interface Response {
    log: Logger;
    allLogs: Logger[];
  }
}
