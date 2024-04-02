import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { httpServer } from "./app.js";

dotenv.config({ path: './.env' });

/**
 * Starting from Node.js v14 top-level await is available and it is only available in ES modules.
 * This means you can not use it with common js modules or Node version < 14.
 */
const majorNodeVersion = +process.env.NODE_VERSION?.split(".")[0] || 0;

const startServer = () => {
    httpServer.listen(process.env.PORT || 8080, () => {
        console.log("⚙️  Server is running on port: " + process.env.PORT);
    });
};

if (majorNodeVersion >= 14) {
    try {
        await connectDB();
        startServer();
    } catch (err) {
        console.log("Mongo db connect error: ", err);
    }
} else {
    connectDB()
        .then(() => {
            startServer();
        })
        .catch((err) => {
            console.log("Mongo db connect error: ", err);
        });
}