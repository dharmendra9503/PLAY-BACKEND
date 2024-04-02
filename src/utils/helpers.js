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