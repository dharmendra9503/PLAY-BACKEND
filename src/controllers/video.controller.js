import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { publishVideoService } from "../services/video.service.js";

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
        if (!req.files || !req.files?.videoFile || !req.files?.thumbnail) {
            throw new ApiError(400, "Video file and thumbnail are required")
        }
        // console.log(req.files.videoFile[0], req.files.thumbnail[0]);

        //Upload videoFile and thumbnail to cloudinary
        const videoFileLocal = req.files.videoFile[0]?.path;
        const thumbnailLocal = req.files.thumbnail[0]?.path;
        const videoFileCloudinaryUrl = await uploadOnCloudinary(videoFileLocal);
        const thumbnailCloudinaryUrl = await uploadOnCloudinary(thumbnailLocal);
        // console.log(videoFileCloudinaryUrl, thumbnailCloudinaryUrl);

        if (!videoFileCloudinaryUrl || !thumbnailCloudinaryUrl) {
            throw new ApiError(500, "Failed to upload video file or thumbnail")
        }

        //TODO: save video details to database
        const videoDetails = {
            videoFile: videoFileCloudinaryUrl?.url,
            thumbnail: thumbnailCloudinaryUrl?.url,
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
    const { videoId } = req.params
    //TODO: get video by id
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