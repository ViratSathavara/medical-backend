import { Request, Response, NextFunction } from 'express';
import { Medicine } from '../models/Medicine.js';
import { MedicineStock } from '../models/MedicineStock.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditService } from '../services/auditService.js';

export class PharmacyController {
  /**
   * List medicines with search, category filtering, low stock filter, and pagination
   */
  static async getMedicines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 12;
      const search = (req.query.search as string || '').trim();
      const category = req.query.category as string;
      const isLowStock = req.query.lowStock === 'true';

      const query: any = { isActive: true };

      if (category && category !== 'All') {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { genericName: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { batchNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (isLowStock) {
        query.$expr = { $lte: ['$quantity', '$minStockAlert'] };
      }

      const total = await Medicine.countDocuments(query);
      const medicines = await Medicine.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Medicines retrieved', medicines, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add new medicine
   */
  static async addMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medicine = await Medicine.create(req.body);

      // Record initial stock entry
      if (medicine.quantity > 0) {
        await MedicineStock.create({
          medicine: medicine._id,
          transactionType: 'IN',
          quantity: medicine.quantity,
          previousQuantity: 0,
          newQuantity: medicine.quantity,
          reason: 'Initial Inventory Inward',
          performedBy: req.user?.userId
        });
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'MEDICINE_ADDED',
        module: 'PHARMACY',
        resourceId: medicine._id.toString()
      });

      sendSuccess(res, 'Medicine registered successfully', medicine, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update medicine
   */
  static async updateMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await Medicine.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

      if (!updated) {
        sendError(res, 'Medicine not found', 404);
        return;
      }

      sendSuccess(res, 'Medicine updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adjust medicine inventory stock (IN, OUT, ADJUSTMENT)
   */
  static async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type, quantity, reason, referenceNumber } = req.body; // type: 'IN' | 'OUT' | 'ADJUSTMENT'

      const medicine = await Medicine.findById(id);
      if (!medicine) {
        sendError(res, 'Medicine not found', 404);
        return;
      }

      const prevQty = medicine.quantity;
      let newQty = prevQty;

      if (type === 'IN') {
        newQty = prevQty + quantity;
      } else if (type === 'OUT') {
        if (prevQty < quantity) {
          sendError(res, `Insufficient stock! Current stock: ${prevQty}`, 400);
          return;
        }
        newQty = prevQty - quantity;
      } else if (type === 'ADJUSTMENT') {
        newQty = quantity;
      }

      medicine.quantity = newQty;
      await medicine.save();

      const transaction = await MedicineStock.create({
        medicine: medicine._id,
        transactionType: type,
        quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason: reason || 'Manual stock adjustment',
        referenceNumber,
        performedBy: req.user?.userId
      });

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: `STOCK_ADJUSTMENT_${type}`,
        module: 'PHARMACY',
        resourceId: id,
        details: { prevQty, newQty, type }
      });

      sendSuccess(res, 'Stock adjusted successfully', {
        medicine,
        transaction
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get alerts for low stock and expiring medicines
   */
  static async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [lowStockMedicines, expiringSoonMedicines] = await Promise.all([
        Medicine.find({
          isActive: true,
          $expr: { $lte: ['$quantity', '$minStockAlert'] }
        }),
        Medicine.find({
          isActive: true,
          expiryDate: { $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) } // Next 60 days
        })
      ]);

      sendSuccess(res, 'Pharmacy alerts loaded', {
        lowStockMedicines,
        expiringSoonMedicines,
        lowStockCount: lowStockMedicines.length,
        expiringCount: expiringSoonMedicines.length
      });
    } catch (error) {
      next(error);
    }
  }
}
