import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { findVideo } from "../services/video.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { getMongoosePaginationOptions } from "../utils/helpers.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page, limit } = req.query;

    try {
        const video = await findVideo(videoId);
        if (!video.length) {
            throw new ApiError(404, "Video not found");
        }

        const commentAggregate = Comment.aggregate([
            {
                $match: { video: new mongoose.Types.ObjectId(videoId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $unwind: "$owner"
            },
            {
                $project: {
                    __v: 0, // Exclude the _id field
                    videoFile: 0,
                    playbackURL: 0,
                    "owner.password": 0,
                    "owner.__v": 0,
                    "owner.updatedAt": 0,
                    "owner.createdAt": 0,
                    "owner.email": 0,
                    "owner.fullName": 0,
                    "owner.coverImage": 0,
                    "owner.watchHistory": 0,
                    "owner.refreshToken": 0,
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        const comments = await Comment.aggregatePaginate(
            commentAggregate,
            getMongoosePaginationOptions({
                page,
                limit,
                customLabels: {
                    totalDocs: "totalComments",
                    docs: "comments",
                },
            })
        );

        // TODO: Add like count

        return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
    } catch (error) {
        console.error("Error fetching comments: ", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    try {
        const video = await findVideo(videoId);
        if (!video.length) {
            throw new ApiError(404, "Video not found");
        }

        const commentDetails = {
            content,
            video: video._id,
            owner: req.user?._id
        }
        const createdComment = await Comment.create(commentDetails);
        if (!createdComment) {
            throw new ApiError(400, "Failed to create comment");
        }

        return res.status(201).json(new ApiResponse(201, createdComment, "Comment created successfully"));
    } catch (error) {
        console.error("Error creating comment: ", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    try {
        const comment = await Comment.findById(commentId).select("-__v");
        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }
        if (comment.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "You are not authorized to update this comment");
        }

        comment.content = content;
        await comment.save({ validateBeforeSave: false });

        return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
    } catch (error) {
        console.error("Error updating comment: ", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    try {
        const existedComment = await Comment.findById(commentId);
        if (!existedComment) {
            throw new ApiError(404, "Comment not found");
        }
        if (existedComment.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "You are not authorized to delete this comment");
        }

        await Comment.deleteOne(new mongoose.Types.ObjectId(commentId));

        return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
    } catch (error) {
        console.error("Error deleting comment: ", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}