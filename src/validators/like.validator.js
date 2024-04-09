import { body, param } from "express-validator";

const toggleVideoLikeValidator = () => {
    return [
        param("videoId")
            .trim()
            .notEmpty()
            .withMessage("Video ID is required")
            .isMongoId()
            .withMessage("Invalid video ID")
    ];
};

const toggleCommentLikeValidator = () => {
    return [
        param("commentId")
            .trim()
            .notEmpty()
            .withMessage("Comment ID is required")
            .isMongoId()
            .withMessage("Invalid comment ID")
    ];
};

const toggleTweetLikeValidator = () => {
    return [
        param("tweetId")
            .trim()
            .notEmpty()
            .withMessage("Tweet ID is required")
            .isMongoId()
            .withMessage("Invalid tweet ID")
    ];
};

export {
    toggleVideoLikeValidator,
    toggleCommentLikeValidator,
    toggleTweetLikeValidator
}