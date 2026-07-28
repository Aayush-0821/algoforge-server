import { NextFunction, Request,Response } from "express";

import { env } from "../config/env";
import { logger } from "../config/logger";


export function errorHandler(
    err:Error,
    req:Request,
    res:Response,
    _next:NextFunction
){
    logger.error({
        err,
        requestId: req.id
    });

    res.status(500).json({
        success:false,
        message: env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    });
}