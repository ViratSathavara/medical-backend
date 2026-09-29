export enum AppointmentStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  REJECTED = 'Rejected',
  RESCHEDULED = 'Rescheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NO_SHOW = 'No-show'
}

export enum AppointmentType {
  IN_PERSON = 'In-person',
  ONLINE = 'Online consultation',
  EMERGENCY = 'Emergency',
  FOLLOW_UP = 'Follow-up'
}

export enum LabRequestStatus {
  REQUESTED = 'Requested',
  SAMPLE_COLLECTED = 'Sample Collected',
  PROCESSING = 'Processing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum PaymentStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  PARTIALLY_PAID = 'Partially Paid',
  REFUNDED = 'Refunded',
  CANCELLED = 'Cancelled'
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  UPI = 'UPI',
  ONLINE = 'Online payment'
}

export enum BedStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  RESERVED = 'Reserved',
  MAINTENANCE = 'Maintenance'
}

export enum RoomType {
  GENERAL_WARD = 'General Ward',
  SEMI_PRIVATE = 'Semi-Private',
  PRIVATE = 'Private',
  ICU = 'ICU',
  EMERGENCY = 'Emergency',
  OPERATION_THEATRE = 'Operation Theatre'
}

export enum AdmissionStatus {
  ADMITTED = 'Admitted',
  DISCHARGED = 'Discharged',
  TRANSFERRED = 'Transferred'
}

export enum EmergencyPriority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum DoctorStatus {
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  SUSPENDED = 'Suspended',
  REJECTED = 'Rejected'
}
