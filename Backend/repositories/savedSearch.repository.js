const db = require("../db");

const create = async (data) => {
    const result = await db.query(
        `INSERT INTO saved_searches (user_id, user_type, name, filters, notify)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [data.userId, data.userType, data.name, JSON.stringify(data.filters || {}), data.notify || false]
    );
    return mapRow(result.rows[0]);
};

const listByUser = async (userId, userType) => {
    const result = await db.query(
        "SELECT * FROM saved_searches WHERE user_id = $1 AND user_type = $2 ORDER BY updated_at DESC",
        [userId, userType]
    );
    return result.rows.map(mapRow);
};

const findById = async (id) => {
    const result = await db.query(
        "SELECT * FROM saved_searches WHERE id = $1",
        [id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
};

const update = async (id, userId, data) => {
    const result = await db.query(
        `UPDATE saved_searches
     SET name = COALESCE($1, name),
         filters = COALESCE($2, filters),
         notify = COALESCE($3, notify),
         updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
        [
            data.name || null,
            data.filters ? JSON.stringify(data.filters) : null,
            data.notify !== undefined ? data.notify : null,
            id,
            userId,
        ]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
};

const deleteById = async (id, userId) => {
    const result = await db.query(
        "DELETE FROM saved_searches WHERE id = $1 AND user_id = $2",
        [id, userId]
    );
    return result.rowCount > 0;
};

const mapRow = (row) => ({
    id: row.id,
    userId: row.user_id,
    userType: row.user_type,
    name: row.name,
    filters: typeof row.filters === "string" ? JSON.parse(row.filters) : row.filters,
    notify: row.notify,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

module.exports = {
    create,
    listByUser,
    findById,
    update,
    deleteById,
    mapRow,
};
