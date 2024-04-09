import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const { channelId } = req.params;
        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channel ID")
        }

        const channel = await User.findById(channelId).select("_id, username");
        if (!channel) {
            throw new ApiError(404, "Channel not found");
        }

        const subscription = await Subscription.findOne({ subscriber: req.user?._id, channel: channelId });
        if (subscription) {
            await Subscription.deleteOne({ _id: subscription._id });
            return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"));
        } else {
            await Subscription.create({ subscriber: req.user._id, channel: channelId });
            return res.status(200).json(new ApiResponse(200, {}, "Subscribed successfully"));
        }
    } catch (error) {
        console.error("Error toggling subscription: ", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const { channelId } = req.params;
        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channel ID")
        }

        const channel = await User.findById(channelId).select("_id, username");
        if (!channel) {
            throw new ApiError(404, "Channel not found");
        }

        const count = await Subscription.countDocuments({ channel: channelId });
        const subscribers = await Subscription.find({ channel: channelId })
            .populate("subscriber", "fullName username avatar")
            .select("-__v -channel -_id");

        return res.status(200).json(new ApiResponse(200, { count, subscribers }, "Subscribers fetched successfully"));
    } catch (error) {
        console.error("Error getting channel subscribers: ", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const { subscriberId } = req.params;
        if (!isValidObjectId(subscriberId)) {
            throw new ApiError(400, "Invalid user ID")
        }

        const user = await User.findById(subscriberId).select("_id, username");
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const count = await Subscription.countDocuments({ subscriber: subscriberId });
        const channels = await Subscription.find({ subscriber: subscriberId })
            .populate("channel", "fullName username avatar")
            .select("-__v -subscriber -_id");

        return res.status(200).json(new ApiResponse(200, { count, channels }, "Subscribed channels fetched successfully"));
    } catch (error) {
        console.error("Error getting subscribed channels: ", error);
        throw new ApiError(error?.statusCode || 500, error?.statusCode ? error?.message : "Internal Server Error");
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}