import { asyncHandler } from "../utils/asyncHandlers.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // this change is currently only in your program's memory.
    user.refreshToken = refreshToken;
    // update the actual document stored in MongoDB."
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Something went wrong while generating token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation of user details , not empty
  // check if user already exists in db: either username/email
  // check for images and avatar as these are required
  // upload them to cloudinary
  // create user obj , it will contains all data abt user, - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullname, email, username, password } = req.body;
  // "Take these four values out of req.body and create variables with the same names."
  console.log("email: ", email);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
    // if any of 4 given field is empty
    // if non empty may contain only spaces so trim it and compare with ""
  ) {
    throw new apiError(400, "All field are required");
    // new is used as it creates an object(instance)
  }

  // User is the model , in which we check if either of the below exists or not
  const existedUser = await User.findOne({
    // "Find the first user document that matches this condition."
    $or: [{ email }, { username }], // $or is the cutomized condn we have applied
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // avatar is stored in req.files by multer in the server temporarily
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // "Take this local avatar file and upload it to Cloudinary."
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(500, "Avatar upload failed");
    // "If Cloudinary didn't return an avatar, something went wrong with the upload (upload unsuccessful)."
  }

  // "MongoDB, create a new user with these details."
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // "Find the user I just created, but don't give me the password or refresh token."
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
    // dont include password and refershtoken while returning the response to frontend
  );

  // This checks whether the user was actually created and retrieved successfully.
  if (!createdUser) {
    throw new apiError(500, "Somwthing went wrong while registering the user");
  }

  // "Tell the frontend that the user was successfully created, and send the created user's safe data along with a success message."
  // json is returned for ApiResponse only and not for ApiError , as ApiError is sending error only,
  // while apiResponse is sending data to frontend/user.
  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered successfully"));

  // ApiResponse → successful result → send with res.json()
  // ApiError → problem → throw it → error middleware sends the JSON response.
});

