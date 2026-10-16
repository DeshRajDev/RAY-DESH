import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Post } from '../../models/Post';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET partner feed posts
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await Post.find({ coupleId: req.couple!.id }).sort({ isPinned: -1, createdAt: -1 });
    return sendSuccess(res, posts.map((p: any) => p.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch posts';
    return sendError(res, msg, 500);
  }
});

// POST create feed post
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { caption, mediaUrls = [], songTitle, songArtist, location, tags = [] } = req.body;

    const post = await Post.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      authorId: new mongoose.Types.ObjectId(req.user!.id),
      caption,
      mediaUrls,
      songTitle,
      songArtist,
      location,
      tags,
      likes: [],
      comments: [],
      isPinned: false,
    });

    return sendSuccess(res, post.toJSON(), 'Post created', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create post';
    return sendError(res, msg, 500);
  }
});

// POST like/unlike post
router.post('/:id/like', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { emoji = '❤️' } = req.body;
    const post = await Post.findOne({ _id: req.params.id, coupleId: req.couple!.id });

    if (!post) return sendError(res, 'Post not found', 404);

    const existingIndex = post.likes.findIndex((l: any) => l.userId.toString() === userId);
    if (existingIndex > -1) {
      post.likes.splice(existingIndex, 1);
    } else {
      post.likes.push({
        userId: new mongoose.Types.ObjectId(userId),
        emoji,
      });
    }

    await post.save();
    return sendSuccess(res, post.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to like post';
    return sendError(res, msg, 500);
  }
});

// POST add comment
router.post('/:id/comment', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text } = req.body;
    const user = req.user!;
    const post = await Post.findOne({ _id: req.params.id, coupleId: req.couple!.id });

    if (!post) return sendError(res, 'Post not found', 404);

    post.comments.push({
      userId: new mongoose.Types.ObjectId(user.id),
      userName: user.name,
      userAvatar: user.avatar,
      text,
      createdAt: new Date().toISOString(),
    });

    await post.save();
    return sendSuccess(res, post.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add comment';
    return sendError(res, msg, 500);
  }
});

// DELETE post
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      coupleId: req.couple!.id,
      authorId: req.user!.id,
    });

    if (!post) return sendError(res, 'Post not found or unauthorized', 404);

    return sendSuccess(res, { id: req.params.id }, 'Post deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete post';
    return sendError(res, msg, 500);
  }
});

export const postRoutes = router;
