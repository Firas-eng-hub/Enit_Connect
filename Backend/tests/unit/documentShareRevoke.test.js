/**
 * Share revocation must be scoped to the owner of the shared document (IDOR fix).
 */
jest.mock('../../db', () => ({ query: jest.fn() }));

const db = require('../../db');
const documentShareRepository = require('../../repositories/documentShare.repository');

const SHARE_ID = '11111111-1111-4111-8111-111111111111';
const OWNER_ID = '22222222-2222-4222-8222-222222222222';

describe('documentShareRepository.revokeShare', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('only revokes shares of documents created by ownerId', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await documentShareRepository.revokeShare(SHARE_ID, { ownerId: OWNER_ID });

    expect(result).toBeNull();
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/UPDATE document_shares SET revoked_at = now\(\)/);
    expect(sql).toMatch(/document_id IN \(SELECT id FROM documents WHERE creator_id = \$2\)/);
    expect(params).toEqual([SHARE_ID, OWNER_ID]);
  });

  it('returns the revoked row for the owner', async () => {
    db.query.mockResolvedValue({ rows: [{ id: SHARE_ID, revoked_at: new Date() }] });
    const result = await documentShareRepository.revokeShare(SHARE_ID, { ownerId: OWNER_ID });
    expect(result.id).toBe(SHARE_ID);
  });

  it('keeps the unscoped form for admin callers that check ownership themselves', async () => {
    db.query.mockResolvedValue({ rows: [{ id: SHARE_ID }] });
    await documentShareRepository.revokeShare(SHARE_ID);
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).not.toMatch(/creator_id/);
    expect(params).toEqual([SHARE_ID]);
  });

  it('findById looks a share up by id', async () => {
    db.query.mockResolvedValue({ rows: [{ id: SHARE_ID }] });
    const share = await documentShareRepository.findById(SHARE_ID);
    expect(share.id).toBe(SHARE_ID);
    expect(db.query.mock.calls[0][1]).toEqual([SHARE_ID]);
  });
});
