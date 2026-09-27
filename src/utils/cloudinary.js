import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // handles file in our server


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // check if localFilePath is present or not
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // auto means cloudinary itself will figure what type of file it is
    });
    // file has been uploaded
    fs.unlinkSync(localFilePath)
    
    return res;
  } catch (error) {
    //   } catch (error) {
    //     fs.unlinkSync(localFilePath); // remove the locally saved temp files
    //     // as the upload operation got failed
    //     return null;
    //   }
    console.log("CLOUDINARY ERROR:", error);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export { uploadOnCloudinary };

// consoling req.files will give all the info about the file
