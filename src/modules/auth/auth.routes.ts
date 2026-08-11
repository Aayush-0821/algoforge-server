import { Router } from "express";

import { validate } from "../../middleware/validate.middleware";

import { authController } from "./auth.controller";
import { registerSchema, loginSchema, verifyEmailSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validation";
import { oauthController } from "./oauth/oauth.controller";

const router = Router();

router.post(
    "/register",
    validate(registerSchema),
    authController.register.bind(authController)
);

router.post(
    "/login",
    validate(loginSchema),
    authController.login.bind(authController)
);

router.post(
    "/refresh",
    validate(refreshTokenSchema),
    authController.refresh.bind(authController)
);

router.post(
    "/logout",
    validate(refreshTokenSchema),
    authController.logout.bind(authController)
);

router.post(
    "/verify-email",
    validate(verifyEmailSchema),
    authController.verifyEmail.bind(authController)
);

router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    authController.forgotPassword.bind(authController)
);

router.post(
    "/reset-password",
    validate(resetPasswordSchema),
    authController.resetPassword.bind(authController)
);

router.get(
    "/google",
    oauthController.googleRedirect.bind(oauthController)
);

router.get(
    "/google/callback",
    oauthController.googleCallback.bind(oauthController)
);

router.get(
    "/github",
    oauthController.githubRedirect.bind(oauthController)
);

router.get(
    "/github/callback",
    oauthController.githubCallback.bind(oauthController)
);

export default router;