import { body } from "express-validator";

const createPlaylistValidator = () => {
    return [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Name is required")
            .isLength({ min: 1, max: 100 })
            .withMessage("Name must be between 1 and 100 characters"),
        body("description")
            .trim()
            .notEmpty()
            .withMessage("Description is required")
            .isLength({ min: 1, max: 500 })
            .withMessage("Description must be between 1 and 500 characters"),
    ];
};

const updatePlaylistValidator = () => {
    return [
        body("name")
            .trim()
            .optional()
            .isLength({ min: 1, max: 100 })
            .withMessage("Name must be between 1 and 100 characters"),
        body("description")
            .trim()
            .optional()
            .isLength({ min: 1, max: 500 })
            .withMessage("Description must be between 1 and 500 characters"),
    ];
};

export {
    createPlaylistValidator,
    updatePlaylistValidator,
}