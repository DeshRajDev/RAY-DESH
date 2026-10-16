import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { env } from '../../config/env';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);

      // Set cookie for browser clients
      res.cookie('couple_access_token', result.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Registration successful', 201);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      return sendError(res, msg, 400, 'REGISTER_FAILED');
    }
  }

  async login(req: Request, res: Response) {
    try {
      const identifier = req.body.identifier || req.body.email || req.body.phoneNumber || req.body.phone || '';
      const password = req.body.password || '';
      const result = await authService.login(identifier, password);

      res.cookie('couple_access_token', result.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Login successful');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      return sendError(res, msg, 401, 'LOGIN_FAILED');
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user) {
        await authService.logout(req.user.id);
      }
      res.clearCookie('couple_access_token');
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Logout failed';
      return sendError(res, msg, 400, 'LOGOUT_FAILED');
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    return sendSuccess(res, {
      user: req.user,
      couple: req.couple,
    });
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to change password';
      return sendError(res, msg, 400, 'CHANGE_PASSWORD_FAILED');
    }
  }
}

export const authController = new AuthController();
