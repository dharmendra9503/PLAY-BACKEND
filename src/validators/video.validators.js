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

const videoIdValidator = () => {
    return [
        param("videoId")
            .trim()
            .notEmpty()
            .withMessage("Video ID is required")
            .isMongoId()
            .withMessage("Invalid video ID") 
    ];
};

export {
    videoPublishValidator,
    videoIdValidator
};