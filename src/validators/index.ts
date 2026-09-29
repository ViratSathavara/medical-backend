import { z } from 'zod';
import { UserRole } from '../constants/roles.js';
import { AppointmentType, AppointmentStatus, PaymentMethod, RoomType, EmergencyPriority } from '../constants/statuses.js';

// Auth
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN, UserRole.STAFF]).default(UserRole.PATIENT),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(5, 'Phone number is required'),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    // Doctor specific fields if role is DOCTOR
    specialization: z.string().optional(),
    departmentId: z.string().optional(),
    consultationFee: z.number().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters')
  })
});

// Appointment
export const bookAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().min(1, 'Doctor is required'),
    departmentId: z.string().min(1, 'Department is required'),
    appointmentDate: z.string().min(1, 'Date is required'),
    appointmentTime: z.string().min(1, 'Time slot is required'),
    type: z.enum([AppointmentType.IN_PERSON, AppointmentType.ONLINE, AppointmentType.EMERGENCY, AppointmentType.FOLLOW_UP]).default(AppointmentType.IN_PERSON),
    reason: z.string().min(2, 'Reason is required'),
    symptoms: z.array(z.string()).optional(),
    notes: z.string().optional(),
    patientId: z.string().optional() // for admin or doctor booking on behalf of patient
  })
});

export const updateAppointmentStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.REJECTED,
      AppointmentStatus.RESCHEDULED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW
    ]),
    cancellationReason: z.string().optional()
  })
});

// Medical Record
export const createMedicalRecordSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient is required'),
    appointmentId: z.string().optional(),
    visitDate: z.string().optional(),
    symptoms: z.array(z.string()).default([]),
    diagnosis: z.string().min(2, 'Diagnosis is required'),
    treatment: z.string().min(2, 'Treatment is required'),
    clinicalNotes: z.string().optional(),
    vitalSigns: z.object({
      bpSystolic: z.number().optional(),
      bpDiastolic: z.number().optional(),
      heartRate: z.number().optional(),
      temperature: z.number().optional(),
      oxygenSaturation: z.number().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
      bmi: z.number().optional()
    }).optional(),
    allergies: z.array(z.string()).optional(),
    existingConditions: z.array(z.string()).optional()
  })
});

// Prescription
export const createPrescriptionSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient is required'),
    appointmentId: z.string().optional(),
    diagnosis: z.string().min(2, 'Diagnosis is required'),
    medicines: z.array(
      z.object({
        name: z.string().min(1, 'Medicine name is required'),
        dosage: z.string().min(1, 'Dosage is required'),
        frequency: z.string().min(1, 'Frequency is required'),
        duration: z.string().min(1, 'Duration is required'),
        route: z.string().optional(),
        instructions: z.string().optional()
      })
    ).min(1, 'At least one medicine is required'),
    notes: z.string().optional()
  })
});

// Pharmacy & Medicine
export const createMedicineSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    genericName: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    manufacturer: z.string().min(1, 'Manufacturer is required'),
    batchNumber: z.string().min(1, 'Batch number is required'),
    expiryDate: z.string().min(1, 'Expiry date is required'),
    quantity: z.number().min(0, 'Quantity cannot be negative'),
    minStockAlert: z.number().min(0).default(10),
    purchasePrice: z.number().min(0),
    sellingPrice: z.number().min(0),
    unit: z.string().default('Tablets'),
    description: z.string().optional()
  })
});

// Laboratory
export const createLabTestSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required'),
    category: z.string().min(1, 'Category is required'),
    price: z.number().min(0),
    normalRange: z.string().optional(),
    units: z.string().optional(),
    sampleType: z.string().default('Blood'),
    description: z.string().optional(),
    turnaroundHours: z.number().default(24)
  })
});

export const createLabRequestSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient is required'),
    testIds: z.array(z.string()).min(1, 'Select at least one test'),
    appointmentId: z.string().optional(),
    priority: z.enum(['Routine', 'Urgent', 'STAT']).default('Routine'),
    clinicalNotes: z.string().optional()
  })
});

