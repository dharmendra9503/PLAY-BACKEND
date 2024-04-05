import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    const tweetDetails = {
        content,
        owner: req.user?._id
    }

    const createdTweet = await Tweet.create(tweetDetails);
    if (!createdTweet) {
        throw new ApiError(400, "Failed to create tweet");
    }
    return res.status(201).json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const tweetAggregate = Tweet.aggregate([
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
            $match: { "owner._id": new mongoose.Types.ObjectId(userId) }
        },
        /*
        {
            $lookup: {
                from: "likes",  // Assuming the name of the "like" collection is "likes"
                localField: "_id",  // Assuming the "tweet" document has an "_id" field
                foreignField: "tweetId",  // Assuming the "like" document has a "tweetId" field
                as: "likes"
            },
        },
        {
            // this will find total subscribers count for the channel and total channels subscribed by the user 
            // and also check if the user is subscribed to the channel or not
            $addFields: {
                likes: {
                    $size: "$likes"
                },
            }
        },
        */
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
    const tweets = await Tweet.aggregatePaginate(
        tweetAggregate,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalTweets",
                docs: "tweets",
            },
        })
    );

    //TODO: Implement the logic to get the likes count for each tweet

    return res.status(200).json(new ApiResponse(200, tweets, "User tweets retrieved successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const tweet = await Tweet.findById(tweetId).select("-__v");
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    const { content } = req.body;
    tweet.content = content;
    await tweet.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const existedTweet = await Tweet.findById(tweetId);
    if (!existedTweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (existedTweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    await Tweet.deleteOne(new mongoose.Types.ObjectId(tweetId));

    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}