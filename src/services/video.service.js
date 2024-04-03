import { Video } from "../models/video.model.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js";
import mongoose from "mongoose";

const publishVideoService = async (videoDetails) => {
    const newVideo = new Video(videoDetails);
    const savedVideo = await newVideo.save();
    return savedVideo;
}

const findVideoById = async (videoId) => {
    const video = await Video.find({ _id: videoId, isPublished: true }).select("-__v");
    return video;
}

const findAllVideos = async (page, limit, options) => {
    // const videoAggregate = Video.aggregate([
    //     {
    //         $match: {
    //             isPublished: true,
    //             $or: [
    //                 { title: { $regex: options.query, $options: 'i' } }, // Case-insensitive title match
    //                 { description: { $regex: options.query, $options: 'i' } } // Case-insensitive description match
    //                 // Add more fields to search as needed
    //             ]
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "users",
    //             localField: "owner",
    //             foreignField: "_id", // Field from the users collection
    //             as: "owner" // Alias for the joined user details
    //         }
    //     },
    //     {
    //         $unwind: "$owner" // Unwind the owner array to flatten it
    //     },
    //     {
    //         $project: {
    //             __v: 0, // Exclude the _id field
    //             updatedAt: 0,
    //             videoFile: 0,
    //             playbackURL: 0,
    //             "owner.password": 0,
    //             "owner.__v": 0,
    //             "owner.updatedAt": 0,
    //             "owner.createdAt": 0,
    //             "owner.email": 0,
    //             "owner.fullName": 0,
    //             "owner.coverImage": 0,
    //             "owner.watchHistory": 0,
    //             "owner.refreshToken": 0,
    //         }
    //     }
    // ]);

    // Define the initial stages of the aggregation pipeline
    let pipeline = [];
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id", // Field from the users collection
                as: "owner" // Alias for the joined user details
            }
        },
        {
            $unwind: "$owner" // Unwind the owner array to flatten it
        },
        {
            $project: {
                __v: 0, // Exclude the _id field
                updatedAt: 0,
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
        }
    );

    // Match documents based on the userId
    if (options?.userId) {
        pipeline.push({
            $match: { "owner._id": new mongoose.Types.ObjectId(options.userId) }
        });
    }

    console.log(pipeline);

    // Match documents based on the query
    if (options?.query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: options.query, $options: 'i' } }, // Case-insensitive title match
                    { description: { $regex: options.query, $options: 'i' } }, // Case-insensitive description match
                    { "owner.username": { $regex: options.query, $options: 'i' } } // Case-insensitive username match
                ]
            }
        });
    }

    // Sort documents based on sortBy and sortType
    /*
    * Sort documents based on the sortBy and sortType
    * SortBy can be createdAt, views, duration
    * SortType can be asc or desc
    */
    if (options?.sortBy || options?.sortType) {
        const sortField = options?.sortBy ? options.sortBy : 'createdAt';
        const sortOrder = options?.sortType === 'asc' ? 1 : -1;
        console.log(sortField, sortOrder);
        pipeline.push({
            $sort: { [sortField]: sortOrder }
        });
    }

    // Execute the aggregation pipeline
    const videoAggregate = Video.aggregate(pipeline);

    // Paginate the results based on the page and limit
    const videos = await Video.aggregatePaginate(
        videoAggregate,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalVideos",
                docs: "videos",
            },
        })
    );
    return videos;
}

export {
    publishVideoService,
    findVideoById,
    findAllVideos
}