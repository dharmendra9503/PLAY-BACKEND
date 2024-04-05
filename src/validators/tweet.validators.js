import { body, param } from 'express-validator';

const createTweetValidator = () => {
    return [
        body("content")
            .trim()
            .notEmpty()
            .withMessage("content is required")
            .isLength({ min: 1, max: 1000 })
            .withMessage("content must be between 1 and 1000 characters"),
    ];
};

const getUserTweetsValidator = () => {
    return [
        param("userId")
            .trim()
            .notEmpty()
            .withMessage("userId is required")
            .isMongoId()
            .withMessage("userId is invalid"),
    ];
};

const updateTweetValidator = () => {
    return [
        param("tweetId")
            .trim()
            .notEmpty()
            .withMessage("tweetId is required")
            .isMongoId()
            .withMessage("tweetId is invalid"),
        body("content")
            .trim()
            .notEmpty()
            .withMessage("content is required")
            .isLength({ min: 1, max: 1000 })
            .withMessage("content must be between 1 and 1000 characters"),
    ];
};

const deleteTweetValidator = () => {
    return [
        param("tweetId")
            .trim()
            .notEmpty()
            .withMessage("tweetId is required")
            .isMongoId()
            .withMessage("tweetId is invalid"),
    ];
};

export {
    createTweetValidator,
    getUserTweetsValidator,
    updateTweetValidator,
    deleteTweetValidator
};