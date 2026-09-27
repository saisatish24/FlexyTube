import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express(); // an express applicatn is created

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// Enable CORS for all routes
// cors - it allows your server to accept requests from different origins,
// which is important for APIs that are accessed by web applications hosted on different domains.

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// express.json() - it parses incoming requests with JSON payloads and is based on body-parser.
// express.urlencoded() - it parses incoming requests with URL-encoded payloads and is based on body-parser.
// serves static files from the "public" directory, allowing you to serve images, CSS files, and JavaScript files directly to clients

//routes

// use - connects routes and middlewares

// whenever someone asks for api/v1/users send them to userRouter
import userRouter from "./routes/user.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export { app };
