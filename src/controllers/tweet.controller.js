import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { Like } from "../models/like.model.js";

const createTweet = asyncHandler(async (req, res) => {

  // When creating a tweet, it doesn't exist yet, 
  // so there is no existing owner to check against—the 
  // logged-in user (req.user._id) is automatically assigned as the new owner.

  // You only check the owner in update/delete to make sure 
  // someone isn't modifying or deleting another user's existing tweet.

  const { content } = req.body;
  const userId = req.user?._id;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: userId
  })

  return res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweet created successfully"))
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // 1. Validate the user ID from the URL
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid User ID");
  }

  // 2. Fetch all tweets by this user using an Aggregation Pipeline
  const tweets = await Tweet.aggregate([
    {
      // Stage 1: Filter tweets where owner matches userId
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      // Stage 2: Lookup author/owner details (username, fullname, avatar)
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      // Stage 3: Lookup likes for this tweet from the "likes" collection
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      // Stage 4: Reshape data: flatten owner, count likes, check if current user liked it
      $addFields: {
        ownerDetails: {
          $first: "$ownerDetails",
        },
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // Stage 5: Sort newest tweets first
      $sort: {
        createdAt: -1,
      },
    },
    {
      // Stage 6: Project only clean, required fields
      $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
        ownerDetails: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  // 3. Return the response
  return res
    .status(200)
    .json(new apiResponse(200, tweets, "User tweets fetched successfully"));
});


const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if(!isValidObjectId(tweetId)){
    throw new apiError(400, "Invalid Tweet ID");
  }

  if(!content || content.trim() === ""){
    throw new apiError(400, "Content is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if(!tweet) {
    throw new apiError(400, "Tweet not found")
  }

  if( tweet.owner.toString() !== req.user?._id.toString()){
    throw new apiError(400, "You can't update the tweet");
  }

    const updatedTweet  =  await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
        content : content.trim(),
        }
      },
      { 
        new : true
      }
     )

     return res
     .status(200)
     .json(new apiResponse(200, updatedTweet, "Tweet is updated"))


});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(tweetId)){
    throw new apiError(400, "Invalid Tweet ID");
  }

//   findByIdAndDelete(tweetId) only checks the tweet's ID,
//  completely ignoring who created it.
// If Alice writes a tweet, and Bob sends a request with Alice's tweetId,
//  findByIdAndDelete will delete Alice's tweet!
// Any logged-in user could delete every tweet on your entire platform.


// hence first we need to check whether the login user is same as the owner of this tweet or not.

  const tweet = await Tweet.findById(tweetId);

  if ( !tweet ) {
    throw new apiError(400, "Tweet not found");
  }

  if( tweet.owner.toString() !== userId.toString()){
    throw new apiError(400, "You can't delete this tweet");
  }

  await Tweet.findByIdAndDelete(tweetId);

  await Like.deleteMany({
    tweet : tweetId,
  })

  return res
  .status(200)
  .json(new apiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