export const enterLabResultSchema = z.object({
  body: z.object({
    results: z.array(
      z.object({
        testId: z.string().min(1),
        testName: z.string().min(1),
        result: z.string().min(1, 'Result is required'),
        normalRange: z.string().optional(),
        units: z.string().optional(),
        flag: z.enum(['Normal', 'Abnormal', 'Critical']).default('Normal'),
        remarks: z.string().optional()
      })
    ).min(1, 'At least one result item required'),
    technicianNotes: z.string().optional()
  })
});

// Billing & Invoices
export const createInvoiceSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient is required'),
    appointmentId: z.string().optional(),
    items: z.array(
      z.object({
        description: z.string().min(1, 'Description required'),
        category: z.enum(['Consultation', 'Laboratory', 'Pharmacy', 'Room', 'Procedure', 'Other']).default('Consultation'),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        amount: z.number().min(0)
      })
    ).min(1, 'At least one line item required'),
    discount: z.number().default(0),
    tax: z.number().default(0),
    notes: z.string().optional(),
    dueDate: z.string().optional()
  })
});

export const recordPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().min(1, 'Invoice is required'),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.UPI, PaymentMethod.ONLINE]),
    transactionId: z.string().optional(),
    notes: z.string().optional()
  })
});

// Rooms & Beds
export const createRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1, 'Room number required'),
    floor: z.number().min(0),
    roomType: z.enum([
      RoomType.GENERAL_WARD,
      RoomType.SEMI_PRIVATE,
      RoomType.PRIVATE,
      RoomType.ICU,
      RoomType.EMERGENCY,
      RoomType.OPERATION_THEATRE
    ]),
    totalBeds: z.number().min(1),
    dailyRate: z.number().min(0),
    departmentId: z.string().optional(),
    description: z.string().optional()
  })
});

// Admissions & Discharges
export const admitPatientSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient is required'),
    doctorId: z.string().min(1, 'Doctor is required'),
    departmentId: z.string().min(1, 'Department is required'),
    roomId: z.string().min(1, 'Room is required'),
    bedId: z.string().min(1, 'Bed is required'),
    admissionReason: z.string().min(2, 'Admission reason is required'),
    initialDiagnosis: z.string().min(2, 'Initial diagnosis is required'),
    emergencyContact: z.object({
      name: z.string().default(''),
      relation: z.string().default(''),
      phone: z.string().default('')
    }).optional(),
    notes: z.string().optional()
  })
});

export const dischargePatientSchema = z.object({
  body: z.object({
    finalDiagnosis: z.string().min(2, 'Final diagnosis is required'),
    treatmentSummary: z.string().min(2, 'Treatment summary is required'),
    dischargeInstructions: z.string().min(2, 'Discharge instructions required'),
    prescribedMedicines: z.array(
      z.object({
        medicineName: z.string().min(1),
        dosage: z.string().min(1),
        frequency: z.string().min(1),
        duration: z.string().min(1),
        instructions: z.string().optional()
      })
    ).optional(),
    followUpDate: z.string().optional(),
    doctorNotes: z.string().optional()
  })
});

// Emergency
export const createEmergencyCaseSchema = z.object({
  body: z.object({
    patientName: z.string().min(1, 'Patient name is required'),
    patientId: z.string().optional(),
    age: z.number().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    contactPhone: z.string().optional(),
    priority: z.enum([EmergencyPriority.CRITICAL, EmergencyPriority.HIGH, EmergencyPriority.MEDIUM, EmergencyPriority.LOW]),
    symptoms: z.string().min(2, 'Symptoms description required'),
    initialDiagnosis: z.string().optional(),
    triageNotes: z.string().optional(),
    attendingDoctorId: z.string().optional(),
    departmentId: z.string().optional()
  })
});

// Message
export const sendMessageSchema = z.object({
  body: z.object({
    recipientId: z.string().min(1, 'Recipient is required'),
    subject: z.string().optional(),
    content: z.string().min(1, 'Message content is required')
  })
});
