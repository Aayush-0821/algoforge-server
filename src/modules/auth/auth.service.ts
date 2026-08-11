import { nanoid } from "nanoid";

import { AppError } from "../../errors/app.errors";
import { emailService } from "../../services/email/email.services";

import { EMAIL_VERIFICATION_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "./auth.constants";
import { authRepository } from "./auth.repository";
import type {
  AuthResponse,
  AuthTokens,
  ForgotPasswordDTO,
  LoginUserDTO,
  RefreshTokenDTO,
  RegisterUserDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from "./auth.types";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "./utils/jwt";
import { hashPassword, verifyPassword } from "./utils/password.utils";
import { hashToken } from "./utils/token.utils";

export class AuthService {
  async register(data: RegisterUserDTO): Promise<void> {
    const existingUser = await authRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new AppError("Email already Registered.", 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await authRepository.createUser({
      email: data.email,
      password: hashedPassword,
    });

    const verificationToken = nanoid();

    const hashedVerificationToken = hashToken(verificationToken);

    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_MAX_AGE);

    await authRepository.createEmailVerificationToken({
      tokenHash: hashedVerificationToken,
      expiresAt,
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    await emailService.sendVerificationEmail(user.email, verificationToken);
  }

  async login(data: LoginUserDTO): Promise<AuthResponse> {
    const user = await authRepository.findUserByEmail(data.email);

    if (!user?.password) {
      throw new AppError("Email or Password is Wrong", 401);
    }

    const isPasswordValid = await verifyPassword(user.password, data.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid Email or Password", 401);
    }

    if (!user.isEmailVerified) {
      throw new AppError("Please Verify your Email.", 401);
    }

    const tokenId = nanoid();

    const accessToken = await generateAccessToken({
      type: "access",
      userId: user.id,
      email: user.email,
    });

    const refreshToken = await generateRefreshToken({
      type: "refresh",
      userId: user.id,
      tokenId,
    });

    const hashedRefreshToken = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken({
      tokenHash: hashedRefreshToken,
      expiresAt,
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(data: RefreshTokenDTO): Promise<AuthTokens> {
    const refreshToken = data.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh Token Missing.", 400);
    }

    const payload = await verifyRefreshToken(refreshToken);

    const hashedRefreshToken = hashToken(refreshToken);

    const storedToken = await authRepository.findRefreshToken(hashedRefreshToken);

    if (!storedToken) {
      throw new AppError("Refresh Token not Found.", 401);
    }

    if (storedToken.revokedAt !== null) {
      throw new AppError("Refresh Token revoked.", 401);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError("Refresh Token Expired.", 401);
    }

    if (payload.userId !== storedToken?.userId) {
      throw new AppError("Invalid Refresh Token!", 401);
    }

    const newAccessToken = await generateAccessToken({
      type: "access",
      userId: storedToken.userId,
      email: storedToken.user.email,
    });

    const tokenId = nanoid();

    const newRefreshToken = await generateRefreshToken({
      type: "refresh",
      userId: storedToken.userId,
      tokenId: tokenId,
    });

    const newHashedRefreshToken = hashToken(newRefreshToken);

    await authRepository.updateRefreshToken(storedToken.id, {
      revokedAt: new Date(),
    });

    await authRepository.createRefreshToken({
      tokenHash: newHashedRefreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
      user: {
        connect: {
          id: storedToken.userId,
        },
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(data: RefreshTokenDTO): Promise<void> {
    const refreshToken = data.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh Token is Missing.", 400);
    }

    const payload = await verifyRefreshToken(refreshToken);

    const hashedRefreshToken = hashToken(refreshToken);

    const storedToken = await authRepository.findRefreshToken(hashedRefreshToken);

    if (!storedToken) {
      throw new AppError("Refresh Token not Found !", 401);
    }

    if (payload.userId !== storedToken?.userId) {
      throw new AppError("Invalid Refresh Token.", 401);
    }

    if (storedToken.revokedAt !== null) {
      throw new AppError("Refresh Token already revoked.", 401);
    }

    await authRepository.updateRefreshToken(storedToken?.id, {
      revokedAt: new Date(),
    });
  }

  async verifyEmail(data: VerifyEmailDTO): Promise<void> {
    const emailToken = data.token;

    const hashedEmailToken = hashToken(emailToken);

    const hasHashedEmailToken = await authRepository.findEmailVerificationToken(hashedEmailToken);

    if (!hasHashedEmailToken) {
      throw new AppError("Email Verification Token not Found.", 404);
    }

    if (hasHashedEmailToken.usedAt !== null) {
      throw new AppError("Email Verification Token already used.", 400);
    }

    if (hasHashedEmailToken.expiresAt < new Date()) {
      throw new AppError("Email Verification token expired.", 400);
    }

    await authRepository.updateUser(hasHashedEmailToken.userId, {
      isEmailVerified: true,
    });

    await authRepository.updateEmailVerificationToken(hashedEmailToken, {
      usedAt: new Date(),
    });
  }

  async forgotPassword(data: ForgotPasswordDTO): Promise<void> {
    const email = data.email;

    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      return;
    }

    const resetToken = nanoid();

    const hashedResetToken = hashToken(resetToken);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await authRepository.createPasswordResetToken({
      tokenHash: hashedResetToken,
      expiresAt,
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(data: ResetPasswordDTO): Promise<void> {
    const resetToken = data.token;

    const password = data.password;

    if (!resetToken || !password) {
      throw new AppError("ResetToken or Password is Missing.", 404);
    }

    const hashedResetToken = hashToken(resetToken);

    const storedToken = await authRepository.findPasswordResetToken(hashedResetToken);

    if (!storedToken) {
      throw new AppError("Reset Token not Found!");
    }

    if (storedToken.usedAt !== null) {
      throw new AppError("Reset Password Token already used!", 401);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError("Reset Token is Expired!", 400);
    }

    const hashedPassword = await hashPassword(password);

    await authRepository.updateUser(storedToken.userId, {
      password: hashedPassword,
    });

    await authRepository.updatePasswordResetToken(storedToken.id, {
      usedAt: new Date(),
    });
  }
}

export const authService = new AuthService();
