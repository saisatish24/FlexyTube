import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // bring your token for verification
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      // if no token
      throw new apiError(401, "Unauthorized request");
    }

    // jwt is a type of Token which contains data with an id(payload)

    //   JWT = digital ID card
    // Access Token = the JWT you use to access protected APIs
    // jwt.sign() = creates the ID card
    // jwt.verify() = checks whether the ID card is genuine and valid.
    // is this a real pass , match with the token secret stored in .env ( not the actual token but secret )
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // The token will never equal the secret.

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    ); // JWT conatins info like id , username

    if (!user) {
      // didnt find user in the db
      throw new apiError(401, "Invalid Access Token");
      //  "This token doesn't belong to a valid user. Stop."
    }

    req.user = user;
    next();
    // req.user = user means "attach the logged-in user's information to this request so the next function can use it."
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid access token");
  }
});
