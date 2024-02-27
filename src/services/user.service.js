import { User } from "../models/user.model.js";

const findUser = async (username, email) => {
    const data = await User.findOne({
        $or: [{ username }, { email }]
    });
    return data;
}

const findUserById = async (id, refreshToken = false) => {
    if (!refreshToken) {
        const data = await User.findById(id).select("-password -refreshToken");
        return data;
    } else {
        const data = await User.findById(id).select("-password");
        return data;
    }
}

const findAndUpdateUser = async (id, updateData, refreshToken = false) => {
    if (!refreshToken) {
        const data = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }).select("-password -refreshToken");
        return data;
    } else {
        const data = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }).select("-password");
        return data;
    }
}

const createUser = async (userData) => {
    const data = await User.create(userData);
    return data;
}

const findUserChannelProfile = async (username, id) => {
    const data = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // this will find total subscribers count for the channel
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            // this will find total channels subscribed by the user
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            /*
             * this will find total subscribers count for the channel and total channels subscribed by the user 
             * and also check if the user is subscribed to the channel or not
             */
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);
    return data;
}

const findUserWatchHistory = async (id) => {
    const data = await User.aggregate([
        {
            $match: {
                _id: id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);
    return data;
}

export {
    createUser,
    findUser,
    findUserById,
    findAndUpdateUser,
    findUserChannelProfile,
    findUserWatchHistory
}