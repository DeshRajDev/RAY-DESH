import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Message } from '../../models/Message';
import { Memory } from '../../models/Memory';
import { Song } from '../../models/Song';
import { Journal } from '../../models/Journal';
import { LoveLetter } from '../../models/LoveLetter';
import { BucketList } from '../../models/BucketList';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// GET search across couple sanctuary
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      return sendSuccess(res, {
        messages: [],
        memories: [],
        songs: [],
        journal: [],
        letters: [],
        bucketList: [],
      });
    }

    const coupleId = req.couple!.id;
    const userId = req.user!.id;
    const safePattern = new RegExp(escapeRegex(q), 'i');

    const [messages, memories, songs, journal, letters, bucketList] = await Promise.all([
      Message.find({ coupleId, content: safePattern }).limit(10),
      Memory.find({
        coupleId,
        $or: [{ title: safePattern }, { description: safePattern }, { tags: safePattern }],
      }).limit(10),
      Song.find({
        coupleId,
        $or: [{ title: safePattern }, { artist: safePattern }, { album: safePattern }],
      }).limit(10),
      Journal.find({
        coupleId,
        $or: [
          { isPrivate: false, title: safePattern },
          { isPrivate: false, content: safePattern },
          { authorId: userId, title: safePattern },
          { authorId: userId, content: safePattern },
        ],
      }).limit(10),
      LoveLetter.find({
        coupleId,
        $or: [{ title: safePattern }, { occasion: safePattern }],
      }).limit(10),
      BucketList.find({
        coupleId,
        $or: [{ title: safePattern }, { description: safePattern }],
      }).limit(10),
    ]);

    return sendSuccess(res, {
      messages: messages.map((m: any) => m.toJSON()),
      memories: memories.map((m: any) => m.toJSON()),
      songs: songs.map((s: any) => s.toJSON()),
      journal: journal.map((j: any) => j.toJSON()),
      letters: letters.map((l: any) => l.toJSON()),
      bucketList: bucketList.map((b: any) => b.toJSON()),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    return sendError(res, msg, 500);
  }
});

export const searchRoutes = router;
