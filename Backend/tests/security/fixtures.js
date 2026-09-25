/**
 * Shared fixtures and repository spies for the OWASP security suite.
 *
 * Kept in its own module so that jest.mock() factories (which may not close
 * over out-of-scope variables) can require it lazily.
 */

const bcrypt = require("bcrypt");

const IDS = {
  STUDENT_ID: "11111111-1111-4111-8111-111111111111",
  COMPANY_ID: "22222222-2222-4222-8222-222222222222",
  VICTIM_COMPANY_ID: "33333333-3333-4333-8333-333333333333",
  ADMIN_ID: "44444444-4444-4444-8444-444444444444",
  OFFER_ID: "55555555-5555-4555-8555-555555555555",
  VICTIM_OFFER_ID: "66666666-6666-4666-8666-666666666666",
  GHOST_ID: "99999999-9999-4999-8999-999999999999",
};

const PASSWORD = "CorrectHorse1!";
// Low cost factor: these are throwaway fixtures, not stored credentials.
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

const student = {
  id: IDS.STUDENT_ID,
  firstname: "Test",
  lastname: "Student",
  email: "student@example.com",
  status: "Active",
  type: "student",
  password: PASSWORD_HASH,
  work_at: null,
  class: "GL",
  promotion: "2025",
  linkedin: null,
  picture: null,
  aboutme: null,
  country: "Tunisia",
  city: "Tunis",
  address: "1 Rue Test",
  phone: "+21620000000",
  latitude: 36.8,
  longitude: 10.1,
};

const company = {
  id: IDS.COMPANY_ID,
  name: "Acme",
  email: "company@example.com",
  status: "Active",
  password: PASSWORD_HASH,
};

const victimCompany = {
  ...company,
  id: IDS.VICTIM_COMPANY_ID,
  name: "Victim Corp",
  email: "victim@example.com",
};

const ownOffer = { id: IDS.OFFER_ID, company_id: IDS.COMPANY_ID, title: "Own Offer" };
const victimOffer = {
  id: IDS.VICTIM_OFFER_ID,
  company_id: IDS.VICTIM_COMPANY_ID,
  title: "Victim Offer",
};

// Spies asserted on by the tests. Declared here so both the jest.mock factory
// and the test bodies reference the same function instances.
const spies = {
  updateCompany: jest.fn(async (id) => ({ ...victimCompany, id })),
  updateStudent: jest.fn(async () => student),
  updateOffer: jest.fn(async () => ownOffer),
  deleteOffer: jest.fn(async () => true),
  createPost: jest.fn(async () => ({ id: "post-1" })),
  searchByKey: jest.fn(async () => []),
  listAll: jest.fn(async () => [student]),
  listCandidacies: jest.fn(async () => []),
  listCandidaciesByOfferIds: jest.fn(async () => []),
  hasCandidacyForCompany: jest.fn(async () => false),
};

const buildRepositories = () => ({
  studentRepository: {
    findById: jest.fn(async (id) => (id === IDS.STUDENT_ID ? student : null)),
    findByEmail: jest.fn(async (email) => (email === student.email ? student : null)),
    listAll: spies.listAll,
    listIds: jest.fn(async () => [IDS.STUDENT_ID]),
    searchByKey: spies.searchByKey,
    updateStudent: spies.updateStudent,
    searchByFilters: jest.fn(async () => [student]),
  },
  companyRepository: {
    findById: jest.fn(async (id) => {
      if (id === IDS.COMPANY_ID) return company;
      if (id === IDS.VICTIM_COMPANY_ID) return victimCompany;
      return null;
    }),
    findByEmail: jest.fn(async (email) => (email === company.email ? company : null)),
    findByName: jest.fn(async () => null),
    listAll: jest.fn(async () => [company]),
    searchByKey: spies.searchByKey,
    updateCompany: spies.updateCompany,
  },
  adminRepository: {
    findById: jest.fn(async (id) => (id === IDS.ADMIN_ID ? { id: IDS.ADMIN_ID } : null)),
    listIds: jest.fn(async () => [IDS.ADMIN_ID]),
  },
  offerRepository: {
    findById: jest.fn(async (id) => {
      if (id === IDS.OFFER_ID) return ownOffer;
      if (id === IDS.VICTIM_OFFER_ID) return victimOffer;
      return null;
    }),
    updateOffer: spies.updateOffer,
    deleteOffer: spies.deleteOffer,
    listOffers: jest.fn(async () => []),
    listOffersByCompany: jest.fn(async (id) => {
      if (id === IDS.COMPANY_ID) return [ownOffer];
      if (id === IDS.VICTIM_COMPANY_ID) return [victimOffer];
      return [];
    }),
    listCandidacies: spies.listCandidacies,
    listCandidaciesByOfferIds: spies.listCandidaciesByOfferIds,
    hasCandidacyForCompany: spies.hasCandidacyForCompany,
    searchByKey: spies.searchByKey,
    mapOfferRow: (o, candidacies = []) => ({ ...o, candidacies }),
    mapCandidacyRow: (c) => c,
  },
  postRepository: {
    listAll: jest.fn(async () => []),
    createPost: spies.createPost,
    mapPostRow: (r) => r,
  },
  notificationRepository: {
    createMany: jest.fn(async () => []),
    createNotification: jest.fn(async () => ({})),
    listByRecipient: jest.fn(async () => []),
    countUnread: jest.fn(async () => 0),
  },
  refreshTokenRepository: {
    createToken: jest.fn(async () => "refresh-token-value"),
    findByToken: jest.fn(async () => null),
    deleteByToken: jest.fn(async () => true),
    deleteById: jest.fn(async () => true),
  },
  offerViewRepository: { recordView: jest.fn(async () => ({})) },
  documentRepository: { listByIds: jest.fn(async () => []) },
  documentAccessRepository: { listSharedDocumentsByUser: jest.fn(async () => []) },
  documentShareRepository: {},
  documentRequestRepository: {},
  documentVersionRepository: {},
  documentAuditRepository: { createLog: jest.fn(async () => ({})) },
  newsRepository: {},
  partnerRepository: {},
  messageRepository: {},
  mailRepository: {},
  statsRepository: {},
  matchingRepository: {},
  savedSearchRepository: {},
  companyStatsRepository: {},
});

module.exports = {
  IDS,
  PASSWORD,
  student,
  company,
  victimCompany,
  ownOffer,
  victimOffer,
  spies,
  buildRepositories,
};
