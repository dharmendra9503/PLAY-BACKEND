import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { publishVideoService, findAllVideos } from "../services/video.service.js";
import { findVideoById, findVideo, deleteVideoById } from "../services/video.service.js";
import axios from 'axios';

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    let options = {};
    if (userId) {
        options['userId'] = userId;
    }
    if (query) {
        options['query'] = query;
    }
    if (sortBy) {
        options['sortBy'] = sortBy;
    }
    if (sortType) {
        options['sortType'] = sortType;
    }
    const videos = await findAllVideos(page, limit, options);
    if (!videos.totalVideos) {
        throw new ApiError(404, "No videos found")
    }

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body

        //Check title and description are not empty strings or undefined or null or empty strings after trimming spaces
        // if (!title || !description || title.trim() === "" || description.trim() === "") {
        //     throw new ApiError(400, "Title and description are required")
        // }

        //Check if videoFile and thumbnail are uploaded and are valid files
        if (!req.files || !req.files?.video || !req.files?.thumbnail) {
            throw new ApiError(400, "Video file and thumbnail are required")
        }
        // console.log(req.files.video[0], req.files.thumbnail[0]);
        if (req.files.video[0]?.mimetype?.split('/')[0] !== 'video') {
            throw new ApiError(400, "Invalid video file")
        }
        if (req.files.thumbnail[0]?.mimetype?.split('/')[0] !== 'image') {
            throw new ApiError(400, "Invalid thumbnail file")
        }

        //Upload videoFile and thumbnail to cloudinary
        const videoFileLocal = req.files.video[0];
        const thumbnailLocal = req.files.thumbnail[0];
        const videoFileCloudinaryUrl = await uploadOnCloudinary(videoFileLocal?.path, videoFileLocal?.fieldname);
        const thumbnailCloudinaryUrl = await uploadOnCloudinary(thumbnailLocal?.path, thumbnailLocal?.fieldname);

        if (!videoFileCloudinaryUrl || !thumbnailCloudinaryUrl) {
            throw new ApiError(500, "Failed to upload video file or thumbnail")
        }

        //save video details to database
        const videoDetails = {
            videoFile: videoFileCloudinaryUrl?.secure_url,
            playbackURL: videoFileCloudinaryUrl?.playback_url,
            thumbnail: thumbnailCloudinaryUrl?.secure_url,
            title,
            description,
            duration: videoFileCloudinaryUrl?.duration,
            owner: req.user?._id
        }
        const savedVideo = await publishVideoService(videoDetails);
        if (!savedVideo) {
            throw new ApiError(500, "Failed to save video details")
        }

        //Send response
        return res
            .status(201)
            .json(new ApiResponse(201, savedVideo, "Video published successfully"));
    } catch (error) {
        throw new ApiError(error?.statusCode || 500, error?.message || "Something went wrong while publishing video");
    }
})

const publishAVideoV2 = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    //Check title and description are not empty strings or undefined or null or empty strings after trimming spaces
    if (!title || !description || title.trim() === "" || description.trim() === "") {
        throw new ApiError(400, "Title and description are required")
    }

    //Check if videoFile and thumbnail are uploaded and are valid files
    if (!req.files || !req.files?.video || !req.files?.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }
    // console.log(req.files.video[0], req.files.thumbnail[0]);
    if (req.files.video[0]?.mimetype?.split('/')[0] !== 'video') {
        throw new ApiError(400, "Invalid video file")
    }
    if (req.files.thumbnail[0]?.mimetype?.split('/')[0] !== 'image') {
        throw new ApiError(400, "Invalid thumbnail file")
    }

    //TO-DO: Video store using HLS and DASH formats for adaptive streaming using ffmpeg

    return res.status(201).json(new ApiResponse(201, savedVideo, 'Video published successfully'));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // const videoObjectId = new mongoose.Types.ObjectId(videoId);

    //get video details by videoId from database if video is published
    const video = await findVideo(videoId);
    if (!video.length) {
        throw new ApiError(404, "Video not found")
    }

    // Generate the secure, signed URL
    // const videoUrl = cloudinary.url(video[0].playbackURL,
    //     {
    //         streaming_profile: "auto:subtitles_(code_en-US;file_docs:narration.vtt)",
    //         resource_type: "video"
    //     }
    // );

    // const videoUrl = cloudinary.url(video[0].playbackURL,
    //     {
    //         streaming_profile: "multi",
    //         transformation: [
    //             { width: 3840, quality: "auto", streaming_profile: "4k" }, // 4K quality
    //             { width: 1920, quality: "auto", streaming_profile: "hd" }, // 1080p quality
    //             { width: 1280, quality: "auto", streaming_profile: "hd" }, // 720p quality
    //             { width: 854, quality: "auto", streaming_profile: "sd" }, // 480p quality
    //             { width: 640, quality: "auto", streaming_profile: "sd" }, // 360p quality
    //         ],
    //         resource_type: "video"
    //     }
    // );
    // console.log(videoUrl);

    try {
        const response = await axios.get(video[0]?.playbackURL, { responseType: 'stream' });
        response.data.pipe(res);
    } catch (error) {
        console.error('Error streaming video:', error);
        res.sendStatus(500);
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await findVideoById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const { title, description } = req.body;
    if (title) {
        video.title = title;
    }
    if (description) {
        video.description = description;
    }
    if (req.file) {
        const thumbnailLocalPath = req.file?.path;
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, req.file?.fieldname);
        if (!thumbnail.secure_url) {
            throw new ApiError(400, "Error while uploading avatar on cloudinary");
        }
        video.thumbnail = thumbnail.secure_url;
    }
    await video.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await deleteVideoById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json(new ApiResponse(200, video, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await findVideoById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, video, "Video publish status updated successfully"));
})

export {
    getAllVideos,
    publishAVideo,
    publishAVideoV2,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}