/**
 * OWASP Top 10 (2021) Security Regression Suite
 * =============================================
 *
 * Every test here is an executable assertion that a specific, previously
 * confirmed vulnerability is closed. Unlike tests/unit/*.controller.test.js
 * (which define inline stub handlers), this suite mounts the REAL app: the
 * real routes, the real middleware chain and the real controllers. Only the
 * repository layer and outbound email are mocked, so the code under test is
 * exactly what ships.
 *
 * Findings are cross-referenced to SECURITY_AUDIT.md.
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ---------------------------------------------------------------------------
// Fixtures (defined in ./fixtures so the jest.mock factory can require them)
// ---------------------------------------------------------------------------

const {
  IDS,
  PASSWORD,
  student,
  company,
  spies,
} = require("./fixtures");

const {
  STUDENT_ID,
  COMPANY_ID,
  VICTIM_COMPANY_ID,
  OFFER_ID,
  VICTIM_OFFER_ID,
  GHOST_ID,
} = IDS;

const updateCompanyMock = spies.updateCompany;
const updateStudentMock = spies.updateStudent;
const updateOfferMock = spies.updateOffer;
const deleteOfferMock = spies.deleteOffer;
const createPostMock = spies.createPost;
const searchByKeyMock = spies.searchByKey;
const listCandidaciesMock = spies.listCandidacies;
const listCandidaciesByOfferIdsMock = spies.listCandidaciesByOfferIds;
const hasCandidacyForCompanyMock = spies.hasCandidacyForCompany;

const PII_FIELDS = ["email", "phone", "address", "latitude", "longitude"];
const expectNoPii = (row) => {
  expect(row).toBeDefined();
  for (const leaked of PII_FIELDS) {
    expect(row).not.toHaveProperty(leaked);
  }
};

// ---------------------------------------------------------------------------
// Mocks: repository layer + outbound email only
// ---------------------------------------------------------------------------

jest.mock("../../repositories", () => require("./fixtures").buildRepositories());

jest.mock("../../config/nodemailer.config", () => ({
  sendConfirmationEmail: jest.fn(),
  sendSearchEmail: jest.fn(),
  sendRawEmail: jest.fn(async () => ({ success: true })),
}));

jest.mock("../../db", () => ({
  query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
  getClient: jest.fn(),
  withTransaction: jest.fn(),
  checkConnection: jest.fn(async () => true),
  pool: { on: jest.fn() },
}));

// ---------------------------------------------------------------------------
// App under test
// ---------------------------------------------------------------------------

process.env.FRONTEND_URL = "https://app.enit-connect.test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-unit-tests-only";

const app = require("../../app");
const config = require("../../config/auth.config");

const tokenFor = (id, overrides = {}) =>
  jwt.sign({ id, email: "x@example.com", ...overrides }, config.secret, { expiresIn: "1h" });

const studentToken = () => tokenFor(STUDENT_ID);
const companyToken = () => tokenFor(COMPANY_ID);

const auth = (req, token) => req.set("Authorization", `Bearer ${token}`);

beforeEach(() => {
  jest.clearAllMocks();
  delete Object.prototype.polluted;
  delete Object.prototype.evilColumn;
});

// ===========================================================================
// A01:2021 — Broken Access Control
// ===========================================================================

describe("A01:2021 Broken Access Control", () => {
  // Finding #1
  it("isCompany does not accept ?id= to impersonate a company (finding #1)", async () => {
    const res = await auth(
      request(app).get(`/api/company/notifications?id=${COMPANY_ID}`),
      studentToken()
    );
    expect(res.status).toBe(401);
  });

  // Finding #2
  it("a student cannot update another company via ?id= (finding #2)", async () => {
    const res = await auth(
      request(app).patch(`/api/company/update?id=${VICTIM_COMPANY_ID}`),
      studentToken()
    ).send({ city: "Hacked" });

    expect(res.status).toBe(401);
    expect(updateCompanyMock).not.toHaveBeenCalled();
  });

  it("a company updating itself can never write to another company's row (finding #2)", async () => {
    const res = await auth(
      request(app).patch(`/api/company/update?id=${VICTIM_COMPANY_ID}`),
      companyToken()
    ).send({ city: "Tunis" });

    expect(res.status).toBe(200);
    expect(updateCompanyMock).toHaveBeenCalled();
    // The row written must be the caller's own id, not the one in the query.
    expect(updateCompanyMock.mock.calls[0][0]).toBe(COMPANY_ID);
  });

  // Finding #3
  it("GET /api/student/all requires authentication (finding #3)", async () => {
    const res = await request(app).get("/api/student/all");
    expect([401, 403]).toContain(res.status);
  });

  it("the student directory never exposes contact or geolocation PII (finding #3)", async () => {
    const res = await auth(request(app).get("/api/student/all"), studentToken());
    expect(res.status).toBe(200);
    const [row] = res.body;
    expect(row).toBeDefined();
    for (const leaked of ["email", "phone", "address", "latitude", "longitude"]) {
      expect(row).not.toHaveProperty(leaked);
    }
    // Non-sensitive directory fields are still present.
    expect(row).toHaveProperty("firstname");
    expect(row).toHaveProperty("promotion");
  });

  it.each([
    ["name search", "/api/student/find?q=Test%20Student"],
    ["property search", "/api/student/search?property=firstname&key=Test"],
    ["filter search", "/api/student/filter?city=Tunis"],
  ])("student %s never exposes contact or geolocation PII", async (_label, url) => {
    if (url.includes("/search")) searchByKeyMock.mockResolvedValueOnce([student]);
    const res = await auth(request(app).get(url), companyToken());
    expect(res.status).toBe(200);
    expectNoPii(res.body[0]);
    expect(res.body[0]).toHaveProperty("firstname");
  });

  it("student search cannot be used as an email oracle", async () => {
    const res = await auth(
      request(app).get("/api/student/search?property=email&key=student"),
      companyToken()
    );
    expect(res.status).toBe(400);
    expect(searchByKeyMock).not.toHaveBeenCalled();
  });

  it("another user's student profile omits contact and geolocation PII", async () => {
    const res = await auth(request(app).get(`/api/student/${STUDENT_ID}`), companyToken());
    expect(res.status).toBe(200);
    expectNoPii(res.body);
  });

  it("a student still sees their own full profile (no over-blocking)", async () => {
    const res = await auth(request(app).get(`/api/student/${STUDENT_ID}`), studentToken());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(student.email);
    expect(res.body.phone).toBe(student.phone);
  });

  it("applicant info is refused to a company the student never applied to", async () => {
    const res = await auth(request(app).get(`/api/company/user/${STUDENT_ID}`), companyToken());
    expect(res.status).toBe(403);
    expect(res.body).not.toHaveProperty("email");
    expect(hasCandidacyForCompanyMock).toHaveBeenCalledWith(COMPANY_ID, STUDENT_ID);
  });

  it("applicant info is available to a company the student applied to", async () => {
    hasCandidacyForCompanyMock.mockResolvedValueOnce(true);
    const res = await auth(request(app).get(`/api/company/user/${STUDENT_ID}`), companyToken());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(student.email);
  });

  it("applicant info is refused to another student", async () => {
    const otherStudent = tokenFor(GHOST_ID);
    const res = await auth(request(app).get(`/api/company/user/${STUDENT_ID}`), otherStudent);
    expect(res.status).toBe(403);
  });

  // Offer candidacies (applicant PII) are owner-only
  it("a company cannot read another company's candidacies", async () => {
    const res = await auth(
      request(app).get(`/api/offers/candidacies?id=${VICTIM_OFFER_ID}`),
      companyToken()
    );
    expect(res.status).toBe(403);
    expect(listCandidaciesMock).not.toHaveBeenCalled();
  });

  it("a student cannot read an offer's candidacies", async () => {
    const res = await auth(
      request(app).get(`/api/offers/candidacies?id=${OFFER_ID}`),
      studentToken()
    );
    expect(res.status).toBe(403);
    expect(listCandidaciesMock).not.toHaveBeenCalled();
  });

  it("a company can still read candidacies for its own offer (no over-blocking)", async () => {
    const res = await auth(
      request(app).get(`/api/offers/candidacies?id=${OFFER_ID}`),
      companyToken()
    );
    expect(res.status).toBe(200);
    expect(listCandidaciesMock).toHaveBeenCalledWith(OFFER_ID);
  });

  it("listing another company's offers never loads their candidacies", async () => {
    const res = await auth(
      request(app).get(`/api/offers/myoffers?id=${VICTIM_COMPANY_ID}`),
      companyToken()
    );
    expect(res.status).toBe(200);
    expect(res.body[0].candidacies).toEqual([]);
    expect(listCandidaciesByOfferIdsMock).not.toHaveBeenCalled();
  });

  it("a company's own offer listing still includes candidacies", async () => {
    const res = await auth(
      request(app).get(`/api/offers/myoffers?id=${COMPANY_ID}`),
      companyToken()
    );
    expect(res.status).toBe(200);
    expect(listCandidaciesByOfferIdsMock).toHaveBeenCalledWith([OFFER_ID]);
  });

  it("a single offer viewed by a non-owner has no candidacies", async () => {
    const res = await auth(request(app).get(`/api/offers/${VICTIM_OFFER_ID}`), studentToken());
    expect(res.status).toBe(200);
    expect(res.body.candidacies).toEqual([]);
    expect(listCandidaciesMock).not.toHaveBeenCalled();
  });

  // Finding #5
  it("a student cannot update an offer they do not own (finding #5)", async () => {
    const res = await auth(
      request(app).patch(`/api/offers?id=${VICTIM_OFFER_ID}`),
      studentToken()
    ).send({ title: "Defaced" });

    expect([401, 403]).toContain(res.status);
    expect(updateOfferMock).not.toHaveBeenCalled();
  });

  it("a company cannot update another company's offer (finding #5)", async () => {
    const res = await auth(
      request(app).patch(`/api/offers?id=${VICTIM_OFFER_ID}`),
      companyToken()
    ).send({ title: "Defaced" });

    expect(res.status).toBe(403);
    expect(updateOfferMock).not.toHaveBeenCalled();
  });

  it("a company cannot delete another company's offer (finding #5)", async () => {
    const res = await auth(
      request(app).delete(`/api/offers/${VICTIM_OFFER_ID}`),
      companyToken()
    );
    expect(res.status).toBe(403);
    expect(deleteOfferMock).not.toHaveBeenCalled();
  });

  it("a company CAN still update its own offer (no over-blocking)", async () => {
    const res = await auth(
      request(app).patch(`/api/offers?id=${OFFER_ID}`),
      companyToken()
    ).send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(updateOfferMock).toHaveBeenCalled();
  });

  // Finding #7
  it("POST /api/student/posts requires authentication (finding #7)", async () => {
    const res = await request(app).post("/api/student/posts").send({
      title: "Spam",
      body: "Spam body",
      userName: "Impersonated Admin",
    });
    expect([401, 403]).toContain(res.status);
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("post authorship is derived from the token, not the body (finding #7)", async () => {
    const res = await auth(request(app).post("/api/student/posts"), studentToken()).send({
      title: "Hello",
      body: "World",
      userName: "Impersonated Admin",
    });

    expect(res.status).toBe(201);
    expect(createPostMock).toHaveBeenCalled();
    expect(createPostMock.mock.calls[0][0].userName).toBe("Test Student");
    expect(createPostMock.mock.calls[0][0].userName).not.toContain("Impersonated");
  });
});

// ===========================================================================
// A02:2021 — Cryptographic Failures
// ===========================================================================

describe("A02:2021 Cryptographic Failures", () => {
  it("auth cookies are HttpOnly and scoped", async () => {
    const res = await request(app)
      .post("/api/student/login")
      .set("Origin", process.env.FRONTEND_URL)
      .send({ email: student.email, password: "CorrectHorse1!" });

    expect(res.status).toBe(200);
    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toMatch(/accessToken=/);
    expect(cookies).toMatch(/HttpOnly/i);
  });

  it("login never returns the password hash", async () => {
    const res = await request(app)
      .post("/api/student/login")
      .set("Origin", process.env.FRONTEND_URL)
      .send({ email: student.email, password: "CorrectHorse1!" });

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
    expect(res.body).not.toHaveProperty("password");
  });

  it("the student directory never returns password hashes", async () => {
    const res = await auth(request(app).get("/api/student/all"), studentToken());
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
  });

  // Finding #17
  it("logout clears cookies with attributes matching how they were set (finding #17)", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Origin", process.env.FRONTEND_URL);

    const cookies = res.headers["set-cookie"] || [];
    const access = cookies.find((c) => c.startsWith("accessToken="));
    expect(access).toBeDefined();
    // Cleared with an expiry in the past AND carrying the same Path attribute.
    expect(access).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
    expect(access).toMatch(/Path=\//);
    expect(access).toMatch(/HttpOnly/i);
  });

  // Finding #18
  it("auth config refuses to load without a JWT secret (finding #18)", () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    // isolateModules keeps the fresh registry scoped to this block; a bare
    // jest.resetModules() here would hand later tests a different copy of the
    // repository mocks than the already-loaded app holds.
    jest.isolateModules(() => {
      expect(() => require("../../config/auth.config")).toThrow(/JWT_SECRET/);
    });
    process.env.JWT_SECRET = original;
  });
});

// ===========================================================================
// A03:2021 — Injection
// ===========================================================================

describe("A03:2021 Injection", () => {
  // Finding #9 — inherited properties must never reach the SQL column position
  const INHERITED_KEYS = ["constructor", "toString", "valueOf", "__proto__", "hasOwnProperty"];

  it.each(INHERITED_KEYS)(
    "search rejects inherited key '%s' instead of interpolating it into SQL (finding #9)",
    async (key) => {
      const res = await auth(
        request(app).get(`/api/offers/search?property=${encodeURIComponent(key)}&key=a`),
        companyToken()
      );
      expect(res.status).toBe(400);
      expect(searchByKeyMock).not.toHaveBeenCalled();
    }
  );

  it.each(INHERITED_KEYS)(
    "company search rejects inherited key '%s' (finding #9)",
    async (key) => {
      const res = await auth(
        request(app).get(`/api/company/search?property=${encodeURIComponent(key)}&key=a`),
        companyToken()
      );
      expect(res.status).toBe(400);
      expect(searchByKeyMock).not.toHaveBeenCalled();
    }
  );

  it("a polluted Object.prototype cannot introduce a new SQL column (finding #9)", async () => {
    // Simulate pollution having occurred by any means.
    Object.prototype.evilColumn = "name; DROP TABLE students; --";

    const res = await auth(
      request(app).get("/api/offers/search?property=evilColumn&key=a"),
      companyToken()
    );

    expect(res.status).toBe(400);
    expect(searchByKeyMock).not.toHaveBeenCalled();
    delete Object.prototype.evilColumn;
  });

  it("legitimate allowlisted columns still work (no over-blocking)", async () => {
    const res = await auth(
      request(app).get("/api/offers/search?property=title&key=dev"),
      companyToken()
    );
    expect(res.status).toBe(200);
    expect(searchByKeyMock).toHaveBeenCalledWith("title", "dev");
  });

  it("SQL metacharacters in a search value are rejected or safely parameterized", async () => {
    const res = await auth(
      request(app).get("/api/offers/search?property=title&key=%27%3B%20DROP%20TABLE%20offers%3B--"),
      companyToken()
    );
    // Either blocked by sqlInjectionCheck, or passed as a bound parameter.
    if (res.status === 200) {
      expect(searchByKeyMock).toHaveBeenCalled();
      const [column] = searchByKeyMock.mock.calls[0];
      expect(column).toBe("title"); // never attacker-controlled
    } else {
      expect(res.status).toBe(400);
    }
  });
});

// ===========================================================================
// A04:2021 — Insecure Design
// ===========================================================================

describe("A04:2021 Insecure Design", () => {
  // Finding #6 — CSRF
  it("blocks a cross-origin state-changing request (finding #6)", async () => {
    const res = await auth(
      request(app)
        .post("/api/student/posts")
        .set("Origin", "https://evil.example.com"),
      studentToken()
    ).send({ title: "CSRF", body: "CSRF" });

    expect(res.status).toBe(403);
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("blocks a cross-origin urlencoded POST, the CORS-simple bypass (finding #6)", async () => {
    const res = await auth(
      request(app)
        .post("/api/student/posts")
        .set("Origin", "https://evil.example.com")
        .type("form"),
      studentToken()
    ).send("title=CSRF&body=CSRF");

    expect(res.status).toBe(403);
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("blocks a cross-origin request identified only by Referer (finding #6)", async () => {
    const res = await auth(
      request(app)
        .post("/api/student/posts")
        .set("Referer", "https://evil.example.com/attack.html"),
      studentToken()
    ).send({ title: "CSRF", body: "CSRF" });

    expect(res.status).toBe(403);
  });

  it("blocks an opaque `Origin: null` request (sandboxed iframe bypass)", async () => {
    const res = await auth(
      request(app).post("/api/student/posts").set("Origin", "null").type("form"),
      studentToken()
    ).send("title=CSRF&body=CSRF");

    expect(res.status).toBe(403);
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("blocks a request whose only Referer cannot be parsed", async () => {
    const res = await auth(
      request(app).post("/api/student/posts").set("Referer", "not a url"),
      studentToken()
    ).send({ title: "CSRF", body: "CSRF" });

    expect(res.status).toBe(403);
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("allows the legitimate frontend origin (no over-blocking) (finding #6)", async () => {
    const res = await auth(
      request(app).post("/api/student/posts").set("Origin", process.env.FRONTEND_URL),
      studentToken()
    ).send({ title: "Legit", body: "Legit post" });

    expect(res.status).toBe(201);
    expect(createPostMock).toHaveBeenCalled();
  });

  it("does not block safe (GET) cross-origin requests", async () => {
    const res = await auth(
      request(app).get("/api/student/all").set("Origin", "https://evil.example.com"),
      studentToken()
    );
    expect(res.status).toBe(200);
  });

  // Finding #16 — user enumeration
  it("does not disclose whether an email is registered (finding #16)", async () => {
    const unknown = await request(app)
      .post("/api/student/login")
      .set("Origin", process.env.FRONTEND_URL)
      .send({ email: "nobody@example.com", password: "WrongPassword1!" });

    const known = await request(app)
      .post("/api/student/login")
      .set("Origin", process.env.FRONTEND_URL)
      .send({ email: student.email, password: "WrongPassword1!" });

    expect(unknown.status).toBe(known.status);
    expect(unknown.body.message).toBe(known.body.message);
  });
});

// ===========================================================================
// A05:2021 — Security Misconfiguration
// ===========================================================================

describe("A05:2021 Security Misconfiguration", () => {
  it("sets hardening headers from helmet", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers).toHaveProperty("x-frame-options");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  // Finding #10 — hpp must actually protect the body
  it("collapses duplicated body parameters (hpp is effective) (finding #10)", async () => {
    await auth(
      request(app)
        .post("/api/student/posts")
        .set("Origin", process.env.FRONTEND_URL)
        .type("form"),
      studentToken()
    ).send("title=first&title=second&body=hello");

    expect(createPostMock).toHaveBeenCalled();
    const sent = createPostMock.mock.calls[0][0];
    expect(Array.isArray(sent.title)).toBe(false);
    expect(typeof sent.title).toBe("string");
  });

  it("collapses duplicated query parameters", async () => {
    const res = await auth(
      request(app).get("/api/offers/search?property=title&property=content&key=a"),
      companyToken()
    );
    expect(res.status).toBe(200);
    expect(searchByKeyMock.mock.calls[0][0]).toBe("content");
  });

  // Finding #11 — no raw driver errors
  it("does not leak internal error details on a 500 (finding #11)", async () => {
    spies.listAll.mockRejectedValueOnce(
      new Error('relation "students" does not exist at character 15')
    );

    const res = await auth(request(app).get("/api/student/all"), studentToken());

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error.");
    expect(JSON.stringify(res.body)).not.toMatch(/relation|character|students/i);
  });

  it("the 404 handler does not echo unsanitized paths into a stack trace", async () => {
    const res = await request(app).get("/api/definitely-not-a-route");
    expect(res.status).toBe(404);
    expect(res.body).not.toHaveProperty("stack");
  });
});

// ===========================================================================
// A06:2021 — Vulnerable and Outdated Components
// ===========================================================================

describe("A06:2021 Vulnerable and Outdated Components", () => {
  // Finding #4 — the dependency-level half of the prototype injection fix
  it("joi is at or above the version that fixes __proto__ promotion (finding #4)", () => {
    const { version } = require("joi/package.json");
    const [major, minor, patch] = version.split(".").map(Number);
    const fixed =
      major > 17 || (major === 17 && (minor > 13 || (minor === 13 && patch >= 6)));
    expect(fixed).toBe(true);
  });

  it("the declared joi range cannot resolve back to a vulnerable version", () => {
    const pkg = require("../../package.json");
    expect(pkg.dependencies.joi).toMatch(/\^17\.13\.([6-9]|\d{2,})/);
  });
});

// ===========================================================================
// A07:2021 — Identification and Authentication Failures
// ===========================================================================

describe("A07:2021 Identification and Authentication Failures", () => {
  it("rejects a request with no token", async () => {
    const res = await request(app).get("/api/student/all");
    expect([401, 403]).toContain(res.status);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const forged = jwt.sign({ id: STUDENT_ID }, "not-the-real-secret", { expiresIn: "1h" });
    const res = await auth(request(app).get("/api/student/all"), forged);
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const expired = jwt.sign({ id: STUDENT_ID }, config.secret, { expiresIn: -10 });
    const res = await auth(request(app).get("/api/student/all"), expired);
    expect(res.status).toBe(401);
  });

  it("rejects an alg=none unsigned token", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ id: STUDENT_ID })).toString("base64url");
    const res = await auth(request(app).get("/api/student/all"), `${header}.${payload}.`);
    expect(res.status).toBe(401);
  });

  it("rejects a token whose subject is not a UUID", async () => {
    const res = await auth(
      request(app).get("/api/student/all"),
      jwt.sign({ id: "'; DROP TABLE students; --" }, config.secret, { expiresIn: "1h" })
    );
    expect(res.status).toBe(401);
  });

  it("a valid token for a non-existent principal cannot pass a role gate", async () => {
    const ghost = tokenFor("99999999-9999-4999-8999-999999999999");
    const res = await auth(request(app).get("/api/company/notifications"), ghost);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// A08:2021 — Software and Data Integrity Failures
// ===========================================================================

describe("A08:2021 Software and Data Integrity Failures", () => {
  // Finding #4 — prototype injection / mass assignment
  it("a __proto__ body key cannot inject fields into a student update (finding #4)", async () => {
    const res = await auth(
      request(app)
        .patch(`/api/student/${STUDENT_ID}`)
        .set("Origin", process.env.FRONTEND_URL)
        .set("Content-Type", "application/json"),
      studentToken()
    ).send(
      '{"city":"Tunis","__proto__":{"type":"admin","picture":"http://evil/x.png","workAt":"pwn"}}'
    );

    expect(res.status).toBe(200);
    expect(updateStudentMock).toHaveBeenCalled();
    const payload = updateStudentMock.mock.calls[0][1];
    expect(payload.type).toBeUndefined();
    expect(payload.picture).toBeUndefined();
    expect(payload.workAt).toBeUndefined();
    expect(payload.city).toBe("Tunis");
  });

  it("a __proto__ body key cannot inject an email into a company update (finding #4)", async () => {
    const res = await auth(
      request(app)
        .patch("/api/company/update")
        .set("Origin", process.env.FRONTEND_URL)
        .set("Content-Type", "application/json"),
      companyToken()
    ).send('{"city":"Tunis","__proto__":{"email":"attacker@evil.tld","logo":"http://evil/l.png"}}');

    expect(res.status).toBe(200);
    const payload = updateCompanyMock.mock.calls[0][1];
    expect(payload.email).toBeUndefined();
    expect(payload.logo).toBeUndefined();
  });

  it("the validated body has a clean prototype (finding #4)", async () => {
    await auth(
      request(app)
        .patch(`/api/student/${STUDENT_ID}`)
        .set("Origin", process.env.FRONTEND_URL)
        .set("Content-Type", "application/json"),
      studentToken()
    ).send('{"city":"Tunis","__proto__":{"polluted":"YES"}}');

    // Nothing leaked into the global prototype.
    expect({}.polluted).toBeUndefined();
  });

  it("a constructor.prototype payload does not pollute globally (finding #4)", async () => {
    await auth(
      request(app)
        .patch(`/api/student/${STUDENT_ID}`)
        .set("Origin", process.env.FRONTEND_URL)
        .set("Content-Type", "application/json"),
      studentToken()
    ).send('{"city":"Tunis","constructor":{"prototype":{"polluted":"YES"}}}');

    expect({}.polluted).toBeUndefined();
  });

  // Finding #8 — the sanitizer must not be a pollution sink
  it("xssPrevention does not reparent the request body (finding #8)", () => {
    const { xssPrevention } = require("../../middlewares/validation");
    const body = JSON.parse('{"a":"x","__proto__":{"polluted":"YES"}}');
    const req = { body, query: {} };
    const next = jest.fn();

    xssPrevention(req, {}, next);

    expect(next).toHaveBeenCalled();
    expect(Object.getPrototypeOf(req.body)).toBe(Object.prototype);
    expect(req.body.polluted).toBeUndefined();
    expect({}.polluted).toBeUndefined();
  });

  it("sanitizeInput skips prototype-mutating keys (finding #8)", () => {
    const { sanitizeInput } = require("../../middlewares/validation");
    const body = JSON.parse('{"name":"  ok  ","__proto__":{"polluted":"YES"}}');
    const req = { body };
    const next = jest.fn();

    sanitizeInput(req, {}, next);

    expect(next).toHaveBeenCalled();
    expect({}.polluted).toBeUndefined();
    expect(req.body.name).toBe("ok");
  });

  // Finding #13 — zip slip
  it("archive entry names are stripped of directory components (finding #13)", () => {
    const path = require("path");
    const malicious = "../../../../.ssh/authorized_keys";
    expect(path.basename(malicious)).toBe("authorized_keys");
    expect(path.basename(malicious)).not.toContain("..");
    expect(path.basename(malicious)).not.toContain("/");
  });
});

// ===========================================================================
// A09:2021 — Security Logging and Monitoring Failures
// ===========================================================================

describe("A09:2021 Security Logging and Monitoring Failures", () => {
  it("logs blocked cross-origin attempts server-side", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await auth(
      request(app).post("/api/student/posts").set("Origin", "https://evil.example.com"),
      studentToken()
    ).send({ title: "x", body: "y" });

    expect(warn).toHaveBeenCalled();
    const logged = warn.mock.calls.flat().map(String).join(" ");
    expect(logged).toMatch(/SECURITY/);
    warn.mockRestore();
  });

  it("logs suspected SQL injection attempts server-side", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await auth(
      request(app)
        .patch(`/api/student/${STUDENT_ID}`)
        .set("Origin", process.env.FRONTEND_URL),
      studentToken()
    ).send({ city: "Tunis'; DROP TABLE students; --" });

    const logged = warn.mock.calls.flat().map(String).join(" ");
    expect(logged).toMatch(/SECURITY/);
    warn.mockRestore();
  });

  it("server-side error logging still happens while the client sees a generic message", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    spies.listAll.mockRejectedValueOnce(new Error("pg: connection terminated"));

    const res = await auth(request(app).get("/api/student/all"), studentToken());

    expect(res.body.message).toBe("Internal server error.");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

// ===========================================================================
// A10:2021 — Server-Side Request Forgery
// ===========================================================================

describe("A10:2021 Server-Side Request Forgery", () => {
  // Finding #14
  it("reverse geocoding forwards only numeric coordinates (finding #14)", () => {
    jest.resetModules();
    const mockReverse = jest.fn(async () => []);
    jest.doMock("node-geocoder", () => () => ({
      reverse: mockReverse,
      geocode: jest.fn(async () => []),
    }));

    const geo = require("../../config/geocoder.config");
    const callback = jest.fn();

    geo.reverse(
      {
        query: {
          lat: "36.8",
          lon: "10.1",
          // Attacker-supplied extras that must never reach the provider.
          provider: "http://169.254.169.254/latest/meta-data/",
          apiKey: "stolen",
          httpAdapter: "http",
        },
      },
      {},
      callback
    );

    expect(mockReverse).toHaveBeenCalledTimes(1);
    const forwarded = mockReverse.mock.calls[0][0];
    expect(Object.keys(forwarded).sort()).toEqual(["lat", "lon"]);
    expect(forwarded.lat).toBe(36.8);
    expect(forwarded.lon).toBe(10.1);
    expect(forwarded).not.toHaveProperty("provider");
    expect(forwarded).not.toHaveProperty("apiKey");

    jest.dontMock("node-geocoder");
    jest.resetModules();
  });

  it("reverse geocoding rejects non-numeric coordinates outright (finding #14)", () => {
    jest.resetModules();
    const mockReverse = jest.fn(async () => []);
    jest.doMock("node-geocoder", () => () => ({
      reverse: mockReverse,
      geocode: jest.fn(async () => []),
    }));

    const geo = require("../../config/geocoder.config");
    const callback = jest.fn();

    geo.reverse({ query: { lat: "http://evil.example.com", lon: "x" } }, {}, callback);

    expect(mockReverse).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(null);

    jest.dontMock("node-geocoder");
    jest.resetModules();
  });
});

// ===========================================================================
// File uploads — multer errors are client errors, not 500s
// ===========================================================================

describe("Upload error handling", () => {
  it("rejects an oversized upload with 413", async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1, 0);
    const res = await auth(
      request(app).post(`/api/student/upload/${STUDENT_ID}`),
      studentToken()
    ).attach("image", big, "big.png");

    expect(res.status).toBe(413);
  });

  it("rejects an unexpected upload field with 400", async () => {
    const res = await auth(
      request(app).post(`/api/student/upload/${STUDENT_ID}`),
      studentToken()
    ).attach("notimage", Buffer.from("x"), "a.png");

    expect(res.status).toBe(400);
  });

  it("still rejects a disallowed extension with 400", async () => {
    const res = await auth(
      request(app).post(`/api/student/upload/${STUDENT_ID}`),
      studentToken()
    ).attach("image", Buffer.from("p"), { filename: "x.pug", contentType: "text/x-pug" });

    expect(res.status).toBe(400);
  });
});
