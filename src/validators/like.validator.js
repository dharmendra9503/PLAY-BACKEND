const { body, param } = require("express-validator");

export const toggleVideoLikeValidator = () => {
    return [
        param("videoId")
            .trim()
            .notEmpty()
            .withMessage("Video ID is required")
            .isMongoId()
            .withMessage("Invalid video ID")
    ];
};

export const toggleCommentLikeValidator = () => {
    return [
        param("commentId")
            .trim()
            .notEmpty()
            .withMessage("Comment ID is required")
            .isMongoId()
            .withMessage("Invalid comment ID")
    ];
};

export const toggleTweetLikeValidator = () => {
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