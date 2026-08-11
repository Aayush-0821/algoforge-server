import { Prisma, User } from "../../../generated/postgres";
import { postgres } from "../../database/postgres/postgres";

export class AuthRepository{
    async findUserById(id:string):Promise<User | null>{
        return postgres.user.findUnique({
            where: {id}
        });
    }

    async findUserByEmail(email:string):Promise<User | null>{
        return postgres.user.findUnique({
            where: {email}
        });
    }

    async createUser(data: Prisma.UserCreateInput):Promise<User>{
        return postgres.user.create({
            data,
        });
    }

    async updateUser(userId:string, data: Prisma.UserUpdateInput):Promise<User>{
        return postgres.user.update({
            where: {
                id:userId
            },
            data
        });
    }

    async createRefreshToken(data: Prisma.RefreshTokenCreateInput){
        return postgres.refreshToken.create({
            data
        });
    }

    async findRefreshToken(tokenHash:string){
        return postgres.refreshToken.findUnique({
            where:{tokenHash},
            include:{user:true}
        });
    }

    async updateRefreshToken(
        id:string,
        data: Prisma.RefreshTokenUpdateInput
    ){
        return postgres.refreshToken.update({
            where:{id},
            data
        });
    }

    async createEmailVerificationToken(
        data: Prisma.EmailVerificationTokenCreateInput
    ){
        return postgres.emailVerificationToken.create({
            data
        });
    }

    async findEmailVerificationToken(tokenHash:string){
        return postgres.emailVerificationToken.findUnique({
            where:{tokenHash},
            include:{
                user:true
            }
        });
    }

    async updateEmailVerificationToken(
        tokenHash:string,
        data:Prisma.EmailVerificationTokenUpdateInput
    ){
        return postgres.emailVerificationToken.update({
            where:{tokenHash},
            data
        });
    }

    async createPasswordResetToken(data:Prisma.PasswordResetTokenCreateInput){
        return postgres.passwordResetToken.create({
            data
        });
    }

    async findPasswordResetToken(tokenHash:string){
        return postgres.passwordResetToken.findUnique({
            where:{tokenHash},
            include:{
                user:true
            }
        });
    }

    async updatePasswordResetToken(
        id: string,
        data: Prisma.PasswordResetTokenUpdateInput
    ){
        return postgres.passwordResetToken.update({
            where:{id},
            data
        });
    }

    async createLoginAttempt(data:Prisma.LoginAttemptCreateInput){
        return postgres.loginAttempt.create({
            data
        });
    }

    async findOAuthAccount(
        provider: "GOOGLE" | "GITHUB",
        providerAccountId: string,
    ){
        return postgres.oAuthAccount.findUnique({
            where:{
                provider_providerAccountId:{
                    provider,
                    providerAccountId,
                },
            },
            include:{
                user:true,
            },
        });
    }

    async createOAuthAccount(data:{
        provider: "GOOGLE" | "GITHUB";
        providerAccountId: string;
        user:{
            connect:{
                id:string;
            }
        }
    }){
        return postgres.oAuthAccount.create({
            data,
        });
    };

    async findUserByEmailWithOAuthAccounts(email:string){
        return postgres.user.findUnique({
            where:{email},
            include:{
                oauthAccounts:true,
            }
        });
    }
}

export const authRepository = new AuthRepository();