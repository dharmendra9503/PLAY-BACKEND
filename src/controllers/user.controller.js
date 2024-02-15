import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    createUser,
    findUser,
    findUserById,
    findAndUpdateUser
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
        throw new ApiError(500, "Something went wrong while generating access token and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from request
    const { fullName, username, email, password } = req.body;

    // validation - not empty
    if (
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
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );
})

const loginUser = asyncHandler(async (req, res) => {
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
})

const logoutUser = asyncHandler(async (req, res) => {
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

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}