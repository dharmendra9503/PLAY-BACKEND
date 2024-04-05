import { body, param } from 'express-validator';

const createCommentValidator = () => {
    return [
        body("content")
            .trim()
            .notEmpty()
            .withMessage("content is required")
            .isLength({ min: 1, max: 1000 })
            .withMessage("content must be between 1 and 1000 characters"),
        param("videoId")
            .trim()
            .notEmpty()
            .withMessage("videoId is required")
            .isMongoId()
            .withMessage("videoId is invalid")
    ];
};

const updateCommentValidator = () => {
    return [
        body("content")
            .trim()
            .notEmpty()
            .withMessage("content is required")
            .isLength({ min: 1, max: 1000 })
            .withMessage("content must be between 1 and 1000 characters"),
        param("commentId")
            .trim()
            .notEmpty()
            .withMessage("commentId is required")
            .isMongoId()
            .withMessage("commentId is invalid")
    ];
};

const deleteCommentValidator = () => {
    return [
        param("commentId")
            .trim()
            .notEmpty()
            .withMessage("commentId is required")
            .isMongoId()
            .withMessage("commentId is invalid")
    ];
};

const getVideoCommentsValidator = () => {
    return [
        param("videoId")
            .trim()
            .notEmpty()
            .withMessage("videoId is required")
            .isMongoId()
            .withMessage("videoId is invalid")
    ];
};

export {
    createCommentValidator,
    updateCommentValidator,
    deleteCommentValidator,
    getVideoCommentsValidator
};