import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { publishVideoService } from "../services/video.service.js";
import { findVideoById } from "../services/video.service.js";
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body

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

        //Upload videoFile and thumbnail to cloudinary
        const videoFileLocal = req.files.video[0];
        const thumbnailLocal = req.files.thumbnail[0];
        const videoFileCloudinaryUrl = await uploadOnCloudinary(videoFileLocal?.path, videoFileLocal?.fieldname);
        const thumbnailCloudinaryUrl = await uploadOnCloudinary(thumbnailLocal?.path, thumbnailLocal?.fieldname);
        // console.log(videoFileCloudinaryUrl, thumbnailCloudinaryUrl);

        if (!videoFileCloudinaryUrl || !thumbnailCloudinaryUrl) {
            throw new ApiError(500, "Failed to upload video file or thumbnail")
        }

        //save video details to database
        const videoDetails = {
            videoFile: videoFileCloudinaryUrl?.secure_url,
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

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // const videoObjectId = new mongoose.Types.ObjectId(videoId);

    //get video details by videoId from database if video is published
    // const video = await findVideoById(videoId);
    // if (!video) {
    //     throw new ApiError(404, "Video not found")
    // }
    // console.log(video);

    // Generate the secure, signed URL
    const videoUrl = cloudinary.url(`video/${videoId}`, {
        resource_type: 'video',
        secure: true,
        sign_url: true,
        type: 'upload',
        streaming_profile: 'full_hd',
        format: 'm3u8' // HLS format for streaming
    });

    // Set headers to prevent direct downloading and caching
    res.set({
        'Content-Type': 'application/x-mpegURL', // HLS content type
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'self'; script-src 'none'; sandbox;",
    });

    // Stream the video content through your server to the client
    try {
        const response = await axios.get(videoUrl, { responseType: 'stream' });
        response.data.pipe(res);
    } catch (error) {
        console.error('Error streaming video:', error);
        res.sendStatus(500);
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}