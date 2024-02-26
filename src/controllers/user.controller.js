import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    createUser,
    findUser,
    findUserById,
    findAndUpdateUser,
    findUserChannelProfile
} from "../services/user.service.js";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await findUserById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token and refresh token", error);
    }
}

const registerUser = asyncHandler(async (req, res) => {
    try {
        // get user details from request
        const { fullName, username, email, password } = req.body;

        // validation - not empty
        if (
            !fullName || !username || !email || !password ||
            [fullName, username, email, password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required");
        }

        // check if user already exists: username, email
        const existedUser = await findUser(username, email);
        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists");
        }

        // check for images, check for avatar
        // console.log(req.files);
        let avatarLocalPath;
        if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
            avatarLocalPath = req.files?.avatar[0]?.path;
        }
        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path;
        }
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar image is required");
        }

        // upload image to cloudinary, avatar
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required");
        }

        // create user object - create entry in db
        const userData = {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        };
        const user = await createUser(userData);

        // remove password and refresh token field from response
        const createdUser = await findUserById(user._id);

        // check for user creation
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        // return res
        return res
            .status(201)
            .json(new ApiResponse(200, createdUser, "User registered Successfully"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while registering the user", error);
    }
})

const loginUser = asyncHandler(async (req, res) => {
    try {
        // get user details from request
        const { email, username, password } = req.body;

        // validation - not empty
        if (!username && !email) {
            throw new ApiError(400, "Username or email is required");
        }

        // check if user exists email
        const user = await findUser(username, email);
        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        // check if password is correct
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }

        // generate access token and refresh token
        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

        const loggedInUser = await findUserById(user._id);

        //This option will set the cookie as secure and httpOnly, so the cookie cannot be accessed by client-side scripts
        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged In Successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, "Something went wrong while logging in the user", error);
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        // remove refresh token from db
        await findAndUpdateUser(
            req.user._id,
            { $unset: { refreshToken: 1 /* this removes the field from document */ } }
        );

        const options = {
            httpOnly: true,
            secure: true
        }

        // clear cookies from response object and send response to client with message
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged Out"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while logging out the user", error);
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get refresh token from request object - cookie or body
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // check if refresh token is present in request object
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {
        // verify refresh token 
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // find user by id
        const user = await findUserById(decodedToken?._id, true);

        // check if user exists
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // check if refresh token is valid and not expired
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        // generate new access token and refresh token
        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw new ApiError(400, "All fields are required");
        }
        // check if old password is correct
        const user = await findUserById(req.user?._id);
        const isPasswordValid = await user.isPasswordCorrect(oldPassword);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid old password");
        }
        // update password
        user.password = newPassword;
        await user.save({ validateBeforeSave: false  /* this will not validate the document before saving */ });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while changing password", error);
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User details fetched successfully"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    try {
        // get user details from request
        const { fullName, email } = req.body;
        if (!fullName || !email) {
            throw new ApiError(400, "All fields are required");
        }
        // update user details in db
        const user = await findAndUpdateUser(
            req.user._id,
            {
                $set: {
                    fullName,
                    email
                }
            },
            true // this will return updated document with refresh token
        );
        return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating account details", error);
    }
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
        // check for avatar file in request object - req.file or req.files
        const avatarLocalPath = req.file?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required");
        }
        // upload avatar to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar.url) {
            throw new ApiError(400, "Error while uploading avatar on cloudinary");
        }
        const user = await findAndUpdateUser(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            true // this will return updated document with refresh token
        );
        return res
            .status(200)
            .json(new ApiResponse(200, user, "Avatar updated successfully"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating avatar", error);
    }
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
        // check for cover image file in request object - req.file or req.files
        const coverImageLocalPath = req.file?.path;
        if (!coverImageLocalPath) {
            throw new ApiError(400, "Cover image file is required");
        }
        // upload cover image to cloudinary
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!coverImage.url) {
            throw new ApiError(400, "Error while uploading cover image on cloudinary");
        }
        const user = await findAndUpdateUser(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            true // this will return updated document with refresh token
        );
        return res
            .status(200)
            .json(new ApiResponse(200, user, "Cover image updated successfully"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating cover image", error);
    }
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    try {
        const { username } = req.params;
        if (!username?.trim()) {
            throw new ApiError(400, "Username is required");
        }
        const channel = await findUserChannelProfile(username, req.user?._id);
        if (!channel?.length) {
            throw new ApiError(404, "channel does not exists");
        }
        console.log(channel);
        return res
            .status(200)
            .json(
                new ApiResponse(200, channel[0], "User channel fetched successfully")
            );
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching user details", error);
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}