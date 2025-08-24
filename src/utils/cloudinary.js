import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null
        
        // Configure cloudinary here to ensure env vars are loaded
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("file is uploaded on cloudinary", response.url);
        return response;
    } catch(error) {
        console.log("Cloudinary upload error:", error);
        return null;
    }
}
    
   export {uploadOnCloudinary}