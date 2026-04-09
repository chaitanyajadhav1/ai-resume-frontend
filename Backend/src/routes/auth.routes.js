//1st approach
// const mongoose=require("mongoose")
// const authRouter=mongoose.Router()

//2nd approach
const {Router}=require("express")
const authController=require("../controllers/auth.controller")
const authMiddleware=require("../middlewares/auth.middleware")

const  authRouter=Router()

/**
 * @route POST /api/auth/register
 * @description Register new user
 * @access Public
 */

authRouter.post("/register",authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */

authRouter.post("/login",authController.loginUserController)


/**
 * @route GET /api/auth/logout
 * @description clear token from user cookie and add then token in blacklist 
 * @access public 
 */

authRouter.get("/logout",authController.logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description get the current logged in user details
 * @access private 
 */

authRouter.get("/get-me",authMiddleware.authUser,authController.getMeController)


module.exports=authRouter
