import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from '../utils/ApiResponse.js';
import { findVideo } from "../services/video.service.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    try {
        const details = {
            name,
            description,
            user: req.user.id
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
    const { userId } = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
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
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
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