import { nanoid } from "nanoid";
import pinoHttp from "pino-http";

import { logger } from "../config/logger";

export const requestLogger = pinoHttp({
  logger,

  genReqId: (req, res) => {
    const existing = req.headers["x-request-id"];

    if (typeof existing === "string") {
      return existing;
    }

    const id = nanoid();

    res.setHeader("x-request-id", id);

    return id;
  },
});
