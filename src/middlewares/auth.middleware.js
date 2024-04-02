import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { findUserById } from "../services/user.service.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    //Get token from cookie or header
    const token = req.cookies?.accessToken || req.header('Authorization').replace('Bearer ', '');
    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        //Verify token and get user details from token payload
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        //get user from db
        const user = await findUserById(decodedToken._id);
        //check if user exists in db or not
        if (!user) {
            // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
            // Then they will get a new access token which will allow them to refresh the access token without logging out the user
            throw new ApiError(401, "Invalid access token");
        }
        //set user in request object
        req.user = user;
        //call next middleware or controller function if token is valid and user exists in db
        next();
    } catch (error) {
        // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
        // Then they will get a new access token which will allow them to refresh the access token without logging out the user
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});