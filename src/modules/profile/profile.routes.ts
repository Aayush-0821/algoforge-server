import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import { profileController } from "./profile.controller";
import { updateProfilePreferencesSchema, updateProfileSchema } from "./profile.validation";

const router = Router();

router.get(
    "/",
    authMiddleware,
    profileController.getProfile.bind(profileController)
);

router.patch(
    "/update",
    authMiddleware,
    validate(updateProfileSchema),
    profileController.updateProfile.bind(profileController)
);

router.patch(
    "/update/preferences",
    authMiddleware,
    validate(updateProfilePreferencesSchema),
    profileController.updateProfilePreferences.bind(profileController)
);

export default router;