import { Video } from "../models/video.model.js";

const publishVideoService = async (videoDetails) => {
    const newVideo = new Video(videoDetails);
    const savedVideo = await newVideo.save();
    return savedVideo;
}

const findVideoById = async (videoId) => {
    const video = await Video.find({ _id: videoId, isPublished: true }).select("-__v");
    return video;
}

export {
    publishVideoService,
    findVideoById
}