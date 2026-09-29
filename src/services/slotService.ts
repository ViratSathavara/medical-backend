import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { AppointmentStatus } from '../constants/statuses.js';

export interface GeneratedSlot {
  time: string;
  isAvailable: boolean;
  bookedCount: number;
  maxPatients: number;
}

export class SlotService {
  /**
   * Get available time slots for a doctor on a given date
   */
  static async getAvailableSlots(doctorId: string, targetDate: Date): Promise<{ day: string; slots: GeneratedSlot[] }> {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[targetDate.getDay()];

    // Check if doctor works on this day
    const isWorkingDay = doctor.availableDays.includes(dayName);
    if (!isWorkingDay) {
      return { day: dayName, slots: [] };
    }

    // Start of day & end of day in UTC/local
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch existing active appointments for doctor on this day
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED] }
    });

    const appointmentCountsByTime: Record<string, number> = {};
    existingAppointments.forEach((apt) => {
      appointmentCountsByTime[apt.appointmentTime] = (appointmentCountsByTime[apt.appointmentTime] || 0) + 1;
    });

    const slots: GeneratedSlot[] = doctor.availableTimeSlots.map((slot) => {
      const timeLabel = `${slot.startTime} - ${slot.endTime}`;
      const bookedCount = appointmentCountsByTime[timeLabel] || 0;
      const isAvailable = bookedCount < slot.maxPatients;

      return {
        time: timeLabel,
        isAvailable,
        bookedCount,
        maxPatients: slot.maxPatients
      };
    });

    return {
      day: dayName,
      slots
    };
  }

  /**
   * Check if a specific slot is available for booking
   */
  static async isSlotAvailable(doctorId: string, targetDate: Date, timeSlot: string): Promise<boolean> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return false;

    // Find the slot capacity
    const configuredSlot = doctor.availableTimeSlots.find((s) => `${s.startTime} - ${s.endTime}` === timeSlot);
    const maxCapacity = configuredSlot ? configuredSlot.maxPatients : 1;

    const count = await Appointment.countDocuments({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      appointmentTime: timeSlot,
      status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED] }
    });

    return count < maxCapacity;
  }
}
