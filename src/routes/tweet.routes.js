import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    createTweetValidator,
    deleteTweetValidator,
    getUserTweetsValidator,
    updateTweetValidator
} from '../validators/tweet.validators.js';
import { validate } from '../validators/validate.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .post(createTweetValidator(), validate, createTweet);

router
    .route("/user/:userId")
    .get(getUserTweetsValidator(), validate, getUserTweets);

router
    .route("/:tweetId")
    .patch(updateTweetValidator(), validate, updateTweet)
    .delete(deleteTweetValidator(), validate, deleteTweet);

export default router;