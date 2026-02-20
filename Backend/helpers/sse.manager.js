/**
 * SSE Connection Manager
 *
 * Tracks connected clients and pushes events to them.
 * Each entry is keyed by `userId` and stores a Set of response objects
 * along with the user's type (student, company, admin).
 */

// Map<userId, Set<{ res, userType }>>
const clients = new Map();

function addClient(userId, userType, res) {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
    });
    res.write(":ok\n\n");

    if (!clients.has(userId)) {
        clients.set(userId, new Set());
    }
    const entry = { res, userType };
    clients.get(userId).add(entry);

    res.on("close", () => {
        removeClient(userId, entry);
    });

    return entry;
}

function removeClient(userId, entry) {
    const set = clients.get(userId);
    if (!set) return;
    set.delete(entry);
    if (set.size === 0) {
        clients.delete(userId);
    }
}

function sendToUser(userId, event, data) {
    const set = clients.get(userId);
    if (!set || set.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const entry of set) {
        try {
            entry.res.write(payload);
        } catch {
            removeClient(userId, entry);
        }
    }
}

function broadcastToType(userType, event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [, set] of clients) {
        for (const entry of set) {
            if (entry.userType === userType) {
                try {
                    entry.res.write(payload);
                } catch {
                    // Connection broken, will be cleaned up on close
                }
            }
        }
    }
}

function getClientCount() {
    let count = 0;
    for (const [, set] of clients) {
        count += set.size;
    }
    return count;
}

function isUserConnected(userId) {
    const set = clients.get(userId);
    return set ? set.size > 0 : false;
}

module.exports = {
    addClient,
    removeClient,
    sendToUser,
    broadcastToType,
    getClientCount,
    isUserConnected,
    _clients: clients,
};
