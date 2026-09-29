import { Request, Response, NextFunction } from 'express';
import { Hospital } from '../models/Hospital.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class HospitalController {
  /**
   * Get public hospital profile (unauthenticated)
   */
  static async getHospitalProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let hospital = await Hospital.findOne();
      if (!hospital) {
        hospital = await Hospital.create({});
      }
      sendSuccess(res, 'Hospital information loaded', hospital);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update hospital settings & information (Admin only)
   */
  static async updateHospitalProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let hospital = await Hospital.findOne();
      if (!hospital) {
        hospital = await Hospital.create(req.body);
      } else {
        hospital = await Hospital.findByIdAndUpdate(hospital._id, req.body, { new: true });
      }
      sendSuccess(res, 'Hospital profile updated successfully', hospital);
    } catch (error) {
      next(error);
    }
  }
}
