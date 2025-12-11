# Security Policy

## 🔒 Security Measures Implemented

### 1. Authentication & Authorization
- ✅ JWT tokens with 24-hour expiration
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Role-based access control (Student, Company, Admin)
- ✅ Token verification middleware on protected routes

### 2. Rate Limiting
- ✅ General API rate limit: 100 requests per 15 minutes per IP
- ✅ Authentication endpoints: 5 attempts per 15 minutes
- ✅ Admin authentication: 3 attempts per 15 minutes (stricter)

### 3. Input Validation & Sanitization
- ✅ MongoDB injection protection (express-mongo-sanitize)
- ✅ HTTP Parameter Pollution prevention (hpp)
- ✅ Request body size limits (10MB max)
- ✅ Email validation on signup

### 4. Security Headers
- ✅ Helmet.js for secure HTTP headers
- ✅ CORS configuration with origin restrictions
- ✅ Content Security Policy

### 5. Data Protection
- ✅ Environment variables for sensitive data
- ✅ .env files excluded from git (.gitignore)
- ✅ Passwords never stored in plain text

## 🚨 Security Best Practices

### Environment Variables
**CRITICAL:** Never commit `.env` files to git!

Generate strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Production Checklist
- [ ] Change all default credentials
- [ ] Use strong JWT_SECRET (64+ characters, random)
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS only (no HTTP)
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins (no wildcards)
- [ ] Enable MongoDB encryption at rest
- [ ] Set up regular database backups
- [ ] Monitor rate limit violations
- [ ] Implement logging and alerting

### Gmail App Password Setup
1. Enable 2-Factor Authentication on Gmail
2. Go to: https://myaccount.google.com/apppasswords
3. Generate app-specific password
4. Use this in EMAIL_PASS (not your regular password)

## 🔍 Vulnerability Reporting

If you discover a security vulnerability, please email:
**security@tic-enit.tn** (or repository owner)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Do NOT open public GitHub issues for security vulnerabilities.**

## 📋 Security Updates

### Recent Security Improvements (Dec 2025)
- ✅ Added helmet.js for security headers
- ✅ Implemented rate limiting on all endpoints
- ✅ Fixed JWT expiration (was 114 years, now 24 hours)
- ✅ Added MongoDB injection protection
- ✅ Centralized error handling
- ✅ Input sanitization middleware
- ✅ **Implemented refresh token mechanism** (7-day expiry)
- ✅ Added logout endpoint to invalidate tokens

### Known Limitations
- ⚠️ File uploads need additional validation
- ⚠️ Angular 10 is EOL (recommend upgrading to v17+)
- ⚠️ No input validation middleware (express-validator not implemented)

## 🔄 Recommended Updates

### High Priority
1. **Upgrade Dependencies:** Run `npm audit fix` regularly
2. **Update Angular:** Migrate from v10 to v17+ (security patches)
3. **Add Input Validation:** Implement express-validator on all POST/PATCH routes

### Medium Priority
1. **HTTPS Enforcement:** Force HTTPS in production
2. **File Upload Validation:** Validate file types, sizes, and scan for malware
3. **API Versioning:** Implement /api/v1/ for future compatibility
4. **Audit Logging:** Log all authentication attempts and admin actions

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

**Last Updated:** December 11, 2025
