import mongoose from "mongoose";
import { PostModel, PostLikeModel } from "@/models";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

// export const likePost = async (
//   req: AuthRequest,
//   res: Response
// ): Promise<any> => {
//   const postId = req.params.id;
//   const currUserId = req.user?.id; // ✅ Comes from JWT, not the body

//   if (!currUserId) {
//     return res.status(401).json({
//       message: "Unauthorized: No user ID found in token",
//       status: "ERROR",
//       payload: null,
//     });
//   }

//   if (!mongoose.Types.ObjectId.isValid(postId)) {
//     return res.status(400).json({
//       message: "Post ID format is not valid",
//       status: "ERROR",
//       payload: null,
//     });
//   }

//   try {
//     const currentUser = await UserModel.findById(currUserId);
//     if (!currentUser) {
//       return res.status(404).json({
//         message: "User not found",
//         status: "ERROR",
//         payload: null,
//       });
//     }

//     const post = await PostModel.findById(postId);
//     if (!post) {
//       return res.status(404).json({
//         message: "Post not found",
//         status: "ERROR",
//         payload: null,
//       });
//     }

//     const isLiked = post.likes.includes(currUserId);
//     const update = isLiked
//       ? { $pull: { likes: currUserId } }
//       : { $push: { likes: currUserId } };

//     const updatedPost = await PostModel.findByIdAndUpdate(postId, update, {
//       new: true,
//     });

//     res.status(200).json({
//       message: isLiked ? "Unliked post." : "Liked successfully.",
//       status: "SUCCESS",
//       payload: updatedPost,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       message: error.message || "Failed due to server error",
//       payload: null,
//       status: "ERROR",
//     });
//   }
// };

export const likePost = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  const postId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized",
      payload: null,
    });
  }

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid post ID",
      payload: null,
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const post = await PostModel.findById(postId).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "ERROR",
        message: "Post not found",
        payload: null,
      });
    }

    const existingLike = await PostLikeModel.findOne({
      postId,
      userId,
    }).session(session);

    let liked: boolean;

    if (existingLike) {
      // UNLIKE
      await PostLikeModel.deleteOne({ _id: existingLike._id }).session(session);

      await PostModel.updateOne(
        { _id: postId },
        { $inc: { likeCount: -1 } },
        { session }
      );

      liked = false;
    } else {
      // LIKE
      await PostLikeModel.create(
        [
          {
            postId,
            userId,
          },
        ],
        { session }
      );

      await PostModel.updateOne(
        { _id: postId },
        { $inc: { likeCount: 1 } },
        { session }
      );
      liked = true;
    }

    await session.commitTransaction();

    const updatedPost = await PostModel.findById(postId).select("likeCount");

    return res.status(200).json({
      status: "SUCCESS",
      message: liked ? "Post liked" : "Post unliked",
      payload: {
        likedByMe: liked,
        likeCount: updatedPost?.likeCount ?? 0,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();

    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Server error",
      payload: null,
    });
  } finally {
    session.endSession();
  }
};
