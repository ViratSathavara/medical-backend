import { Request, Response, NextFunction } from 'express';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { BedStatus } from '../constants/statuses.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class RoomBedController {
  static async getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await Room.find({ isActive: true })
        .populate('department', 'name code')
        .sort({ floor: 1, roomNumber: 1 });

      const beds = await Bed.find()
        .populate('currentPatient', 'firstName lastName patientId');

      const roomBedMap: Record<string, any[]> = {};
      beds.forEach((b) => {
        const roomId = b.room.toString();
        if (!roomBedMap[roomId]) roomBedMap[roomId] = [];
        roomBedMap[roomId].push(b);
      });

      const enriched = rooms.map((r) => {
        const roomBeds = roomBedMap[r._id.toString()] || [];
        const availableBeds = roomBeds.filter((b) => b.status === BedStatus.AVAILABLE).length;
        const occupiedBeds = roomBeds.filter((b) => b.status === BedStatus.OCCUPIED).length;

        return {
          ...r.toObject(),
          beds: roomBeds,
          availableBeds,
          occupiedBeds
        };
      });

      sendSuccess(res, 'Rooms retrieved', enriched);
    } catch (error) {
      next(error);
    }
  }

  static async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomNumber, floor, roomType, totalBeds, dailyRate, departmentId, description } = req.body;

      const room = await Room.create({
        roomNumber,
        floor,
        roomType,
        totalBeds,
        dailyRate,
        department: departmentId,
        description
      });

      // Auto-generate beds for this room
      const bedsToCreate = [];
      for (let i = 1; i <= totalBeds; i++) {
        bedsToCreate.push({
          bedNumber: `${roomNumber}-${String.fromCharCode(64 + i)}`, // e.g. 101-A, 101-B
          room: room._id,
          bedType: roomType === 'ICU' ? 'ICU' : 'Standard',
          status: BedStatus.AVAILABLE,
          dailyRate
        });
      }
      await Bed.insertMany(bedsToCreate);

      sendSuccess(res, 'Room and beds created successfully', room, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getBeds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string;
      const query: any = {};
      if (status && status !== 'All') query.status = status;

      const beds = await Bed.find(query)
        .populate('room', 'roomNumber floor roomType')
        .populate('currentPatient', 'firstName lastName patientId phone')
        .sort({ bedNumber: 1 });

      sendSuccess(res, 'Beds retrieved', beds);
    } catch (error) {
      next(error);
    }
  }

  static async updateBedStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const bed = await Bed.findByIdAndUpdate(id, { status, notes }, { new: true });
      if (!bed) {
        sendError(res, 'Bed not found', 404);
        return;
      }

      sendSuccess(res, 'Bed status updated', bed);
    } catch (error) {
      next(error);
    }
  }
}
