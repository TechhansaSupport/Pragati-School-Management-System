# Backend - Pragati School Management System

## Setup
```bash
npm install
```

## Environment Variables
Create a `.env` file with:
```
MONGODB_URI=your_mongodb_uri
PORT=5000
JWT_SECRET=your_secret_key
```

## Run
```bash
# Development (with hot reload)
npm run dev

# Production
npm start

# Seed database with sample data
npm run seed
```

## API Endpoints

### Health
- `GET /api/health`

### Students
- `GET /api/students` — List (search, paginate)
- `GET /api/students/stats` — KPI stats
- `GET /api/students/:id` — Get one
- `POST /api/students` — Create
- `PUT /api/students/:id` — Update
- `DELETE /api/students/:id` — Delete

### Staff
- `GET /api/staff` — List (search, paginate)
- `GET /api/staff/stats` — KPI stats
- `GET /api/staff/teachers` — Teachers only
- `GET /api/staff/:id` — Get one
- `POST /api/staff` — Create
- `PUT /api/staff/:id` — Update
- `DELETE /api/staff/:id` — Delete

### Academics
- `GET /api/academics` — List (search, paginate)
- `GET /api/academics/stats` — KPI stats
- `GET /api/academics/:id` — Get one
- `POST /api/academics` — Create
- `PUT /api/academics/:id` — Update
- `DELETE /api/academics/:id` — Delete

### Finance
- `GET /api/finance/transactions` — List (search, paginate)
- `GET /api/finance/stats` — Financial KPIs
- `POST /api/finance/transactions` — Create
- `PUT /api/finance/transactions/:id` — Update
- `DELETE /api/finance/transactions/:id` — Delete

### Dashboard
- `GET /api/dashboard/overview` — School overview KPIs
- `GET /api/dashboard/pending-fees` — Pending fees table + stats
