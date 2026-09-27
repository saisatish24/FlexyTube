import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Run subscriber count query and video/like aggregation in parallel
  const [totalSubscribers, videoAndLikeStats] = await Promise.all([
    Subscription.countDocuments({
      channel: new mongoose.Types.ObjectId(userId),
    }),
    Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likes" } },
        },
      },
    ]),
  ]);

  const channelStats = {
    totalSubscribers,
    totalVideos: videoAndLikeStats[0]?.totalVideos || 0,
    totalViews: videoAndLikeStats[0]?.totalViews || 0,
    totalLikes: videoAndLikeStats[0]?.totalLikes || 0,
  };

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        channelStats,
        "Channel stats fetched successfully"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const videoAggregate = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        commentsCount: { $size: "$comments" },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        likes: 0,
        comments: 0,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videos = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        videos,
        "Channel videos fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
