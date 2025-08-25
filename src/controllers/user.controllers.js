import { asyncHandler } from "../utils/asyncHandler.js" // Custom async error handler
import { ApiError } from "../utils/ApiError.js" // Custom API error class
import { User } from "../models/user.models.js" // User model
import { uploadOnCloudinary } from "../utils/cloudinary.js" // Cloudinary utility for file uploads
import { ApiResponse } from "../utils/ApiResponse.js" // Custom API response utility
import jwt from "jsonwebtoken"
/**
 * Register a new user
 * @route POST /api/v1/users/register
 * @access Public
 */

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
   console.log("req.body:", req.body);
   console.log("req.files:", req.files);
   console.log("Content-Type:", req.headers?.['content-type']);
   console.log("Headers exist:", !!req.headers);
   
   // Check if using wrong content type
   if (req.headers?.['content-type']?.includes('application/json')) {
       return res.status(400).json({
           error: "Wrong content type",
           message: "This endpoint requires multipart/form-data, not JSON. Use form-data in your request."
       });
   }
   
   const { fullName, email, userName, password } = req.body
   console.log("email", email);

   // Check which fields are missing
   const missingFields = [];
   if (!fullName?.trim()) missingFields.push('fullName');
   if (!email?.trim()) missingFields.push('email');
   if (!userName?.trim()) missingFields.push('userName');
   if (!password?.trim()) missingFields.push('password');
   
   if (missingFields.length > 0) {
       throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
   }

    const existedUser = await User.findOne({
        $or: [{ username: userName },{ email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // req.body access has alerady given by the express but multer provides req.files 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null

    // Clean up temporary files
    try {
        if (avatarLocalPath && require('fs').existsSync(avatarLocalPath)) {
            require('fs').unlinkSync(avatarLocalPath)
        }
        if (coverImageLocalPath && require('fs').existsSync(coverImageLocalPath)) {
            require('fs').unlinkSync(coverImageLocalPath)
        }
    } catch (cleanupError) {
        console.log("File cleanup error:", cleanupError)
    }

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: userName.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler(async(req,res)=>{
    const {email, username, password} = req.body
    
    
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }   

    const user=await User.findOne({
        $or:[{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordVaild=await user.isPasswordCorrect(password)
    if(!isPasswordVaild){
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})


const logoutUser=asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})   


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.boby.refreshToken

    try {
        if (!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request")
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } 
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
