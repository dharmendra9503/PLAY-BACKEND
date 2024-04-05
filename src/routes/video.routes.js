import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import {
    videoIdValidator,
    videoPublishValidator
} from '../validators/video.validators.js';
import { validate } from "../validators/validate.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "video",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        videoPublishValidator(),
        validate,
        publishAVideo
    );

router
    .route("/:videoId")
    .get(videoIdValidator(), validate, getVideoById)
    .delete(videoIdValidator(), validate, deleteVideo)
    .patch(upload.single("thumbnail"), videoIdValidator(), validate, updateVideo);

router.route("/toggle/publish/:videoId")
    .patch(videoIdValidator(), validate, togglePublishStatus);

export default router