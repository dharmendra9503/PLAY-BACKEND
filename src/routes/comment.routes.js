import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createCommentValidator,
    deleteCommentValidator,
    updateCommentValidator
} from '../validators/comment.validators.js';
import { validate } from '../validators/validate.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId")
    .get(getVideoComments) // To get all comments for a video
    .post(createCommentValidator(), validate, addComment);     // To add a new comment to a video

router.route("/c/:commentId")
    .delete(deleteCommentValidator(), validate, deleteComment) // To delete a comment
    .patch(updateCommentValidator(), validate, updateComment); // To update a comment

export default router;