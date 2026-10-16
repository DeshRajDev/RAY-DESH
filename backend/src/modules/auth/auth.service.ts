import { User, IUser } from '../../models/User';
import { Couple, ICouple } from '../../models/Couple';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterInput {
  name: string;
  nickname?: string;
  email: string;
  password: string;
  birthday: string;
  role: 'partner1' | 'partner2';
  partnerEmail?: string;
  inviteCode?: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(input.password);

    // If an invite code is provided, join existing couple
    let existingCouple: ICouple | null = null;
    if (input.inviteCode) {
      existingCouple = await Couple.findOne({ inviteCode: input.inviteCode });
      if (!existingCouple) {
        throw new Error('Invalid invite code.');
      }
    }

    const newUser: IUser = await User.create({
      name: input.name,
      nickname: input.nickname || '',
      email: input.email.toLowerCase(),
      passwordHash,
      birthday: input.birthday,
      role: input.role,
      isOnline: true,
    });

    let couple: ICouple;
    if (existingCouple) {
      existingCouple.partner2 = newUser._id;
      existingCouple.inviteCode = undefined; // Consumed
      await existingCouple.save();
      couple = existingCouple;
      newUser.coupleId = couple._id;
      newUser.role = 'partner2';
      await newUser.save();
    } else {
      // Create new Couple workspace with placeholder partner2 until paired
      const inviteCode = uuidv4().substring(0, 8).toUpperCase();
      couple = await Couple.create({
        partner1: newUser._id,
        partner2: newUser._id, // Will be replaced upon partner pairing
        inviteCode,
        customTitle: `${newUser.name}'s Sanctuary`,
      });
      newUser.coupleId = couple._id;
      await newUser.save();
    }

    const tokenPayload = {
      userId: newUser._id.toString(),
      coupleId: couple._id.toString(),
      role: newUser.role,
      email: newUser.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return {
      user: newUser.toJSON(),
      couple: couple.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  async login(identifier: string, password: string) {
    const cleaned = identifier.trim().toLowerCase();
    const rawDigits = identifier.replace(/\D/g, '');

    const user = await User.findOne({
      $or: [
        { email: cleaned },
        ...(rawDigits ? [{ phoneNumber: rawDigits }] : []),
        { name: new RegExp(`^${identifier.trim()}$`, 'i') },
      ],
    });

    if (!user) {
      throw new Error('Invalid phone number/email or password.');
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid phone number/email or password.');
    }

    user.isOnline = true;
    user.lastSeen = 'Active just now';
    await user.save();

    let couple: ICouple | null = null;
    if (user.coupleId) {
      couple = await Couple.findById(user.coupleId).populate('partner1 partner2');
    }

    const tokenPayload = {
      userId: user._id.toString(),
      coupleId: couple ? couple._id.toString() : undefined,
      role: user.role,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return {
      user: user.toJSON(),
      couple: couple ? couple.toJSON() : null,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: new Date().toISOString(),
    });
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const isMatch = await verifyPassword(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new Error('Current password does not match.');
    }

    user.passwordHash = await hashPassword(newPass);
    await user.save();
  }
}

export const authService = new AuthService();
