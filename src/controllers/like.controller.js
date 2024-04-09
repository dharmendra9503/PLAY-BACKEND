import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { findVideo } from "../services/video.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    try {
        const video = await findVideo(videoId);
        if (!video.length) {
            throw new ApiError(404, "Video not found");
        }

        // Check if the user has already liked the video
        const isVideoLiked = await Like.findOne({ video: videoId, likedBy: req.user?._id });
        if (isVideoLiked) {
            // If the user has already liked the video, remove the like
            await Like.findOneAndDelete({ video: videoId, likedBy: req.user?._id });
            return res.status(200).json(new ApiResponse(200, {}, "Video like removed"));
        }

        // If the user hasn't liked the video yet, add a new like
        await Like.create({ video: videoId, likedBy: req.user?._id });

        return res.status(200).json(new ApiResponse(200, {}, "Video liked"));
    } catch (error) {
        console.error("Error toggling video like:", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    try {
        const comment = await Comment.findById(commentId).select("-__v");
        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        // Check if the user has already liked the comment
        const isCommentLiked = await Like.findOne({ comment: commentId, likedBy: req.user?._id });
        if (isCommentLiked) {
            // If the user has already liked the comment, remove the like
            await Like.findOneAndDelete({ comment: commentId, likedBy: req.user?._id });
            return res.status(200).json(new ApiResponse(200, {}, "Comment like removed"));
        }

        // If the user hasn't liked the comment yet, add a new like
        await Like.create({ comment: commentId, likedBy: req.user?._id });

        return res.status(200).json(new ApiResponse(200, {}, "Comment liked"));
    } catch (error) {
        console.error("Error toggling comment like:", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    try {
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }

        // Check if the user has already liked the tweet
        const isTweetLiked = await Like.findOne({ tweet: tweetId, likedBy: req.user?._id });
        if (isTweetLiked) {
            // If the user has already liked the tweet, remove the like
            await Like.findOneAndDelete({ tweet: tweetId, likedBy: req.user?._id });
            return res.status(200).json(new ApiResponse(200, {}, "Tweet like removed"));
        }

        // If the user hasn't liked the tweet yet, add a new like
        await Like.create({ tweet: tweetId, likedBy: req.user?._id });

        return res.status(200).json(new ApiResponse(200, {}, "Tweet liked"));
    } catch (error) {
        console.error("Error toggling tweet like:", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    try {
        const likedVideoAggregate = Like.aggregate([
            { $match: { likedBy: req.user?._id, video: { $ne: null } } },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video"
                },
            },
            { $unwind: "$video" },
            {
                $lookup: {
                    from: "users",
                    localField: "video.owner",
                    foreignField: "_id",
                    as: "video.owner"
                },
            },
            { $unwind: "$video.owner" },
            {
                $project: {
                    _id: 0,
                    likedBy: 0,
                    __v: 0,
                    "video.__v": 0,
                    "video.isPublished": 0,
                    "video.videoFile": 0,
                    "video.playbackURL": 0,
                    "video.owner.__v": 0,
                    "video.owner.password": 0,
                    "video.owner.email": 0,
                    "video.owner.createdAt": 0,
                    "video.owner.updatedAt": 0,
                    "video.owner.refreshToken": 0,
                    "video.owner.watchHistory": 0,
                    "video.owner._id": 0,
                    "video.owner.fullName": 0,
                    "video.owner.coverImage": 0,
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        const likedVideos = await Like.aggregatePaginate(
            likedVideoAggregate,
            getMongoosePaginationOptions({
                page,
                limit,
                customLabels: {
                    totalDocs: "totalVideos",
                    docs: "videos",
                },
            })
        )

        return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched"));
    } catch (error) {
        console.error("Error fetching liked videos:", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}