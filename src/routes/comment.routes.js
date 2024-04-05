import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId")
    .get(getVideoComments) // To get all comments for a video
    .post(addComment);     // To add a new comment to a video

router.route("/c/:commentId")
    .delete(deleteComment) // To delete a comment
    .patch(updateComment); // To update a comment

export default router;