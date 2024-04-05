import { Router } from "express";
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    userChangeCurrentPasswordValidator,
    userChannelProfileValidator,
    userLoginValidator,
    userRegisterValidator,
    userUpdateAccountDetailsValidator
} from "../validators/user.validators.js";
import { validate } from "../validators/validate.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    userRegisterValidator(),
    validate,
    registerUser
);

router.route("/login").post(userLoginValidator(), validate, loginUser);


//secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, userUpdateAccountDetailsValidator(), validate, updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, userChannelProfileValidator(), validate, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;