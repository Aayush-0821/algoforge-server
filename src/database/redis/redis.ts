import { createClient } from "redis";

import { env } from "../../config/env";
import { logger } from "../../config/logger";

export const redisClient = createClient({
    url : env.REDIS_URL
});

redisClient.on("connect",()=>{
    logger.info("Redis Connecting...");
});

redisClient.on("ready",()=>{
    logger.info("Redis Connected");
});

redisClient.on("error",(err)=>{
    logger.error({ err }, "Redis Error");
});

redisClient.on("end",()=>{
    logger.info("Redis Disconnected");
});

export async function connectRedis(){
    if(!redisClient.isOpen){
        await redisClient.connect();
    }
}

export async function disconnectRedis(){
    if(redisClient.isOpen){
        await redisClient.quit();
    }
}