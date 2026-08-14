import type { Request, Response, NextFunction } from "express";

import { AppError } from "../errors/app.errors";
import { verifyAccessToken } from "../modules/auth/utils/jwt";


export async function authMiddleware(
    req:Request,
    res:Response,
    next:NextFunction
):Promise<void>{
    try {
        const authHeader = req.headers.authorization;
    
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({
                message: "Authorization Required"
            });
            return;
        }
    
        const accessToken = authHeader.substring(7);
    
        const payload = await verifyAccessToken(accessToken);
    
        if(!payload){
            throw new AppError("Access Token no Valid.",401);
        }
    
        req.user = {
            id: payload.userId,
            email: payload.email
        }
    
        next();
    } catch (error) {
        next(error);
    }
}