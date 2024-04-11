import multer from 'multer';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        /*
            The `fs.existsSync()` method is used to synchronously test whether or not the given path exists.
            If path not found, it will create the path.
        */
        if (!fs.existsSync("./public/temp")) {
            fs.mkdirSync("./public/temp", { recursive: true });
        }

        // This storage needs public/temp folder in the root directory
        // Else it will throw an error saying cannot find path public/temp
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        // let fileExtension = "";
        // if (file.originalname.split(".").length > 1) {
        //     fileExtension = file.originalname.substring(
        //         file.originalname.lastIndexOf(".")
        //     );
        // }
        // const filenameWithoutExtension = file.originalname
        //     .toLowerCase()
        //     .split(" ")
        //     .join("-")
        //     ?.split(".")[0];
        // cb(
        //     null,
        //     filenameWithoutExtension +
        //     Date.now() +
        //     Math.ceil(Math.random() * 1e5) + // avoid rare name conflict
        //     fileExtension
        // );
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage
});