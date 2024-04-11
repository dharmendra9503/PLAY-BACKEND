import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from '../utils/ApiResponse.js';
import { findVideo } from "../services/video.service.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    try {
        const details = {
            name,
            description,
            owner: req.user?.id
        }

        const playlist = await Playlist.create(details);
        if (!playlist) {
            throw new ApiError(500, "Failed to create playlist");
        }

        return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
    } catch (error) {
        console.error("Error creating playlist: ", error);
        throw new ApiError(error.statusCode || 500, error.statusCode ? error.message : "Internal server error");
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    try {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID");
        }
        const playlistAggregate = Playlist.aggregate([
            // Match playlists owned by the user
            { $match: { owner: new mongoose.Types.ObjectId(userId) } },
            // Project fields and add a new field for the total number of videos
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    totalVideos: { $size: "$videos" } // Calculate the total number of videos
                }
            },
            // Sort playlists by the most recently created
            { $sort: { createdAt: -1 } }
        ]);
        const playlists = await Playlist.aggregatePaginate(
            playlistAggregate,
            getMongoosePaginationOptions({
                page,
                limit,
                customLabels: {
                    docs: "playlists",
                    totalDocs: "totalPlaylists"
                }
            })
        );

        return res.status(200).json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
    } catch (error) {
        console.error("Error fetching user playlists: ", error);
        throw new ApiError(error.statusCode || 500, error.statusCode ? error.message : "Internal server error");
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    try {
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }
        const isPlaylistExisted = await Playlist.findById(playlistId).select("-__v");
        if (!isPlaylistExisted) {
            throw new ApiError(404, "Playlist not found");
        }

        const playlist = await Playlist.aggregate([
            // Match playlists owned by the user
            { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
            {
                $lookup: {
                    from: "videos", // Assuming 'videos' is the collection name
                    let: { videoIds: "$videos" }, // Use "let" to define variables for use in the pipeline
                    pipeline: [
                        { $match: { $expr: { $in: ["$_id", "$$videoIds"] } } }, // Match videos that are referenced in the playlist
                        // Lookup to get owner details for each video
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "ownerDetails"
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                thumbnail: 1,
                                duration: 1,
                                views: 1,
                                createdAt: 1,
                                "ownerDetails._id": 1,
                                "ownerDetails.username": 1,
                                "ownerDetails.fullName": 1,
                                "ownerDetails.avatar": 1,
                            }
                        },
                        { $unwind: "$ownerDetails" }, // Unwind the owner details (assuming each video has one owner)
                        // Optionally project the video document structure here if needed
                    ],
                    as: "videosWithOwnerDetails"
                }
            },
            {
                /*
                * This will get the owner details from the users collection
                * based on the owner ID in the playlist
                */
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    videos: "$videosWithOwnerDetails",
                    "owner._id": 1,
                    "owner.username": 1,
                    "owner.fullName": 1,
                    "owner.avatar": 1,
                }
            },
            { $unwind: "$owner" },
        ]);

        return res.status(200).json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
    } catch (error) {
        console.error("Error fetching playlist: ", error);
        throw new ApiError(error.statusCode || 500, error.statusCode ? error.message : "Internal server error");
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    try {
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid playlist or video ID");
        }
        const playlist = await Playlist.findById(playlistId).select("-__v");
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }
        const video = await findVideo(videoId);
        if (!video.length) {
            throw new ApiError(404, "Video not found");
        }

        // Add video to playlist
        if (!playlist.videos.includes(videoId)) {
            playlist.videos.push(videoId);
        }
        await playlist.save();

        return res.status(200).json(new ApiResponse(200, {}, "Video added to playlist successfully"));
    } catch (error) {
        console.error("Error adding video to playlist: ", error);
        throw new ApiError(error.statusCode || 500, error.statusCode ? error.message : "Internal server error");
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    try {
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid playlist or video ID");
        }
        const playlist = await Playlist.findById(playlistId).select("-__v");
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Remove video from playlist
        if (playlist.videos.includes(videoId)) {
            playlist.videos.pull(videoId);
        }
        await playlist.save();

        return res.status(200).json(new ApiResponse(200, {}, "Video removed from playlist successfully"));
    } catch (error) {
        console.error("Error removing video from playlist: ", error);
        throw new ApiError(error.statusCode || 500, error.statusCode ? error.message : "Internal server error");
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    try {
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }
        const deleted = await Playlist.findByIdAndDelete(playlistId);
        if (!deleted) {
            throw new ApiError(404, "Playlist not found");
        }

        return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"));
    } catch (error) {
        console.error("Error deleting playlist: ", error);
        throw new ApiError(error.statusCode || 500, error.statusCode ? error.message : "Internal server error");
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    try {
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }
        const playlist = await Playlist.findById(playlistId).select("-__v");
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (name) {
            playlist.name = name;
        }
        if (description) {
            playlist.description = description;
        }
        await playlist.save();

        return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"));
    } catch (error) {
        console.error("Error updating playlist: ", error);
        throw new ApiError(error.statusCode || 500, error.statusCode ? error.message : "Internal server error");
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}