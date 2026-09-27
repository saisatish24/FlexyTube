import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;  
  const  userId  = req.user._id;  

  if (!isValidObjectId(videoId)) {
  throw new apiError(400, "Invalid video ID");
  }

  const isLiked = await Like.findOne({
    video: videoId,
    likedBy: userId
  })
 
  if (isLiked){
    await Like.findByIdAndDelete(isLiked?._id)
  }
   else {
    await Like.create({
      video: videoId,
      likedBy: userId
    })
  }

  return res
     .status(200)
     .json(
       new apiResponse(200, {}, "Changed liked state successfully")
     )


});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  
  if(!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid Comment Id")
  }

  const isCommentLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  })

  if(!isCommentLike) {
   await Like.create({
      comment: commentId,
      likedBy: req.user._id
    })
  }
  else {
    await Like.findByIdAndDelete(isCommentLike?._id)
  }

   return res
     .status(200)
     .json(
       new apiResponse(200, {}, "Changed tweet liked state successfully")
     )

});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
 
  if(!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid Comment Id")
  }

  const isTweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  })

  if(!isTweetLike) {
   await Like.create({
      tweet: tweetId,
      likedBy: req.user._id
    })
  }
  else {
    await Like.findByIdAndDelete(isTweetLike?._id)
  }

   return res
     .status(200)
     .json(
       new apiResponse(200, {}, "Changed comment liked state successfully")
     )
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: { // no other user/owner details needed
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 1,
        video: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});


export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
