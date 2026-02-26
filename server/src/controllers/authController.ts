import { Request, Response, NextFunction } from 'express';
import { Admin } from '../models/Admin';
import { signToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../utils/helpers';

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const token = signToken({ id: String(admin._id), email: admin.email });

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  }
);

export const getMe = asyncHandler(
  async (req: Request & { admin?: { id: string; email: string } }, res: Response) => {
    res.status(200).json({
      success: true,
      data: req.admin,  // matches ApiResponse<Admin> shape the client expects
    });
  }
);