const loginUser = asyncHandler(async (req, res) => {
  // req body se data
  // username or email based login
  // find the user
  // check password
  // access and refresh token
  // send cookie

  const { email, username, password } = req.body;

  // if the frontend/user have not send you the foloowing return error
  if (!(username || email)) {
    throw new apiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  // find a existing user with provided email or username

  if (!user) {
    throw new apiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apiError(404, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // find the user in db and extract all details except pass and refreshToken

  const options = {
    httpOnly: true,
    //Normal JavaScript running on the webpage cannot read this cookie.
    secure: true,
  };

  // These are instructions for the browser about the cookies.
  // httpOnly: true
  // Means:
  // JavaScript running in the browser can't directly access this cookie.
  // This helps protect the token from certain attacks.
  // secure: true
  // Means:
  // Only send this cookie over HTTPS.
  // So it's safer when your app is deployed.

  return (
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      // You're telling the browser:
      // "Store this access token in a cookie called accessToken."
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          // if your code is using HTTP-only cookies intentionally, returning the tokens in JSON is usually redundant.
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "Users logged in successfully "
        )
      )
  );

  // Cookie = a small ID card kept by your browser.

  // Login
  //  ↓
  // Server gives browser 🍪
  //  ↓
  // Browser remembers it
  //  ↓
  // Browser sends it when needed
  //  ↓
  // Server recognizes you
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes field from document
      },
    },
    {
      new: true, // return the new value not the old data
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
.json(new apiResponse(200, {}, "User logged Out"));

  //   User clicks "Logout"
  //         ↓
  // POST /logout
  //         ↓
  // verifyJWT middleware
  //         ↓
  // Get access token from cookie
  //         ↓
  // Verify access token
  //         ↓
  // Find user
  //         ↓
  // req.user = user
  //         ↓
  // Logout controller
  //         ↓
  // Remove refreshToken from user's DB document
  //         ↓
  // Clear accessToken cookie 🍪
  //         ↓
  // Clear refreshToken cookie 🍪
  //         ↓
  // "Logged out successfully" ✅
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  // "My access token expired. I have a refresh token, so give me a new access token."
  // "First, look in the cookies for a refresh token. If it's not there, look in the request body."

  if (!incomingRefreshToken) {
    // check whether token exist or not
    throw new apiError(400, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
      // .env → checks whether the token is genuine(whether created using my secret), not the actual token.
    );
    //This asks JWT:
    // "Was this refresh token created using my secret, and has it expired?"
    // If valid, JWT gives you the information stored inside the token.

    const user = await User.findById(decodedToken?._id);
    // refersh token contains _id

    if (!user) {
      // find the user in db
      throw new apiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      // user?.refreshToken - MongoDB stores the user's currently active ticket.
      throw new apiError(401, "Refresh token is expired");
    }

    // cookie options
    const options = {
      httpOnly: true,
      secure: true,
    };

    // generate new tokens ( both refresh and access)
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // send the token in cookie as well as json
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // Get passwords from request body/user

  const user = await User.findById(req.user?._id);
  // "Attach the logged-in user's information to the request."
  // req.user is a customized property of req created by us to store the logged in user's details in req.user
  // Before this controller runs, your JWT middleware has already checked the user's login token
  // the jwt token craeted while logging in stores the logged in user details

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  // "Does the old password entered by the user match the hashed password stored in the database?"

  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid password");
  }

  user.password = newPassword;
  // Now you're replacing the old password with the new one.
  await user.save({ validateBeforeSave: false });
  // the pre-save middleware hashes it. This saves the modified user to MongoDB.

  return res
    .status(200)
    .json(new apiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  
return res.status(200).json(new apiResponse(200, req.user, "current user fetched successfully"));
});
// It will run when someone asks:
// "Who am I currently logged in as?"

// while updating files create separate controllers for them

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  // no need to use files here as we are taking one file only while updating

  //    User selects photo
  //        ↓
  // Multer receives it
  //        ↓
  // File temporarily stored on server
  //        ↓
  // req.file

  // req.file.path te;lls the temporary position of file in server

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    // "Did Cloudinary give me a URL?"
    throw new apiError(400, "Error while debugging");
  }

  const user = await User.findByIdAndUpdate(
    /// "Give me the database ID of the currently logged-in user."
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
        // "Change their avatar field to the new Cloudinary URL."
      },
    },
    { new: true }
    // "After updating, give me the new/updated user."
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImg = asyncHandler(async (req, res) => {
  const coverImgLocalPath = req.file?.path;

  if (!coverImgLocalPath) {
    throw new apiError(400, "coverImage file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImgLocalPath);

  if (!coverImage.url) {
    throw new apiError(400, "error while debugging");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url, // we will only set the cloudinary url not anything else
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  // channel/:username
  // "Whatever comes at this position in the URL, put it inside req.params.username."

  //e.g
  //     URL	req.params.username
  // channel/satish	"satish"

  if (!username?.trim()) {
    throw new apiError(400, "Username is missing");
    // "Stop! The user didn't provide a proper username."
  }

  // channel is an array which contains multiple values
  const channel = await User.aggregate([
    // an array is used for aggregation pipeline states
    // Now you're asking MongoDB:
    // "Go to the User collection and build me some data."
    // each {} inside the array is one step

    // User data
    //    ↓
    // Step 1
    //    ↓
    // Step 2
    //    ↓
    // Step 3
    //    ↓
    // Final result
    {
      //$match = filter/find the user I want.
      $match: {
        username: username?.toLowerCase(),
        // "Find the user whose username matches the username from the URL."
      },
    },
    {
      // This is basically a JOIN
      $lookup: {
        // "Find all subscription records where the user's _id
        //  matches the subscription's channel, and put those records into an array called subscribers."

        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        // "Has the currently logged-in user subscribed to this channel?"

        //         Suppose:

        // req.user._id = 456

        // and:

        // subscribers.subscriber = [123, 456, 789]

        // MongoDB checks:

        // Is 456 inside [123, 456, 789]?

        // Yes → true.

        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    // "From all the data we currently have, only send these fields in the final result."
    // You don't want to send everything, especially things like password.
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    }, // all thsese above things are stored in channel variable
    // and we have to return the 0th index data , as mongodb may return multiple documents
  ]);
  if (!channel?.length) {
    throw new apiError(400, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",

        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",

              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImg,
  getUserChannelProfile,
  getWatchHistory,
};
