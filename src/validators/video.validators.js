import { body, param } from 'express-validator';

const videoPublishValidator = () => {
    return [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required"),
        body("description")
            .trim()
            .notEmpty()
            .withMessage("Description is required")
    ];
};

export {
    videoPublishValidator
};