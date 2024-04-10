import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylistValidator, updatePlaylistValidator } from '../validators/playlist.validator.js';
import { validate } from '../validators/validate.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/")
    .post(createPlaylistValidator(), validate, createPlaylist);

router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylistValidator(), validate, updatePlaylist)
    .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId")
    .patch(addVideoToPlaylist);

router.route("/remove/:videoId/:playlistId")
    .patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router;