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

export {
    createUser,
    findUser,
    findUserById,
    findAndUpdateUser
}