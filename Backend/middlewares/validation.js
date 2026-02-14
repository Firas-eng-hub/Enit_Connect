// ============================================
// Request Validation Middleware using Joi
// ============================================

const Joi = require('joi');

// Custom error messages
const customMessages = {
  'string.base': '{#label} should be a type of text',
  'string.empty': '{#label} cannot be an empty field',
  'string.min': '{#label} should have a minimum length of {#limit}',
  'string.max': '{#label} should have a maximum length of {#limit}',
  'string.email': '{#label} must be a valid email',
  'string.pattern.base': '{#label} contains invalid characters',
  'number.base': '{#label} should be a type of number',
  'number.min': '{#label} should be greater than or equal to {#limit}',
  'number.max': '{#label} should be less than or equal to {#limit}',
  'any.required': '{#label} is a required field',
  'any.only': '{#label} must match {#valids}',
  'array.base': '{#label} should be an array',
  'array.min': '{#label} should have at least {#limit} items',
  'boolean.base': '{#label} should be a boolean',
  'date.base': '{#label} should be a valid date',
  'uuid.base': '{#label} should be a valid UUID',
};

// ============================================
// Common Validation Schemas
// ============================================

const uuidSchema = Joi.string().uuid().messages(customMessages);

const emailSchema = Joi.string().email().max(255).lowercase().trim().messages(customMessages);

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    ...customMessages,
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });

const nameSchema = Joi.string()
  .min(2)
  .max(100)
  .pattern(/^[a-zA-Z\s\-'']+$/)
  .trim()
  .messages({
    ...customMessages,
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
  });

const phoneSchema = Joi.string()
  .pattern(/^\+?[\d\s\-\(\)]{8,20}$/)
  .messages({
    ...customMessages,
    'string.pattern.base': 'Phone number must be between 8-20 digits and can include +, spaces, hyphens, and parentheses',
  });

const textSchema = (min = 1, max = 1000) =>
  Joi.string().min(min).max(max).trim().messages(customMessages);

// ============================================
// Auth Validation Schemas
// ============================================

const studentSignupSchema = Joi.object({
  firstname: nameSchema.required(),
  lastname: nameSchema.required(),
  email: emailSchema.required(),
  password: passwordSchema.required(),
  type: Joi.string().valid('Student', 'Alumni').required(),
  country: Joi.string().max(100).trim(),
  city: Joi.string().max(100).trim(),
  address: Joi.string().max(255).trim(),
  phone: phoneSchema,
  class: Joi.string().max(50).trim(),
  promotion: Joi.string().max(50).trim(),
  linkedin: Joi.string().uri().max(255),
  aboutme: Joi.string().max(2000).trim(),
}).messages(customMessages);

const companySignupSchema = Joi.object({
  name: Joi.string().min(2).max(150).trim().required(),
  email: emailSchema.required(),
  password: passwordSchema.required(),
  website: Joi.string().uri().max(255).required(),
  address: Joi.string().max(255).trim().required(),
  city: Joi.string().max(100).trim().required(),
  country: Joi.string().max(100).trim().required(),
  phone: phoneSchema.required(),
  about: Joi.string().max(2000).trim(),
}).messages(customMessages);

const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().required(),
}).messages(customMessages);

const authPreferencesSchema = Joi.object({
  emailNotifications: Joi.boolean(),
  pushNotifications: Joi.boolean(),
}).or('emailNotifications', 'pushNotifications').messages(customMessages);

const emailVerificationSchema = Joi.object({
  email: emailSchema.required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    ...customMessages,
    'string.pattern.base': 'Verification code must be 6 digits',
  }),
}).messages(customMessages);

const mailDirectRecipientSchema = Joi.object({
  id: uuidSchema.required(),
  type: Joi.string().valid('student', 'company', 'admin').required(),
}).messages(customMessages);

const mailBroadcastRecipientSchema = Joi.object({
  id: Joi.string().valid('all', 'all_students', 'all_companies').required(),
  type: Joi.string().valid('group').required(),
}).messages(customMessages);

const mailRecipientSchema = Joi.alternatives()
  .try(mailDirectRecipientSchema, mailBroadcastRecipientSchema)
  .required()
  .messages(customMessages);

const mailComposeSchema = Joi.object({
  subject: Joi.string().min(1).max(200).trim().required(),
  body: Joi.string().min(1).max(10000).trim().required(),
  recipients: Joi.array().items(mailRecipientSchema).min(1).max(50).required(),
}).messages(customMessages);

