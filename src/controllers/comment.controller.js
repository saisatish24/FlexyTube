import mongoose ,{ isValidObjectId }from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video ID");
  }

  // 2. Setup pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  // 3. Build aggregation pipeline
  const commentsAggregate = Comment.aggregate([
    {
      // Stage 1: Match all comments for this specific video
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      // Stage 2: Join with "users" collection to get author details
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
      // Stage 3: Flatten the owner array into a single object
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      // Stage 4: Order by newest comments first
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  // Execute pagination using the mongooseAggregatePaginate plugin
  const comments = await Comment.aggregatePaginate(commentsAggregate, options);

  return res
    .status(200)
    .json(
      new apiResponse(200, comments, "Video comments fetched successfully")
    );
});


const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const  userId  = req.user._id;

  if(!isValidObjectId(videoId)){
    throw new apiError(400, "Invalid Video ID")
  }
  
  if (!content || content.trim() === "") {
  throw new apiError(400, "Comment content is required");
}

const setComment =  await Comment.create(
  {
    content : content.trim(),
    video : videoId,
    owner : userId,
  }
)

if(!setComment){
  throw new apiError(400, "Failed to create comment")
}

return res
.status(201)
.json(new apiResponse(200, setComment, "Comment created successfully"))

});


const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if(!isValidObjectId(commentId)){
    throw new apiError(400, "Invalid Comment ID")
  }

  if (!content || content.trim() === "") {
  throw new apiError(400, "Comment content is required");
}


  const comment = await Comment.findById(commentId);
  if(!comment){
    throw new apiError(404, "Comment not found")  
  }

  if(comment.owner.toString() !== req.user._id.toString()){
    throw new apiError(400, "You can't update this comment")
   }

  const updatedComm =  await Comment.findByIdAndUpdate(
    commentId,
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
   .json(new apiResponse(200, updatedComm, "Comment updated successfully"))




});

const deleteComment = asyncHandler(async (req, res) => {
   const { commentId } = req.params;
   const userId = req.user._id; 

   if (!isValidObjectId(commentId)) {
     throw new apiError(400, "Invalid comment ID");
     }

  
   const comment = await Comment.findById(commentId);

   if(!comment){
    throw new apiError(404, "Comment not Found");
   }

   if(comment.owner.toString() !== userId.toString()){
    // object id is not able to compare directly so convert into string
    throw new apiError(400, "You can't delete this comment")
   }

   await Comment.findByIdAndDelete(commentId);
   await Like.deleteMany({ comment: commentId }); // remove all likes for the deletd comment


   return res
  .status(200)
  .json(new apiResponse(200, {}, "Comment deleted successfully"));


   
});

export { getVideoComments, addComment, updateComment, deleteComment };
