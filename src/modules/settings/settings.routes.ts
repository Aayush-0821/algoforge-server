import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import { settingsController } from "./settings.controller";
import { deleteAccountSchema, updateNotificationPreferencesSchema } from "./settings.validation";

const router = Router();

router.get(
    "/",
    authMiddleware,
    settingsController.getSettings.bind(settingsController)
);

router.patch(
    "/notifications",
    authMiddleware,
    validate(updateNotificationPreferencesSchema),
    settingsController.updateNotificationPreferences.bind(settingsController)
);

router.delete(
    "/account",
    authMiddleware,
    validate(deleteAccountSchema),
    settingsController.deleteAccount.bind(settingsController)
);

export default router;