const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Local Application Database
connectDB();

// Initialize dedicated connection to Pragati Control Plane Database
require('./models/controlPlane');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pragati School Management API is running' });
});

// Routes that do not require global auth interception (they manage their own public/protected middleware)
app.use('/api/pragati', require('./routes/pragatiRoutes')); // WEBHOOK
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/school', require('./routes/schoolRoutes'));

// REAL-TIME TENANT VERIFICATION & AUTH MIDDLEWARE FOR ALL OTHER ROUTES
const { protect } = require('./middleware/auth');
const { PragatiTenant } = require('./models/PragatiDb');
const Store = require('./models/Store');
const User = require('./models/User');

app.use(async (req, res, next) => {
  // If request has Authorization token, use the live protect middleware
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : req.headers['x-auth-token'];

  if (token) {
    return protect(req, res, next);
  }

  // Fallback for header-based tenant/school access (e.g. x-tenant-slug or x-school-slug)
  const slug = (req.headers['x-tenant-slug'] || req.headers['x-school-slug'] || '').trim();
  if (slug) {
    try {
      // 1. Check schools stored in Users (school_ms)
      const schoolUser = await User.findOne({
        role: 'school',
        $or: [
          { slug: slug },
          { schoolSlug: slug },
          { uniqueId: slug }
        ]
      });

      // 2. Check local Store
      let localTenant = await Store.findOne({
        $or: [
          { slug: slug },
          { slug: new RegExp(`^${slug}$`, 'i') },
          { storeId: slug }
        ]
      });

      // 3. Check PragatiTenant (read-only license check)
      let pragatiTenant = await PragatiTenant.findOne({
        $or: [
          { slug: slug },
          { slug: new RegExp(`^${slug}$`, 'i') },
          ...(schoolUser ? [{ entity_id: schoolUser.entityId }] : [])
        ]
      }).catch(() => null);

      if (!schoolUser && !pragatiTenant && !localTenant) {
        return res.status(403).json({ error: 'Invalid school workspace', code: 'INVALID_TENANT' });
      }

      if ((pragatiTenant && pragatiTenant.status !== 'active') || (localTenant && localTenant.status !== 'active') || (schoolUser && schoolUser.status !== 'active')) {
        return res.status(403).json({
          error: 'Your account has been suspended or revoked.',
          code: 'TENANT_SUSPENDED'
        });
      }

      if (pragatiTenant && pragatiTenant.subscribed_products && Array.isArray(pragatiTenant.subscribed_products) && pragatiTenant.subscribed_products.length > 0) {
        const hasShms = pragatiTenant.subscribed_products.some(p => p.toLowerCase() === 'shms');
        if (!hasShms) {
          return res.status(403).json({
            error: 'This organization does not have an active School Management System (SHMS) license in Pragati.',
            code: 'NO_SHMS_LICENSE'
          });
        }
      }

      const effectiveTenant = schoolUser ? {
        slug: schoolUser.slug || slug,
        storeId: schoolUser.slug || slug,
        entityId: schoolUser.entityId,
        name: schoolUser.name || schoolUser.schoolName || slug,
        status: schoolUser.status || 'active'
      } : (localTenant || pragatiTenant);

      req.tenant = effectiveTenant;
      req.pragatiTenant = pragatiTenant;
      req.entityId = schoolUser?.entityId || pragatiTenant?.entity_id || localTenant?.entityId;
      req.school = schoolUser;
      req.schoolSlug = schoolUser?.slug || slug;
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Tenant check failed', message: err.message });
    }
  }

  // Non-authenticated request to protected route
  return res.status(401).json({
    error: 'Not authorized, no token provided',
    code: 'NO_TOKEN'
  });
});

// Protected Application Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/staff-attendance', require('./routes/staffAttendanceRoutes'));
app.use('/api/classes', require('./routes/classSectionRoutes'));
app.use('/api/academics', require('./routes/academicRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/library', require('./routes/libraryRoutes'));
app.use('/api/transport', require('./routes/transportRoutes'));
app.use('/api/communication', require('./routes/communicationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/lab', require('./routes/labRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/health`);
});
