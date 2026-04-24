const express = require("express")
const authMiddleware=require("../middlewares/auth.middleware")
const interviewRouter=express.Router()
const interviewController=require("../controllers/intervirw.controller")

const upload=require("../middlewares/file.middlreware")


/**
 * @route POST /api/interview
 * @description generate new interview report on the basis of user self description,resume pdf and job description
 * @access private
 */

interviewRouter.post("/",authMiddleware.authUser,upload.single("resume"),interviewController.generateInterviewController)

module.exports=interviewRouter