const mailDraftSchema = Joi.object({
  subject: Joi.string().max(200).trim().allow('').default(''),
  body: Joi.string().max(10000).trim().allow('').default(''),
  recipients: Joi.array().items(mailRecipientSchema).max(50).default([]),
}).messages(customMessages);

const mailFolderParamsSchema = Joi.object({
  folder: Joi.string().valid('inbox', 'sent', 'drafts').required(),
}).messages(customMessages);

const mailItemParamsSchema = Joi.object({
  itemId: uuidSchema.required(),
}).messages(customMessages);

const mailMessageParamsSchema = Joi.object({
  messageId: uuidSchema.required(),
}).messages(customMessages);

const mailFolderQuerySchema = Joi.object({
  q: Joi.string().max(200).trim().allow('').default(''),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  ownerId: uuidSchema,
  ownerType: Joi.string().valid('student', 'company', 'admin'),
}).with('ownerId', 'ownerType').with('ownerType', 'ownerId').messages(customMessages);

const mailPatchSchema = Joi.object({
  read: Joi.boolean(),
  starred: Joi.boolean(),
  folder: Joi.string().valid('inbox', 'sent', 'drafts'),
}).or('read', 'starred', 'folder').messages(customMessages);

const mailRecipientsQuerySchema = Joi.object({
  q: Joi.string().max(200).trim().allow('').default(''),
  type: Joi.string().valid('all', 'student', 'company', 'admin').default('all'),
  limit: Joi.number().integer().min(1).max(100).default(25),
}).messages(customMessages);

const mailLockSchema = Joi.object({
  userId: uuidSchema.required(),
  userType: Joi.string().valid('student', 'company', 'admin').required(),
  reason: Joi.string().max(500).allow('', null),
}).messages(customMessages);

// ============================================
// User Management Validation Schemas
// ============================================

const updateStudentSchema = Joi.object({
  firstname: nameSchema,
  lastname: nameSchema,
  country: Joi.string().max(100).trim(),
  city: Joi.string().max(100).trim(),
  address: Joi.string().max(255).trim(),
  phone: phoneSchema,
  class: Joi.string().max(50).trim(),
  promotion: Joi.string().max(50).trim(),
  linkedin: Joi.string().uri().max(255).allow(''),
  aboutme: Joi.string().max(2000).trim(),
  work_at: Joi.string().max(150).trim(),
}).messages(customMessages);

const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(150).trim(),
  website: Joi.string().uri().max(255),
  address: Joi.string().max(255).trim(),
  city: Joi.string().max(100).trim(),
  country: Joi.string().max(100).trim(),
  phone: phoneSchema,
  about: Joi.string().max(2000).trim(),
}).messages(customMessages);

// ============================================
// Offer Validation Schemas
// ============================================

const createOfferSchema = Joi.object({
  title: Joi.string().min(5).max(200).trim().required(),
  type: Joi.string().valid('Internship', 'Job', 'PFE', 'Summer Internship').required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')),
  content: Joi.string().min(10).max(10000).trim().required(),
}).messages(customMessages);

const updateOfferSchema = Joi.object({
  title: Joi.string().min(5).max(200).trim(),
  type: Joi.string().valid('Internship', 'Job', 'PFE', 'Summer Internship'),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso(),
  content: Joi.string().min(10).max(10000).trim(),
}).messages(customMessages);

// ============================================
// Document Validation Schemas
// ============================================

const createDocumentSchema = Joi.object({
  title: Joi.string().min(1).max(255).trim().required(),
  description: Joi.string().max(1000).trim(),
  category: Joi.string().max(100).trim(),
  tags: Joi.array().items(Joi.string().max(50).trim()).max(20),
  access_level: Joi.string().valid('private', 'shared', 'public').default('private'),
  emplacement: Joi.string().max(500).trim(),
}).messages(customMessages);

const updateDocumentSchema = Joi.object({
  title: Joi.string().min(1).max(255).trim(),
  description: Joi.string().max(1000).trim(),
  category: Joi.string().max(100).trim(),
  tags: Joi.array().items(Joi.string().max(50).trim()).max(20),
  access_level: Joi.string().valid('private', 'shared', 'public'),
  pinned: Joi.boolean(),
}).messages(customMessages);

// ============================================
// News Validation Schemas
// ============================================

const createNewsSchema = Joi.object({
  title: Joi.string().min(5).max(200).trim().required(),
  content: Joi.string().min(10).max(50000).trim().required(),
  status: Joi.string().valid('draft', 'published', 'archived').default('published'),
  audience: Joi.array().items(Joi.string().valid('students', 'companies', 'alumni', 'all')),
  category: Joi.string().max(100).trim(),
  tags: Joi.array().items(Joi.string().max(50).trim()).max(20),
}).messages(customMessages);

