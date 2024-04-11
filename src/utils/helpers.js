import fs from "fs";
import mongoose from "mongoose";

export const removeLocalFile = (localPath) => {
    fs.unlink(localPath, (err) => {
        if (err) console.log("Error while removing local files: ", err);
        else {
            console.log("Removed local: ", localPath);
        }
    });
};

export const removeUnusedMulterImageFilesOnError = (req) => {
    try {
        const multerFile = req.file;
        const multerFiles = req.files;

        if (multerFile) {
            // If there is file uploaded and there is validation error
            // We want to remove that file
            removeLocalFile(multerFile.path);
        }

        if (multerFiles) {
            /** @type {Express.Multer.File[][]}  */
            const filesValueArray = Object.values(multerFiles);
            // If there are multiple files uploaded for more than one fields
            // We want to remove those files as well
            filesValueArray.map((fileFields) => {
                fileFields.map((fileObject) => {
                    removeLocalFile(fileObject.path);
                });
            });
        }
    } catch (error) {
        // fail silently
        console.log("Error while removing image files: ", error);
    }
};

/**
 *
 * @param {{page: number; limit: number; customLabels: mongoose.CustomLabels;}} options
 * @returns {mongoose.PaginateOptions}
 */
export const getMongoosePaginationOptions = ({
    page = 1,
    limit = 10,
    customLabels,
}) => {
    return {
        page: Math.max(isNaN(parseInt(page)) ? 1 : page, 1),
        limit: Math.max(limit, 1),
        pagination: true,
        customLabels: {
            pagingCounter: "serialNumberStartFrom",
            ...customLabels,
        },
    };
};