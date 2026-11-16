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
- ✅ SQL injection protection: all queries are parameterized (`pg` bound params);
      dynamic column names resolve through own-property allowlists (`pickAllowed`)
- ✅ Schema validation with Joi (>= 17.13.8, which fixes `__proto__` promotion),
      plus an explicit `Object.setPrototypeOf` guard against prototype injection
- ✅ HTTP Parameter Pollution prevention (hpp, mounted AFTER the body parsers so
      request bodies are actually protected)
- ✅ Request body size limits (10MB max)
- ✅ Email validation on signup

### 4. Security Headers & Cross-Origin
- ✅ Helmet.js for secure HTTP headers (`nosniff`, frame options, no `X-Powered-By`)
- ✅ CORS configuration with origin restrictions
- ✅ CSRF Origin/Referer guard on all state-changing methods (required because
      production runs `COOKIE_SAMESITE=none`; CORS alone does not stop a
      cross-site "simple" POST from executing)
- ⚠️ Content Security Policy is currently DISABLED (`contentSecurityPolicy: false`
      in `app.js`) to accommodate file uploads. Re-enabling it with an explicit
      directive set is tracked in SECURITY_AUDIT.md.

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
- [ ] Restrict PostgreSQL network access and enforce TLS
- [ ] Use HTTPS only (no HTTP)
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins (no wildcards)
- [ ] Enable PostgreSQL encryption at rest
- [ ] Set up regular database backups
- [ ] Monitor rate limit violations
- [ ] Implement logging and alerting

### Gmail App Password Setup
1. Enable 2-Factor Authentication on Gmail
2. Go to: https://myaccount.google.com/apppasswords
3. Generate app-specific password
4. Use this in EMAIL_PASS (not your regular password)

## 📋 Audit History

A full security audit (OWASP Top 10 2021) is recorded in
[SECURITY_AUDIT.md](./SECURITY_AUDIT.md). Its findings are enforced as
executable regression tests in `Backend/tests/security/owasp.test.js` -- run
them with `npm test` before every release.

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

### Security Audit Remediation (Sep 2026)
- ✅ Fixed broken access control in `isCompany` (authorizes the caller, not `?id=`)
- ✅ Removed IDOR in company update and added offer ownership checks
- ✅ Authenticated the student directory and removed PII from listings
- ✅ Closed Joi `__proto__` prototype injection (17.13.8 + explicit guard)
- ✅ Added CSRF Origin guard; moved `hpp()` below the body parsers
- ✅ Stopped leaking driver error messages (110 handlers)
- ✅ Added 60 OWASP Top 10 regression tests

### Recent Security Improvements (Dec 2025)
- ✅ Added helmet.js for security headers
- ✅ Implemented rate limiting on all endpoints
- ✅ Fixed JWT expiration (was 114 years, now 24 hours)
- ✅ Added SQL injection protection (parameterized queries)
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
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**Last Updated:** September 20, 2026
