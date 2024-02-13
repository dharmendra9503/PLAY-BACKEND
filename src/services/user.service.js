import { User } from "../models/user.model.js";

const findUser = async (username, email) => {
    const data = await User.findOne({
        $or: [{ username }, { email }]
    });
    return data;
}

const findUserById = async (id) => {
    const data = await User.findById(id).select("-password -refreshToken");
    return data;
}

const findAndUpdateUser = async (id, updateData) => {
    const data = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true }).select("-password -refreshToken");
    return data;
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