import type { JWTPayload } from "jose";

export interface RegisterUserDTO {
  email: string;
  password: string;
}

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
}

export interface VerifyEmailDTO {
  token: string;
}

export interface AccessTokenPayload extends JWTPayload {
  type: "access";
  userId: string;
  email: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  type: "refresh";
  userId: string;
  tokenId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    isEmailVerified: boolean;
  };
  tokens: AuthTokens;
}

export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
  path: string;
}

export interface EmailVerificationPayload {
  userId: string;
  email: string;
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
}
