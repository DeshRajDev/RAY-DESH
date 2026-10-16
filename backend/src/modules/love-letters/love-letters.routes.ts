import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { LoveLetter } from '../../models/LoveLetter';
import { User } from '../../models/User';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET all love letters (filters out future scheduled letters if viewer is recipient)
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const coupleId = req.couple!.id;
    const now = new Date();

    const letters = await LoveLetter.find({ coupleId }).sort({ createdAt: -1 });

    const visibleLetters = letters.map((letter: any) => {
      const isAuthor = letter.authorId.toString() === userId;
      const isLocked = letter.unlockDate && new Date(letter.unlockDate) > now;

      const obj = letter.toJSON();

      // If locked and viewer is the recipient, omit the content body until unlocked
      if (!isAuthor && isLocked) {
        obj.content = '🔒 Sealed with love. This letter will unlock on ' + letter.unlockDate;
      }
      return obj;
    });

    return sendSuccess(res, visibleLetters);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch letters';
    return sendError(res, msg, 500);
  }
});

// GET single letter by ID
router.get('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const letter = await LoveLetter.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!letter) return sendError(res, 'Letter not found', 404);

    const isAuthor = letter.authorId.toString() === req.user!.id;
    const isLocked = letter.unlockDate && new Date(letter.unlockDate) > new Date();

    if (!isAuthor && isLocked) {
      return sendError(res, `This letter is sealed until ${letter.unlockDate}`, 403);
    }

    return sendSuccess(res, letter.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch letter';
    return sendError(res, msg, 500);
  }
});

// POST create love letter
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couple = req.couple!;
    const userId = req.user!.id;
    const recipientId = couple.partner1Id.toString() === userId ? couple.partner2Id : couple.partner1Id;
    const recipient = await User.findById(recipientId);

    const { occasion, title, content, unlockDate, photos = [], audioVoiceNoteUrl, waxSealColor = 'monochrome-black' } = req.body;

    const letter = await LoveLetter.create({
      coupleId: new mongoose.Types.ObjectId(couple.id),
      authorId: new mongoose.Types.ObjectId(userId),
      authorName: req.user!.name,
      recipientId: new mongoose.Types.ObjectId(recipientId),
      recipientName: recipient?.name || 'My Love',
      occasion,
      title,
      content,
      isOpened: false,
      unlockDate,
      photos,
      audioVoiceNoteUrl,
      waxSealColor,
    });

    return sendSuccess(res, letter.toJSON(), 'Love letter sealed', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to write love letter';
    return sendError(res, msg, 500);
  }
});

// POST open/unseal love letter
router.post('/:id/open', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const letter = await LoveLetter.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!letter) return sendError(res, 'Letter not found', 404);

    if (letter.unlockDate && new Date(letter.unlockDate) > new Date()) {
      return sendError(res, `This letter is locked until ${letter.unlockDate}`, 403);
    }

    letter.isOpened = true;
    letter.openedAt = new Date().toISOString();
    await letter.save();

    return sendSuccess(res, letter.toJSON(), 'Letter unsealed');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to open letter';
    return sendError(res, msg, 500);
  }
});

export const loveLetterRoutes = router;
