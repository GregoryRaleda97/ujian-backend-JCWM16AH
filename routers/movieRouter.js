const express = require("express");
const router = express.Router();
const {movieController} = require('../controllers');
const {verifyTokenAccess} = require("../helpers/verifyToken");

const {
    GetAllMovie,
    GetMovieByQuery,
    PostFilm,
    ChangeStatusFilm,
    AddSchedule
} = movieController;

router.get("/get/all", GetAllMovie);
router.get("/get", GetMovieByQuery);
router.post("/add", verifyTokenAccess, PostFilm)
router.patch("/edit/:id", verifyTokenAccess, ChangeStatusFilm)
router.patch("/set/:id", verifyTokenAccess, AddSchedule)


module.exports = router;