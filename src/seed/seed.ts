import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { Admin } from '../models/Admin.js';
import { Staff } from '../models/Staff.js';
import { Department } from '../models/Department.js';
import { Appointment } from '../models/Appointment.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { Prescription } from '../models/Prescription.js';
import { Medicine } from '../models/Medicine.js';
import { MedicineStock } from '../models/MedicineStock.js';
import { LabTest } from '../models/LabTest.js';
import { LabRequest } from '../models/LabRequest.js';
import { LabReport } from '../models/LabReport.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { Admission } from '../models/Admission.js';
import { Discharge } from '../models/Discharge.js';
import { EmergencyCase } from '../models/EmergencyCase.js';
import { Notification } from '../models/Notification.js';
import { Hospital } from '../models/Hospital.js';
import { AuditLog } from '../models/AuditLog.js';
import { UserRole, StaffDesignation } from '../constants/roles.js';
import { AppointmentStatus, AppointmentType, PaymentStatus, PaymentMethod, BedStatus, RoomType, EmergencyPriority, DoctorStatus } from '../constants/statuses.js';
import { PdfService } from '../services/pdfService.js';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      Admin.deleteMany({}),
      Staff.deleteMany({}),
      Department.deleteMany({}),
      Appointment.deleteMany({}),
      MedicalRecord.deleteMany({}),
      Prescription.deleteMany({}),
      Medicine.deleteMany({}),
      MedicineStock.deleteMany({}),
      LabTest.deleteMany({}),
      LabRequest.deleteMany({}),
      LabReport.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Room.deleteMany({}),
      Bed.deleteMany({}),
      Admission.deleteMany({}),
      Discharge.deleteMany({}),
      EmergencyCase.deleteMany({}),
      Notification.deleteMany({}),
      Hospital.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('🌱 Seeding Hospital Profile...');
    await Hospital.create({
      name: 'MedPulse General & Super Speciality Hospital',
      tagline: 'Leading Healthcare with Clinical Precision and Compassionate Care',
      logo: '/logo.png',
      address: {
        street: '742 Evergreen Medical Park, Sector 4',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      },
      phone: '+1 (555) 234-5678',
      email: 'info@medpulsehospital.com',
      emergencyNumber: '+1 (555) 911-0000',
      website: 'https://medpulsehospital.com',
      about: 'MedPulse Hospital is a world-class 500-bed tertiary care healthcare destination with international clinical protocols, multi-organ transplant units, robotic surgical infrastructure, and comprehensive emergency trauma networks.',
      facilities: [
        '24/7 Level 1 Trauma & Resuscitation Center',
        'Advanced Cardiovascular Catheterization Laboratories',
        'Dedicated Pediatric & Neonatal Intensive Care (NICU)',
        'Comprehensive Oncology & Linear Accelerator Radiation Center',
        'State-of-the-Art 3T MRI, 128-Slice High Speed CT & PET-CT',
        'Automated Central Clinical Pathology and Molecular Lab',
        '24/7 In-House Digital Pharmacy with Emergency Stock Delivery'
      ],
      workingHours: '24 Hours Emergency | OPD Consultations: Mon - Sat 08:00 AM - 08:00 PM'
    });

    console.log('🌱 Seeding Departments...');
    const departmentsData = [
      { name: 'Cardiology', code: 'CARD', icon: 'HeartPulse', description: 'Advanced diagnosis and interventions for cardiovascular and heart diseases.' },
      { name: 'Neurology', code: 'NEUR', icon: 'Brain', description: 'Comprehensive neurological disorders, spine care, and stroke rehabilitation.' },
      { name: 'Pediatrics', code: 'PED', icon: 'Baby', description: 'Specialized healthcare, neonatology, and vaccinations for infants, children, and teens.' },
      { name: 'Orthopedics', code: 'ORTH', icon: 'Bone', description: 'Joint replacement, trauma management, arthroscopy, and sports injury medicine.' },
      { name: 'Dermatology', code: 'DERM', icon: 'Sparkles', description: 'Clinical and aesthetic dermatology, laser therapies, and allergy management.' },
      { name: 'Gynecology & Obstetrics', code: 'GYN', icon: 'Users', description: 'Women healthcare, high-risk pregnancy management, and fertility treatments.' },
      { name: 'General Medicine', code: 'GEN', icon: 'Stethoscope', description: 'Adult internal medicine, metabolic disease management, and preventative checkups.' },
      { name: 'ENT (Otolaryngology)', code: 'ENT', icon: 'Headphones', description: 'Ear, nose, throat, head and neck surgical interventions.' },
      { name: 'Ophthalmology', code: 'OPHT', icon: 'Eye', description: 'Micro-incisional cataract surgery, laser vision correction, and glaucoma care.' },
      { name: 'Dentistry', code: 'DENT', icon: 'Smile', description: 'Restorative, aesthetic, maxillofacial surgery, and implantology.' },
      { name: 'Radiology & Imaging', code: 'RAD', icon: 'Scan', description: 'High-precision diagnostic imaging, ultrasound, MRI, and digital radiography.' },
      { name: 'Pathology & Diagnostics', code: 'PATH', icon: 'FlaskConical', description: 'Automated clinical biochemistry, hematology, and histopathology.' },
      { name: 'Emergency & Trauma Care', code: 'EMERG', icon: 'Ambulance', description: 'Immediate life-saving emergency care with acute triage teams.' },
      { name: 'Intensive Care Unit (ICU)', code: 'ICU', icon: 'Activity', description: 'Critical care life-support monitoring with multidisciplinary intensivists.' }
    ];

    const createdDepts = await Department.insertMany(departmentsData);
    const deptMap: Record<string, any> = {};
    createdDepts.forEach((d) => {
      deptMap[d.code] = d;
    });

    console.log('🌱 Seeding Core Demo Accounts (Admin, Doctor, Patient)...');
    // 1. Admin
    const adminUser = await User.create({
      email: 'admin@hospital.com',
      password: 'Password123!',
      role: UserRole.ADMIN,
      phone: '+1 (555) 000-1111',
      isActive: true,
      isVerified: true
    });

    const adminProfile = await Admin.create({
      user: adminUser._id,
      adminId: 'ADM-1001',
      firstName: 'Marcus',
      lastName: 'Vance',
      permissions: ['ALL'],
      phone: '+1 (555) 000-1111'
    });

    adminUser.adminProfile = adminProfile._id;
    await adminUser.save();

    // 2. Lead Doctor
    const doctorUser = await User.create({
      email: 'doctor@hospital.com',
      password: 'Password123!',
      role: UserRole.DOCTOR,
      phone: '+1 (555) 222-3333',
      isActive: true,
      isVerified: true
    });

    const doctorProfile = await Doctor.create({
      user: doctorUser._id,
      doctorId: 'DOC-2001',
      firstName: 'Sarah',
      lastName: 'Chen',
      specialization: 'Senior Interventional Cardiologist',
      department: deptMap['CARD']._id,
      qualifications: ['MBBS (Harvard)', 'MD (Cardiology)', 'FACC'],
      experienceYears: 14,
      consultationFee: 75,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      roomNumber: 'Suite 302',
      phone: '+1 (555) 222-3333',
      status: DoctorStatus.APPROVED,
      rating: 4.9,
      totalReviews: 48,
      bio: 'Dr. Sarah Chen is an internationally certified interventional cardiologist specializing in complex coronary interventions, heart failure management, and preventative cardiology.'
    });

    doctorUser.doctorProfile = doctorProfile._id;
    await doctorUser.save();

    // Update Cardiology head doctor
    await Department.findByIdAndUpdate(deptMap['CARD']._id, { headDoctor: doctorProfile._id });

    // Additional Doctors for variety
    const otherDoctorsData = [
      {
        email: 'neurologist@hospital.com',
        firstName: 'Alexander',
        lastName: 'Wright',
        specialization: 'Chief Neurosurgeon',
        deptCode: 'NEUR',
        fee: 90,
        room: 'Suite 405',
        exp: 18
      },
      {
        email: 'pediatrician@hospital.com',
        firstName: 'Elena',
        lastName: 'Rostova',
        specialization: 'Senior Pediatrician & Neonatologist',
        deptCode: 'PED',
        fee: 60,
        room: 'Suite 210',
        exp: 11
      },
      {
        email: 'orthopedic@hospital.com',
        firstName: 'David',
        lastName: 'Miller',
        specialization: 'Consultant Orthopedic Surgeon',
        deptCode: 'ORTH',
        fee: 70,
        room: 'Suite 115',
        exp: 15
      },
      {
        email: 'physician@hospital.com',
        firstName: 'Michael',
        lastName: 'Chang',
        specialization: 'Internal Medicine Specialist',
        deptCode: 'GEN',
        fee: 50,
        room: 'Suite 101',
        exp: 9
      }
    ];

    const additionalDoctors: any[] = [];
    for (const docData of otherDoctorsData) {
      const u = await User.create({
        email: docData.email,
        password: 'Password123!',
        role: UserRole.DOCTOR,
        phone: '+1 (555) 444-9999',
        isActive: true,
        isVerified: true
      });

      const d = await Doctor.create({
        user: u._id,
        doctorId: `DOC-${2000 + additionalDoctors.length + 2}`,
        firstName: docData.firstName,
        lastName: docData.lastName,
        specialization: docData.specialization,
        department: deptMap[docData.deptCode]._id,
        qualifications: ['MBBS', 'MD / MS'],
        experienceYears: docData.exp,
        consultationFee: docData.fee,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        roomNumber: docData.room,
        phone: '+1 (555) 444-9999',
        status: DoctorStatus.APPROVED,
        rating: 4.8,
        totalReviews: 32
      });

      u.doctorProfile = d._id;
      await u.save();
      additionalDoctors.push(d);
    }

    // 3. Demo Patient
    const patientUser = await User.create({
      email: 'patient@hospital.com',
      password: 'Password123!',
      role: UserRole.PATIENT,
      phone: '+1 (555) 888-9999',
      isActive: true,
      isVerified: true
    });

    const patientProfile = await Patient.create({
      user: patientUser._id,
      patientId: 'PAT-1001',
      firstName: 'Emily',
      lastName: 'Watson',
      dateOfBirth: new Date('1992-06-15'),
      gender: 'Female',
      bloodGroup: 'O+',
      phone: '+1 (555) 888-9999',
      address: {
        street: '124 Riverside Boulevard, Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10023',
        country: 'USA'
      },
      emergencyContact: {
        name: 'James Watson',
        relation: 'Spouse',
        phone: '+1 (555) 888-7777'
      },
      allergies: ['Penicillin', 'Peanuts'],
      existingConditions: ['Mild Asthma', 'Migraine'],
      previousSurgeries: ['Appendectomy (2018)'],
      familyHistory: ['Hypertension (Maternal)', 'Type 2 Diabetes (Paternal)'],
      insurance: {
        provider: 'BlueCross HealthShield',
        policyNumber: 'BCBS-9882103',
        expiryDate: new Date('2028-12-31')
      },
      assignedDoctor: doctorProfile._id
    });

    patientUser.patientProfile = patientProfile._id;
    await patientUser.save();

    // Additional Patients
    const otherPatientsData = [
      { firstName: 'Robert', lastName: 'Davis', gender: 'Male', blood: 'A+', dob: '1978-04-12', phone: '+1 555-101-0021' },
      { firstName: 'Sophia', lastName: 'Martinez', gender: 'Female', blood: 'B+', dob: '2001-09-28', phone: '+1 555-101-0022' },
      { firstName: 'William', lastName: 'Taylor', gender: 'Male', blood: 'AB+', dob: '1965-11-03', phone: '+1 555-101-0023' }
    ];

    const additionalPatients: any[] = [];
    for (let i = 0; i < otherPatientsData.length; i++) {
      const pData = otherPatientsData[i];
      const u = await User.create({
        email: `patient${i + 2}@hospital.com`,
        password: 'Password123!',
        role: UserRole.PATIENT,
        phone: pData.phone,
        isActive: true,
        isVerified: true
      });

      const p = await Patient.create({
        user: u._id,
        patientId: `PAT-${1002 + i}`,
        firstName: pData.firstName,
        lastName: pData.lastName,
        dateOfBirth: new Date(pData.dob),
        gender: pData.gender,
        bloodGroup: pData.blood,
        phone: pData.phone,
        emergencyContact: { name: 'Emergency Contact', relation: 'Family', phone: pData.phone },
        assignedDoctor: doctorProfile._id
      });

      u.patientProfile = p._id;
      await u.save();
      additionalPatients.push(p);
    }

    console.log('🌱 Seeding Staff...');
    const staffMembers = [
      { email: 'nurse@hospital.com', firstName: 'Hannah', lastName: 'Abbott', designation: StaffDesignation.NURSE, deptCode: 'ICU' },
      { email: 'pharmacist@hospital.com', firstName: 'Liam', lastName: 'Cooper', designation: StaffDesignation.PHARMACIST, deptCode: 'GEN' },
      { email: 'labtech@hospital.com', firstName: 'Grace', lastName: 'Hopper', designation: StaffDesignation.LAB_TECHNICIAN, deptCode: 'PATH' },
      { email: 'receptionist@hospital.com', firstName: 'Chloe', lastName: 'Bennett', designation: StaffDesignation.RECEPTIONIST, deptCode: 'GEN' }
    ];

    for (let i = 0; i < staffMembers.length; i++) {
      const s = staffMembers[i];
      const u = await User.create({
        email: s.email,
        password: 'Password123!',
        role: UserRole.STAFF,
        phone: '+1 (555) 777-6666',
        isActive: true,
        isVerified: true
      });

      const st = await Staff.create({
        user: u._id,
        employeeId: `STF-${1000 + i + 1}`,
        firstName: s.firstName,
        lastName: s.lastName,
        designation: s.designation,
        department: deptMap[s.deptCode]._id,
        phone: '+1 (555) 777-6666',
        joiningDate: new Date('2023-01-15'),
        status: 'Active'
      });

      u.staffProfile = st._id;
      await u.save();
    }

    console.log('🌱 Seeding Pharmacy Medications...');
    const medicinesData = [
      { name: 'Amoxicillin & Clavulanate', genericName: 'Augmentin', category: 'Antibiotics', manufacturer: 'GSK Pharma', batchNumber: 'AMX-2026-09', expiryDate: new Date('2028-06-30'), quantity: 450, minStockAlert: 50, purchasePrice: 8.5, sellingPrice: 16.0, unit: 'Tablets (10s)' },
      { name: 'Atorvastatin Calcium', genericName: 'Lipitor', category: 'Cardiovascular', manufacturer: 'Pfizer Inc', batchNumber: 'ATV-2026-01', expiryDate: new Date('2028-11-15'), quantity: 380, minStockAlert: 40, purchasePrice: 12.0, sellingPrice: 24.5, unit: 'Tablets (10s)' },
      { name: 'Metformin Hydrochloride', genericName: 'Glucophage', category: 'Antidiabetic', manufacturer: 'Merck Healthcare', batchNumber: 'MTF-2026-11', expiryDate: new Date('2027-12-01'), quantity: 620, minStockAlert: 50, purchasePrice: 4.2, sellingPrice: 9.0, unit: 'Tablets (10s)' },
      { name: 'Pantoprazole Sodium', genericName: 'Pantocid', category: 'Gastrointestinal', manufacturer: 'Sun Pharma', batchNumber: 'PNT-2026-04', expiryDate: new Date('2028-08-20'), quantity: 800, minStockAlert: 60, purchasePrice: 5.0, sellingPrice: 11.5, unit: 'Tablets (10s)' },
      { name: 'Paracetamol / Acetaminophen', genericName: 'Tylenol', category: 'Analgesics', manufacturer: 'Johnson & Johnson', batchNumber: 'PCM-2026-88', expiryDate: new Date('2029-01-10'), quantity: 1200, minStockAlert: 100, purchasePrice: 2.1, sellingPrice: 5.5, unit: 'Tablets (10s)' },
      { name: 'Azithromycin Dihydrate', genericName: 'Zithromax', category: 'Antibiotics', manufacturer: 'Cipla Ltd', batchNumber: 'AZT-2026-44', expiryDate: new Date('2027-10-15'), quantity: 240, minStockAlert: 30, purchasePrice: 9.8, sellingPrice: 21.0, unit: 'Tablets (6s)' },
      { name: 'Amlodipine Besylate', genericName: 'Norvasc', category: 'Cardiovascular', manufacturer: 'Pfizer Inc', batchNumber: 'AML-2026-19', expiryDate: new Date('2028-04-12'), quantity: 310, minStockAlert: 35, purchasePrice: 6.2, sellingPrice: 13.0, unit: 'Tablets (10s)' },
      { name: 'Salbutamol Inhaler 100mcg', genericName: 'Ventolin', category: 'Respiratory', manufacturer: 'GlaxoSmithKline', batchNumber: 'SLB-2026-02', expiryDate: new Date('2028-09-30'), quantity: 85, minStockAlert: 20, purchasePrice: 14.5, sellingPrice: 28.0, unit: 'Inhaler Canister' },
      { name: 'Ceftriaxone Injection 1g', genericName: 'Rocephin', category: 'Injectables', manufacturer: 'Roche Diagnostics', batchNumber: 'CFT-2026-77', expiryDate: new Date('2027-08-15'), quantity: 140, minStockAlert: 25, purchasePrice: 18.0, sellingPrice: 38.0, unit: 'Vial' },
      { name: 'Ondansetron Injection 4mg', genericName: 'Zofran', category: 'Antiemetic', manufacturer: 'Novartis', batchNumber: 'OND-2026-55', expiryDate: new Date('2028-03-25'), quantity: 190, minStockAlert: 30, purchasePrice: 4.5, sellingPrice: 12.0, unit: 'Ampoule' },
      { name: 'Insulin Glargine Pen 100IU', genericName: 'Lantus', category: 'Antidiabetic', manufacturer: 'Sanofi Aventis', batchNumber: 'INS-2026-90', expiryDate: new Date('2027-05-30'), quantity: 8, minStockAlert: 15, purchasePrice: 35.0, sellingPrice: 65.0, unit: 'Prefilled Pen' } // Low stock trigger demo
    ];

    const createdMedicines = await Medicine.insertMany(medicinesData);

    console.log('🌱 Seeding Laboratory Tests Catalog...');
    const labTestsData = [
      { name: 'Complete Blood Count (CBC) with Differential', code: 'CBC-01', category: 'Hematology', price: 35, normalRange: 'WBC: 4.5-11.0, Hb: 12-16 g/dL, Plt: 150-450k', units: 'cells/mcL', sampleType: 'Whole Blood', turnaroundHours: 4 },
      { name: 'Comprehensive Metabolic Panel (CMP-14)', code: 'CMP-14', category: 'Biochemistry', price: 55, normalRange: 'Glucose: 70-99, Na: 135-145, K: 3.5-5.0', units: 'mg/dL, mmol/L', sampleType: 'Serum', turnaroundHours: 6 },
      { name: 'Lipid Profile Full Panel', code: 'LIPID-01', category: 'Biochemistry', price: 45, normalRange: 'Total Chol < 200, LDL < 100, HDL > 50', units: 'mg/dL', sampleType: 'Serum', turnaroundHours: 6 },
      { name: 'Glycated Hemoglobin (HbA1c)', code: 'HBA1C-01', category: 'Biochemistry', price: 40, normalRange: 'Non-diabetic: < 5.7%, Pre-diabetic: 5.7-6.4%', units: '%', sampleType: 'Whole Blood', turnaroundHours: 4 },
      { name: 'Thyroid Stimulating Hormone (TSH)', code: 'TSH-01', category: 'Endocrinology', price: 50, normalRange: '0.40 - 4.50', units: 'mIU/L', sampleType: 'Serum', turnaroundHours: 8 },
      { name: 'High-Sensitivity Troponin I (Cardiac)', code: 'TROP-I', category: 'Cardiac Markers', price: 75, normalRange: '< 0.04 (Negative for Myocardial Infarction)', units: 'ng/mL', sampleType: 'Serum', turnaroundHours: 1 },
      { name: 'Digital Chest X-Ray (PA View)', code: 'CXR-PA', category: 'Radiology', price: 65, normalRange: 'Clear lung fields, normal cardiothoracic ratio', units: 'N/A', sampleType: 'Imaging', turnaroundHours: 2 }
    ];

    const createdLabTests = await LabTest.insertMany(labTestsData);

    console.log('🌱 Seeding Hospital Rooms and Beds...');
    const roomsData = [
      { roomNumber: '101', floor: 1, roomType: RoomType.GENERAL_WARD, totalBeds: 4, dailyRate: 60, departmentId: deptMap['GEN']._id, description: 'Medical ward for general observation and recovery.' },
      { roomNumber: '102', floor: 1, roomType: RoomType.GENERAL_WARD, totalBeds: 4, dailyRate: 60, departmentId: deptMap['GEN']._id, description: 'General step-down care ward.' },
      { roomNumber: '201', floor: 2, roomType: RoomType.SEMI_PRIVATE, totalBeds: 2, dailyRate: 120, departmentId: deptMap['CARD']._id, description: 'Twin sharing air-conditioned room with ensuite.' },
      { roomNumber: '301', floor: 3, roomType: RoomType.PRIVATE, totalBeds: 1, dailyRate: 250, departmentId: deptMap['CARD']._id, description: 'Deluxe private room with electric recliner bed, TV, and caregiver couch.' },
      { roomNumber: '401', floor: 4, roomType: RoomType.ICU, totalBeds: 4, dailyRate: 450, departmentId: deptMap['ICU']._id, description: 'Intensive Coronary Care Unit with high-tier hemodynamic ventilators.' }
    ];

    const createdRooms = [];
    const createdBeds = [];

    for (const rData of roomsData) {
      const room = await Room.create(rData);
      createdRooms.push(room);

      for (let i = 1; i <= rData.totalBeds; i++) {
        const bed = await Bed.create({
          bedNumber: `${rData.roomNumber}-${String.fromCharCode(64 + i)}`,
          room: room._id,
          bedType: rData.roomType === RoomType.ICU ? 'ICU' : 'Standard',
          status: BedStatus.AVAILABLE,
          dailyRate: rData.dailyRate
        });
        createdBeds.push(bed);
      }
    }

    console.log('🌱 Seeding Appointments...');
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const appointmentsData = [
      {
        appointmentNumber: 'APT-1001',
        patient: patientProfile._id,
        doctor: doctorProfile._id,
        department: deptMap['CARD']._id,
        appointmentDate: tomorrow,
        appointmentTime: '09:30 - 10:00',
        type: AppointmentType.IN_PERSON,
        reason: 'Post-cardiac stent routine checkup & blood pressure management',
        symptoms: ['Mild shortness of breath on exertion', 'Fatigue'],
        status: AppointmentStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        consultationFee: 75
      },
      {
        appointmentNumber: 'APT-1002',
        patient: additionalPatients[0]._id,
        doctor: doctorProfile._id,
        department: deptMap['CARD']._id,
        appointmentDate: dayAfter,
        appointmentTime: '10:30 - 11:00',
        type: AppointmentType.IN_PERSON,
        reason: 'Evaluation of persistent hypertension and palpitations',
        symptoms: ['Elevated systolic BP > 150', 'Headaches'],
        status: AppointmentStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        consultationFee: 75
      },
      {
        appointmentNumber: 'APT-1000',
        patient: patientProfile._id,
        doctor: doctorProfile._id,
        department: deptMap['CARD']._id,
        appointmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        appointmentTime: '11:00 - 11:30',
        type: AppointmentType.IN_PERSON,
        reason: 'Initial consultation and ECG review',
        symptoms: ['Chest tightness', 'Occasional dizzy spells'],
        status: AppointmentStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        consultationFee: 75
      }
    ];

    const createdAppointments = await Appointment.insertMany(appointmentsData);

    console.log('🌱 Seeding Electronic Medical Record & Prescriptions...');
    // Generate sample prescription PDF
    const prescriptionPdfUrl = await PdfService.generatePrescriptionPdf({
      prescriptionNumber: 'RX-8001',
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      doctorName: `${doctorProfile.firstName} ${doctorProfile.lastName}`,
      doctorSpecialization: doctorProfile.specialization,
      departmentName: deptMap['CARD'].name,
      patientName: `${patientProfile.firstName} ${patientProfile.lastName}`,
      patientId: patientProfile.patientId,
      patientAge: 32,
      patientGender: patientProfile.gender,
      diagnosis: 'Primary Essential Hypertension (Stage 1) with mild exertional dyspnea',
      medicines: [
        { name: 'Amlodipine Besylate', dosage: '5mg', frequency: '1-0-0 (Once Morning)', duration: '30 Days', instructions: 'Take with water after breakfast' },
        { name: 'Atorvastatin Calcium', dosage: '10mg', frequency: '0-0-1 (Once Night)', duration: '30 Days', instructions: 'Take before sleep' },
        { name: 'Paracetamol / Acetaminophen', dosage: '500mg', frequency: 'SOS (When Needed)', duration: '5 Days', instructions: 'Only in case of headache or fever' }
      ],
      notes: 'Restrict dietary sodium to < 2g per day. Maintain daily BP log. Follow up in 4 weeks or immediately if chest discomfort occurs.'
    });

    const prescription = await Prescription.create({
      prescriptionNumber: 'RX-8001',
      patient: patientProfile._id,
      doctor: doctorProfile._id,
      appointment: createdAppointments[2]._id,
      diagnosis: 'Primary Essential Hypertension (Stage 1)',
      medicines: [
        { name: 'Amlodipine Besylate', dosage: '5mg', frequency: '1-0-0 (Once Morning)', duration: '30 Days', instructions: 'Take with water after breakfast' },
        { name: 'Atorvastatin Calcium', dosage: '10mg', frequency: '0-0-1 (Once Night)', duration: '30 Days', instructions: 'Take before sleep' }
      ],
      notes: 'Restrict dietary sodium to < 2g per day. Maintain daily BP log.',
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      pdfUrl: prescriptionPdfUrl,
      dispensed: true,
      dispensedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    // Medical Record
    const medRecord = await MedicalRecord.create({
      recordNumber: 'EMR-3001',
      patient: patientProfile._id,
      doctor: doctorProfile._id,
      appointment: createdAppointments[2]._id,
      visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      symptoms: ['Chest tightness', 'Occasional dizzy spells', 'Elevated home BP readings'],
      diagnosis: 'Primary Essential Hypertension (Stage 1)',
      treatment: 'Started oral anti-hypertensive therapy (Amlodipine 5mg OD). Advised lifestyle modifications including DASH diet and 30 mins brisk walking daily.',
      clinicalNotes: 'Cardiovascular examination reveals normal S1/S2 heart sounds. No murmurs or carotid bruits audible. Lung fields clear bilaterally.',
      vitalSigns: {
        bpSystolic: 138,
        bpDiastolic: 88,
        heartRate: 76,
        temperature: 98.4,
        oxygenSaturation: 99,
        weight: 64,
        height: 168,
        bmi: 22.7
      },
      allergies: ['Penicillin', 'Peanuts'],
      existingConditions: ['Mild Asthma', 'Migraine'],
      prescriptions: [prescription._id]
    });

    console.log('🌱 Seeding Lab Reports & Invoices...');
    const labReportPdfUrl = await PdfService.generateLabReportPdf({
      reportNumber: 'REP-7001',
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      patientName: `${patientProfile.firstName} ${patientProfile.lastName}`,
      patientId: patientProfile.patientId,
      doctorName: `${doctorProfile.firstName} ${doctorProfile.lastName}`,
      sampleType: 'Serum / Whole Blood',
      results: [
        { testName: 'Total Cholesterol', result: '185', normalRange: '< 200', units: 'mg/dL', flag: 'Normal' },
        { testName: 'LDL Cholesterol', result: '112', normalRange: '< 100', units: 'mg/dL', flag: 'Abnormal', remarks: 'Borderline elevated' },
        { testName: 'HDL Cholesterol', result: '54', normalRange: '> 50', units: 'mg/dL', flag: 'Normal' },
        { testName: 'Triglycerides', result: '142', normalRange: '< 150', units: 'mg/dL', flag: 'Normal' },
        { testName: 'High-Sensitivity Troponin I', result: '0.01', normalRange: '< 0.04', units: 'ng/mL', flag: 'Normal' }
      ],
      technicianNotes: 'Samples checked for hemolysis. No interfering antibodies detected.'
    });

    const labRequest = await LabRequest.create({
      requestNumber: 'LR-5001',
      patient: patientProfile._id,
      doctor: doctorProfile._id,
      appointment: createdAppointments[2]._id,
      tests: [createdLabTests[2]._id, createdLabTests[5]._id], // Lipid Profile, Troponin
      status: 'Completed',
      priority: 'Routine',
      totalCost: 120,
      isPaid: true
    });

    const labReport = await LabReport.create({
      reportNumber: 'REP-7001',
      labRequest: labRequest._id,
      patient: patientProfile._id,
      doctor: doctorProfile._id,
      results: [
        { test: createdLabTests[2]._id, testName: 'Lipid Profile Panel', result: 'Cholesterol 185 mg/dL, LDL 112 mg/dL', normalRange: 'Desirable < 200', units: 'mg/dL', flag: 'Abnormal' },
        { test: createdLabTests[5]._id, testName: 'Cardiac Troponin I', result: '0.01', normalRange: '< 0.04', units: 'ng/mL', flag: 'Normal' }
      ],
      technicianNotes: 'Lipid panel processed on Abbott Architect c8000 analyzer.',
      pdfUrl: labReportPdfUrl,
      status: 'Final',
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    // Invoices
    const invoicePdfUrl = await PdfService.generateInvoicePdf({
      invoiceNumber: 'INV-4001',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      patientName: `${patientProfile.firstName} ${patientProfile.lastName}`,
      patientId: patientProfile.patientId,
      patientPhone: patientProfile.phone,
      paymentStatus: PaymentStatus.PAID,
      items: [
        { description: 'Cardiology Specialist Consultation - Dr. Sarah Chen', category: 'Consultation', quantity: 1, unitPrice: 75, amount: 75 },
        { description: 'Lipid Profile Full Panel Investigation', category: 'Laboratory', quantity: 1, unitPrice: 45, amount: 45 },
        { description: 'High-Sensitivity Cardiac Troponin I', category: 'Laboratory', quantity: 1, unitPrice: 75, amount: 75 }
      ],
      subtotal: 195,
      discount: 15,
      tax: 9.0,
      totalAmount: 189
    });

    const invoice1 = await Invoice.create({
      invoiceNumber: 'INV-4001',
      patient: patientProfile._id,
      appointment: createdAppointments[2]._id,
      items: [
        { description: 'Cardiology Specialist Consultation - Dr. Sarah Chen', category: 'Consultation', quantity: 1, unitPrice: 75, amount: 75 },
        { description: 'Diagnostic Pathology Panel', category: 'Laboratory', quantity: 1, unitPrice: 120, amount: 120 }
      ],
      subtotal: 195,
      discount: 15,
      tax: 9.0,
      totalAmount: 189,
      amountPaid: 189,
      paymentStatus: PaymentStatus.PAID,
      pdfUrl: invoicePdfUrl
    });

    await Payment.create({
      paymentNumber: 'PAY-9001',
      invoice: invoice1._id,
      patient: patientProfile._id,
      amount: 189,
      paymentMethod: PaymentMethod.CARD,
      transactionId: 'TXN-CARD-8921829',
      status: PaymentStatus.PAID,
      paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    // Unpaid invoice for upcoming visit
    await Invoice.create({
      invoiceNumber: 'INV-4002',
      patient: patientProfile._id,
      appointment: createdAppointments[0]._id,
      items: [
        { description: 'Follow-up Consultation - Dr. Sarah Chen', category: 'Consultation', quantity: 1, unitPrice: 75, amount: 75 }
      ],
      subtotal: 75,
      discount: 0,
      tax: 3.75,
      totalAmount: 78.75,
      amountPaid: 0,
      paymentStatus: PaymentStatus.PENDING,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });

    console.log('🌱 Seeding Emergency Triage Cases...');
    await EmergencyCase.create([
      {
        caseNumber: 'EMG-9001',
        patientName: 'Jonathan Davis',
        age: 58,
        gender: 'Male',
        contactPhone: '+1 (555) 777-1234',
        priority: EmergencyPriority.CRITICAL,
        symptoms: 'Acute substernal chest crushing pain radiating to left arm, diaphoretic, SpO2 91%',
        initialDiagnosis: 'Impending Acute Coronary Syndrome (STEMI)',
        triageNotes: 'Cath lab alerted. High flow O2 administered, chewed Aspirin 325mg and sublingual nitroglycerin given.',
        attendingDoctor: doctorProfile._id,
        department: deptMap['CARD']._id,
        status: 'Under Treatment'
      },
      {
        caseNumber: 'EMG-9002',
        patientName: 'Lucas Vance',
        age: 24,
        gender: 'Male',
        contactPhone: '+1 (555) 777-5678',
        priority: EmergencyPriority.HIGH,
        symptoms: 'Motorcycle collision injury, closed deformity on right distal femur, hemodynamically stable',
        initialDiagnosis: 'Right Femur Fracture, soft tissue contusion',
        triageNotes: 'Thomas splint applied. Analgesics administered. Urgent orthopedics consult called.',
        attendingDoctor: additionalDoctors[2]._id, // Dr. David Miller
        department: deptMap['ORTH']._id,
        status: 'Triaged'
      }
    ]);

    console.log('🌱 Seeding Inpatient Admission & Discharge...');
    // Occupy one bed for demo
    const admittedBed = createdBeds[2]; // Room 201-A
    admittedBed.status = BedStatus.OCCUPIED;
    admittedBed.currentPatient = additionalPatients[1]._id;
    await admittedBed.save();

    await Admission.create({
      admissionNumber: 'ADM-8001',
      patient: additionalPatients[1]._id,
      doctor: doctorProfile._id,
      department: deptMap['CARD']._id,
      room: admittedBed.room,
      bed: admittedBed._id,
      admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      admissionReason: 'Cardiogenic syncope evaluation and continuous telemetry monitoring',
      initialDiagnosis: 'Syncope of undetermined etiology / Bradyarrhythmia',
      emergencyContact: { name: 'Carlos Martinez', relation: 'Father', phone: '+1 555-909-0012' },
      status: 'Admitted'
    });

    console.log('🌱 Seeding Audit Logs & Notifications...');
    await AuditLog.create([
      { action: 'USER_LOGIN', module: 'AUTH', user: adminUser._id, userEmail: adminUser.email, userRole: 'ADMIN', ipAddress: '127.0.0.1' },
      { action: 'PATIENT_REGISTERED', module: 'PATIENTS', user: patientUser._id, userEmail: patientUser.email, userRole: 'PATIENT', ipAddress: '127.0.0.1' },
      { action: 'APPOINTMENT_BOOKED', module: 'APPOINTMENTS', user: patientUser._id, userEmail: patientUser.email, userRole: 'PATIENT', details: { appointmentNumber: 'APT-1001' } },
      { action: 'PRESCRIPTION_CREATED', module: 'PRESCRIPTIONS', user: doctorUser._id, userEmail: doctorUser.email, userRole: 'DOCTOR', details: { rxNumber: 'RX-8001' } }
    ]);

    await Notification.create([
      {
        recipient: patientUser._id,
        title: 'Appointment Confirmed',
        message: `Your upcoming appointment with Dr. Sarah Chen is scheduled tomorrow at 09:30 AM.`,
        type: 'APPOINTMENT',
        link: '/dashboard/patient/appointments',
        read: false
      },
      {
        recipient: patientUser._id,
        title: 'Prescription Available',
        message: 'Dr. Sarah Chen uploaded your verified digital prescription RX-8001.',
        type: 'PRESCRIPTION',
        link: '/dashboard/patient/prescriptions',
        read: true
      },
      {
        recipient: doctorUser._id,
        title: 'New Inpatient Assigned',
        message: 'Patient Sophia Martinez was admitted to Room 201-A under your cardiology care team.',
        type: 'SYSTEM',
        link: '/dashboard/doctor/patients',
        read: false
      }
    ]);

    console.log('========================================================================');
    console.log('🎉 HOSPITAL MANAGEMENT SYSTEM SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================================================');
    console.log('DEMO ACCOUNTS READY TO LOGIN:');
    console.log('  👨‍💼 Admin:   admin@hospital.com   / Password: Password123!');
    console.log('  🩺 Doctor:  doctor@hospital.com  / Password: Password123!');
    console.log('  👤 Patient: patient@hospital.com / Password: Password123!');
    console.log('========================================================================');

    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed with error:', error);
    process.exit(1);
  }
};

seedDatabase();