const createPartnerSchema = Joi.object({
  name: Joi.string().min(2).max(120).trim().required(),
  logoUrl: Joi.string()
    .trim()
    .max(2048)
    .pattern(/^(https?:\/\/\S+|\/uploads\/\S+)$/i)
    .required()
    .messages({
      ...customMessages,
      'string.pattern.base': 'Logo URL must be an http(s) URL or an /uploads path',
    }),
}).messages(customMessages);

// ============================================
// Search & Filter Validation Schemas
// ============================================

const searchSchema = Joi.object({
  query: Joi.string().min(1).max(200).trim().required(),
  filters: Joi.object({
    type: Joi.array().items(Joi.string()),
    status: Joi.array().items(Joi.string()),
    date_from: Joi.date().iso(),
    date_to: Joi.date().iso(),
  }),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
}).messages(customMessages);

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string().max(50).trim(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
}).messages(customMessages);

// ============================================
// UUID Parameter Validation
// ============================================

const uuidParamSchema = Joi.object({
  id: uuidSchema.required(),
}).messages(customMessages);

// ============================================
// Validation Middleware Factory
// ============================================

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = property === 'body' ? req.body : property === 'params' ? req.params : req.query;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
    }

    // Replace request data with validated/sanitized data
    if (property === 'body') {
      req.body = value;
    } else if (property === 'params') {
      req.params = value;
    } else {
      req.query = value;
    }

    next();
  };
};

// ============================================
// Sanitization Middleware
// ============================================

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
          .trim();
      }
    });
  }
  next();
};

// ============================================
// SQL Injection Check Middleware
// ============================================

const sqlInjectionCheck = (req, res, next) => {
  // More specific SQL injection pattern - looks for SQL keywords followed by suspicious patterns
  // but allows normal text that might contain these words
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b\s+(\*|FROM|INTO|TABLE|DATABASE|WHERE|AND|OR))/i;
  
  // Pattern for dangerous SQL operators
  const dangerousPattern = /(--|;|--|\/\*|\*\/)/;

  const checkValue = (value, path) => {
    if (typeof value === 'string') {
      // Skip checking passwords - they can contain special characters
      if (path.includes('password')) {
        return null;
      }
      
      // Check for actual SQL injection patterns (not just keywords)
      if (sqlPattern.test(value) || dangerousPattern.test(value)) {
        return {
          field: path,
          value: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
        };
      }
    }
    if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        const result = checkValue(value[key], `${path}.${key}`);
        if (result) return result;
      }
    }
    return null;
  };

  const suspicious = checkValue(req.body, 'body') || checkValue(req.query, 'query') || checkValue(req.params, 'params');

  if (suspicious) {
    console.warn(`[SECURITY] Potential SQL injection attempt detected:`, {
      ip: req.ip,
      field: suspicious.field,
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json({
      status: 'error',
      message: 'Invalid input detected',
    });
  }

  next();
};

// ============================================
// XSS Prevention Middleware
// ============================================

const xssPrevention = (req, res, next) => {
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(xssPattern, '');
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const key of Object.keys(value)) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

// ============================================
// Export All Validators
// ============================================

module.exports = {
  // Validation middleware
  validate,
  sanitizeInput,
  sqlInjectionCheck,
  xssPrevention,

  // Schemas
  schemas: {
    // Auth
    studentSignup: studentSignupSchema,
    companySignup: companySignupSchema,
    login: loginSchema,
    authPreferences: authPreferencesSchema,
    emailVerification: emailVerificationSchema,

    // User management
    updateStudent: updateStudentSchema,
    updateCompany: updateCompanySchema,

    // Offers
    createOffer: createOfferSchema,
    updateOffer: updateOfferSchema,

    // Documents
    createDocument: createDocumentSchema,
    updateDocument: updateDocumentSchema,

    // News
    createNews: createNewsSchema,
    createPartner: createPartnerSchema,

    // Search & Pagination
    search: searchSchema,
    pagination: paginationSchema,
    uuidParam: uuidParamSchema,
    mailFolderParams: mailFolderParamsSchema,
    mailItemParams: mailItemParamsSchema,
    mailMessageParams: mailMessageParamsSchema,
    mailFolderQuery: mailFolderQuerySchema,
    mailRecipientsQuery: mailRecipientsQuerySchema,
    mailCompose: mailComposeSchema,
    mailDraft: mailDraftSchema,
    mailPatch: mailPatchSchema,
    mailLock: mailLockSchema,

    // Common
    uuid: uuidSchema,
    email: emailSchema,
    password: passwordSchema,
  },
};
