import { asyncHandler } from "../utils/asyncHandler.js" // Custom async error handler

import { ApiError } from "../utils/ApiError.js" // Custom API error class
import { User } from "../models/user.models.js" // User model
import { uploadOnCloudinary } from "../utils/cloudinary.js" // Cloudinary utility for file uploads
import { ApiResponse } from "../utils/ApiResponse.js" // Custom API response utility
/**
 * Register a new user
 * @route POST /api/v1/users/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
   // get user details from front end
   // validation - not empty
   // check if user already exists: username,email
   // check for images, check for avatar
   // upload them to cloudinary, avatar
   // create user object - create entry in db
   // remove password and refresh token field from response
   // check for user creation
   // return response

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

    //req.body access has alerady given by the express but multer provides req.files 
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

export {registerUser}