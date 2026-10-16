import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Birthday } from '../../models/Birthday';
import { User } from '../../models/User';
import { sendSuccess, sendError } from '../../utils/response';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

const router = Router();

// GET birthday data
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couple = req.couple!;
    const userId = req.user!.id;
    const partnerId = couple.partner1Id.toString() === userId ? couple.partner2Id : couple.partner1Id;

    const partner = await User.findById(partnerId);

    let bData = await Birthday.findOne({ coupleId: couple.id });
    if (!bData) {
      bData = await Birthday.create({
        coupleId: new mongoose.Types.ObjectId(couple.id),
        plans: [],
        wishes: [],
        specialMessageForPartner: `Happy Birthday to my favorite person in the world! ❤️`,
        specialMessageFromPartner: `Thank you for being my constant light.`,
      });
    }

    const payload = {
      ...bData.toJSON(),
      partnerBirthday: partner?.birthday || '2005-11-01T00:00:00.000Z',
      myBirthday: req.user!.birthday || '2004-05-15T00:00:00.000Z',
      partnerName: partner?.name || 'Partner',
    };

    return sendSuccess(res, payload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch birthday data';
    return sendError(res, msg, 500);
  }
});

// POST add secret birthday plan
router.post('/plans', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = (req as AuthenticatedRequest).body || {};
    const { title, category = 'Gift Idea', budget, notes } = body;

    let bData = await Birthday.findOne({ coupleId: req.couple!.id });
    if (!bData) {
      bData = await Birthday.create({
        coupleId: new mongoose.Types.ObjectId(req.couple!.id),
        plans: [],
        wishes: [],
      });
    }

    const newPlan = {
      id: uuidv4(),
      title,
      category,
      budget,
      notes,
      status: 'planned' as const,
      secret: true,
      addedById: new mongoose.Types.ObjectId(req.user!.id),
    };

    bData.plans.push(newPlan);
    await bData.save();

    return sendSuccess(res, newPlan, 'Plan added', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add plan';
    return sendError(res, msg, 500);
  }
});

// POST add gift wish
router.post('/wishes', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = (req as AuthenticatedRequest).body || {};
    const { title, description, price, linkUrl, photoUrl } = body;

    let bData = await Birthday.findOne({ coupleId: req.couple!.id });
    if (!bData) {
      bData = await Birthday.create({
        coupleId: new mongoose.Types.ObjectId(req.couple!.id),
        plans: [],
        wishes: [],
      });
    }

    const newWish = {
      id: uuidv4(),
      forUserId: new mongoose.Types.ObjectId(req.user!.id),
      title,
      description: description || '',
      price,
      linkUrl,
      photoUrl,
      isClaimed: false,
    };

    bData.wishes.push(newWish);
    await bData.save();

    return sendSuccess(res, newWish, 'Wishlist item added', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add wish';
    return sendError(res, msg, 500);
  }
});

// POST toggle claim wish
router.post('/wishes/:wishId/toggle-claim', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bData = await Birthday.findOne({ coupleId: req.couple!.id });
    if (!bData) return sendError(res, 'Birthday data not found', 404);

    const wishId = (req as AuthenticatedRequest).params?.wishId;
    const wish = bData.wishes.find((w: any) => w.id === wishId);
    if (!wish) return sendError(res, 'Wish not found', 404);

    wish.isClaimed = !wish.isClaimed;
    await bData.save();

    return sendSuccess(res, wish);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle claim';
    return sendError(res, msg, 500);
  }
});

export const birthdayRoutes = router;
