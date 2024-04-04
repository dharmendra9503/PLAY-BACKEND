import { body, param } from 'express-validator';

const createTweetValidator = () => {
    return [
        body("content")
            .trim()
            .notEmpty()
            .withMessage("content is required")
            .isLength({ min: 1, max: 1000 })
            .withMessage("content must be between 1 and 1000 characters")
    ];
};

export {
    createTweetValidator
};