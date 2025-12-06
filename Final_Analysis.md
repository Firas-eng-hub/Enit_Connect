# Technical Architecture Analysis: TIC-Connect

## 1. Executive Summary
**Project Purpose:**
TIC-Connect is a full-stack web platform designed to connect students, companies, and administrators within ENIT (Ecole Nationale d'Ingénieurs de Tunis). It facilitates professional networking, internship/job offer management, and document sharing. The platform allows students to create profiles, search for companies, apply for offers, and manage their professional documents, while companies can post offers and view student profiles. Administrators oversee the ecosystem.

**Technology Stack:**

| Component | Technology | Version |
| :--- | :--- | :--- |
| **Frontend** | Angular | 10.1.4 |
| **UI Framework** | Bootstrap + Material | 4.5.2 |
| **Backend** | Node.js / Express | 4.17.1 |
| **Database** | MongoDB Atlas | Mongoose 5.12 |
| **Authentication** | JWT (JSON Web Tokens) | 8.5.1 |
| **Email Service** | Gmail SMTP | nodemailer |
| **Geocoding** | OpenStreetMap/Nominatim | Free |

**Repository:** https://github.com/Firas-eng-hub/Enit_Connect

---

## 2. Repository Structure

### Frontend (`Frontend/`)
```text
Frontend/
├── src/app/
│   ├── admin/           # Admin module (manage users, news, offers)
│   ├── company/         # Company module (profile, offers, candidacies)
│   ├── user/            # Student module (profile, documents, search)
│   ├── visitor/         # Public pages (landing, login, register)
│   ├── app.module.ts    # Root module
│   └── app.routing.ts   # Main routing
├── src/environments/    # Environment configs (apiUrl)
└── package.json
```

### Backend (`Backend/`)
```text
Backend/
├── config/
│   ├── db.config.js         # MongoDB connection
│   ├── auth.config.js       # JWT secret
│   ├── nodemailer.config.js # Gmail SMTP setup
│   └── geocoder.config.js   # OpenStreetMap geocoding
├── controllers/             # Business logic
├── models/                  # Mongoose schemas
├── routes/                  # API endpoints
├── middlewares/             # JWT verification
├── .env                     # Environment variables (gitignored)
├── .env.example             # Template for .env
└── server.js                # Entry point
```

---

## 3. Running Locally

### Prerequisites
- Node.js 18+ (with `--openssl-legacy-provider` for Angular 10)
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password (for email verification)

### Backend Setup
```bash
cd Backend
npm install

# Create .env file from template
cp .env.example .env
# Edit .env with your credentials

npm start
# Server runs on http://localhost:3000
```

### Frontend Setup
```bash
cd Frontend
npm install

# Start with legacy OpenSSL support (required for Node 18+)
export NODE_OPTIONS=--openssl-legacy-provider
ng serve
# App runs on http://localhost:4200
```

---

## 4. Environment Configuration

### Backend `.env` File
```env
# Server
PORT=3000
BASE_URL=http://localhost:3000

# JWT Secret (change in production!)
JWT_SECRET=your-secret-key

# MongoDB Atlas
DB_USER=your-db-user
DB_PASS=your-db-password
DB_HOST=your-cluster.mongodb.net
DB_DOMAIN=your-cluster.mongodb.net
DB_NAME=TIC-ENIT

# Gmail SMTP (for email verification)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Geocoder (optional - OpenStreetMap needs no key)
GEOCODER_API_KEY=
```

### How to Get Gmail App Password
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `EMAIL_PASS`

### Frontend Environment (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

---

## 5. API Endpoints

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/student/signup` | Register student |
| POST | `/student/login` | Student login |
| GET | `/student/confirm/:code` | Verify email |
| POST | `/company/signup` | Register company |
| POST | `/company/login` | Company login |
| POST | `/admin/login` | Admin login |

### Student Routes
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/student/all` | No | List all students |
| GET | `/student/:id` | JWT | Get student by ID |
| PATCH | `/student/:id` | JWT | Update profile |
| POST | `/student/upload/:id` | JWT | Upload profile picture |
| GET | `/student/search` | JWT | Search students |

### Offers
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/offers` | No | List all offers |
| POST | `/offers` | JWT | Create offer (company) |
| POST | `/student/apply/:offerId` | JWT | Apply to offer |

---

## 6. Database Schema

### Collections

| Collection | Fields | Description |
|------------|--------|-------------|
| `students` | firstname, lastname, email, password, status, confirmationCode, city, country, latitude, longitude | Student profiles |
| `companies` | name, email, password, description, logo, contact | Company profiles |
| `admins` | email, password, name | Admin accounts |
| `offers` | title, description, company, type, candidacies[] | Job/internship offers |
| `posts` | title, body, date, userName | Community posts |
| `documents` | title, type, link, emplacement, idcreator | User documents |

### Account Status Flow
```
Registration → status: "Pending"
Email Verification → status: "Active"
Manual Activation → node activateUsers.js
```

---

## 7. Key Features

### Email Verification (Gmail SMTP)
- Users receive confirmation email on registration
- Click link to verify: `/student/confirm/:confirmationCode`
- Status changes from "Pending" to "Active"

### Geocoding (OpenStreetMap)
- Converts user address to lat/lng coordinates
- Used for map visualization of students
- **Free, no API key required**

### Document Management
- Users can create folders and upload files
- Files stored locally in `uploads/` directory
- Metadata stored in MongoDB

### Search
- Fuzzy search using `string-similarity` library
- Search by name, email, or other fields

---

## 8. Manual Account Activation

If email verification fails, activate accounts manually:

```bash
cd Backend
node activateUsers.js
```

This script updates all "Pending" accounts to "Active".

---

## 9. VPS Deployment Guide

### Prerequisites
- Ubuntu 20.04+ VPS (Azure/DigitalOcean/AWS)
- Node.js 18+
- PM2 process manager
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)

### Deploy Backend
```bash
cd /var/www/tic-backend
npm install
# Configure .env with production values
pm2 start server.js --name "tic-backend"
pm2 save && pm2 startup
```

### Deploy Frontend
```bash
cd Frontend
export NODE_OPTIONS=--openssl-legacy-provider

# Update environment.prod.ts with production API URL
ng build --prod

# Copy to web server
cp -r dist/* /var/www/tic-frontend/
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/tic-frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 10. Security Notes

### ✅ Implemented
- Password hashing with bcrypt
- JWT authentication
- Environment variables for secrets
- `.env` file gitignored

### ⚠️ Recommendations for Production
- Change JWT secret to a strong random string
- Restrict CORS to specific domains
- Use HTTPS (SSL certificate)
- Regular dependency updates (`npm audit`)
- Move file storage to cloud (AWS S3/Cloudinary)

---

## 11. Recent Changes (December 2024)

### Completed Fixes
| Change | Status | Details |
|--------|--------|---------|
| Removed Heroku integration | ✅ | Scripts updated for local/VPS |
| Fixed API URLs | ✅ | All 23+ files now use `localhost:3000` |
| Gmail SMTP | ✅ | Email verification now works |
| OpenStreetMap geocoding | ✅ | Free geocoding, no API key needed |
| Environment variables | ✅ | All secrets in `.env` |
| Git repository | ✅ | Pushed to GitHub |
| Login/Register error messages | ✅ | Better user feedback |
| Account activation script | ✅ | `activateUsers.js` for manual activation |

### Files Modified
- `Backend/config/nodemailer.config.js` - Gmail SMTP
- `Backend/config/geocoder.config.js` - OpenStreetMap
- `Backend/.env.example` - Template with all configs
- `Frontend/src/environments/environment.ts` - Added apiUrl
- All service files - Updated API URLs

---

## 12. Utility Scripts

### Activate Pending Users
```bash
node Backend/activateUsers.js
```

### Create Admin Account
```javascript
// Backend/createAdmin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const dbConfig = require('./config/db.config');

mongoose.connect(`mongodb+srv://${dbConfig.user}:${dbConfig.pwd}@${dbConfig.domain}/${dbConfig.DB}`);

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('your-password', 10);
  await mongoose.connection.db.collection('admins').insertOne({
    email: 'admin@enit.tn',
    password: hashedPassword,
    name: 'Admin'
  });
  console.log('Admin created!');
  process.exit();
}

createAdmin();
```

---

## 13. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `ERR_OSSL_EVP_UNSUPPORTED` | Set `NODE_OPTIONS=--openssl-legacy-provider` |
| Email not sending | Check Gmail App Password in `.env` |
| Geocoding fails | Check internet connection (uses OpenStreetMap) |
| Login fails (Pending Account) | Run `node activateUsers.js` |
| CORS errors | Ensure backend is running on port 3000 |
| MongoDB connection fails | Verify credentials and IP whitelist in Atlas |

### Logs
- Backend logs: Console output from `npm start`
- Frontend logs: Browser developer console

---

## 14. Future Improvements

1. **Upgrade Angular** to v17+ (requires significant refactoring)
2. **Cloud file storage** (AWS S3, Cloudinary)
3. **Real-time notifications** (Socket.io)
4. **Better search** (MongoDB text indexes)
5. **Password reset** functionality
6. **Admin dashboard** enhancements

---

**Last Updated:** December 2024
**Repository:** https://github.com/Firas-eng-hub/Enit_Connect
