import { Video } from "../models/video.model.js";

const publishVideoService = async (videoDetails) => {
    const newVideo = new Video(videoDetails);
    const savedVideo = await newVideo.save();
    return savedVideo;
}

export {
    publishVideoService
}