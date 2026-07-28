import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";
import { redis } from "./config/redis";

export async function bootstrap(){
    try {

        await prisma.$connect();

        await redis.connect();

        const server = app.listen(env.PORT,()=>{
            logger.info(`Server Running on Port ${env.PORT}`);
        });

        return server;
    } catch (error) {
        logger.fatal(error);

        process.exit(1);
    }
}