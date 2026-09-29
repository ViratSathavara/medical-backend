import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'MedPulse Hospital Management System API',
    version: '1.0.0',
    description: 'Enterprise REST API documentation for MedPulse Full-Stack Hospital Management System.',
    contact: {
      name: 'MedPulse Tech Engineering',
      email: 'api-support@medpulse.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token obtained from /api/auth/login'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new Patient or Doctor',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'phone'],
                properties: {
                  email: { type: 'string', example: 'patient@hospital.com' },
                  password: { type: 'string', example: 'Password123!' },
                  role: { type: 'string', enum: ['PATIENT', 'DOCTOR'], example: 'PATIENT' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  phone: { type: 'string', example: '+1-555-019-2834' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User successfully registered' },
          409: { description: 'User email already exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user & receive access/refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@hospital.com' },
                  password: { type: 'string', example: 'Password123!' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'Get filtered appointments list',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of appointments' }
        }
      },
      post: {
        tags: ['Appointments'],
        summary: 'Book new doctor appointment with auto double-booking prevention',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['doctorId', 'departmentId', 'appointmentDate', 'appointmentTime', 'reason'],
                properties: {
                  doctorId: { type: 'string' },
                  departmentId: { type: 'string' },
                  appointmentDate: { type: 'string', format: 'date' },
                  appointmentTime: { type: 'string', example: '09:00 - 09:30' },
                  reason: { type: 'string', example: 'Routine cardiovascular checkup' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Appointment confirmed' },
          409: { description: 'Slot collision / fully booked' }
        }
      }
    },
    '/departments': {
      get: {
        tags: ['Departments'],
        summary: 'Retrieve all medical departments with doctor counts',
        responses: {
          200: { description: 'List of departments' }
        }
      }
    },
    '/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'Search & filter approved hospital doctors',
        parameters: [
          { name: 'department', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of doctors' }
        }
      }
    },
    '/medical-records': {
      get: {
        tags: ['Electronic Medical Records'],
        summary: 'List authorized clinical health records',
        responses: {
          200: { description: 'Medical records retrieved' }
        }
      }
    },
    '/prescriptions': {
      get: {
        tags: ['Prescriptions'],
        summary: 'List prescriptions with downloadable PDF links',
        responses: {
          200: { description: 'Prescriptions retrieved' }
        }
      }
    },
    '/pharmacy/medicines': {
      get: {
        tags: ['Pharmacy'],
        summary: 'Get pharmaceutical inventory with batch and stock counts',
        responses: {
          200: { description: 'List of medicines' }
        }
      }
    },
    '/laboratory/reports': {
      get: {
        tags: ['Laboratory'],
        summary: 'List finalized diagnostic pathology reports',
        responses: {
          200: { description: 'List of lab reports' }
        }
      }
    },
    '/billing/invoices': {
      get: {
        tags: ['Billing & Invoicing'],
        summary: 'List invoices and payment balances',
        responses: {
          200: { description: 'List of invoices' }
        }
      }
    },
    '/facilities/rooms': {
      get: {
        tags: ['Rooms & Beds'],
        summary: 'Hospital ward & bed occupancy overview',
        responses: {
          200: { description: 'List of rooms & bed statuses' }
        }
      }
    },
    '/emergency': {
      get: {
        tags: ['Emergency & Triage'],
        summary: 'Emergency trauma priority queue',
        responses: {
          200: { description: 'Emergency cases' }
        }
      }
    },
    '/admin/analytics': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Comprehensive hospital metrics and Recharts time-series data',
        responses: {
          200: { description: 'Hospital dashboard metrics' }
        }
      }
    }
  }
};

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
