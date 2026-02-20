/**
 * SSE Manager Tests
 */
describe("SSE Manager", () => {
    let sseManager;

    beforeEach(() => {
        jest.resetModules();
        sseManager = require("../../helpers/sse.manager");
        sseManager._clients.clear();
    });

    function createMockResponse() {
        const res = {
            writeHead: jest.fn(),
            write: jest.fn(),
            on: jest.fn(),
        };
        return res;
    }

    describe("addClient", () => {
        it("should add a client and set SSE headers", () => {
            const res = createMockResponse();
            sseManager.addClient("user-1", "student", res);

            expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
            }));
            expect(res.write).toHaveBeenCalledWith(":ok\n\n");
            expect(sseManager.isUserConnected("user-1")).toBe(true);
        });

        it("should support multiple connections per user", () => {
            const res1 = createMockResponse();
            const res2 = createMockResponse();
            sseManager.addClient("user-1", "student", res1);
            sseManager.addClient("user-1", "student", res2);

            expect(sseManager.getClientCount()).toBe(2);
        });
    });

    describe("sendToUser", () => {
        it("should write SSE event to connected user", () => {
            const res = createMockResponse();
            sseManager.addClient("user-1", "student", res);

            sseManager.sendToUser("user-1", "notification", { title: "Test" });

            expect(res.write).toHaveBeenCalledWith(
                expect.stringContaining("event: notification")
            );
            expect(res.write).toHaveBeenCalledWith(
                expect.stringContaining('"title":"Test"')
            );
        });

        it("should not throw for disconnected users", () => {
            expect(() => {
                sseManager.sendToUser("nonexistent", "notification", { title: "Test" });
            }).not.toThrow();
        });
    });

    describe("isUserConnected", () => {
        it("should return false for unknown users", () => {
            expect(sseManager.isUserConnected("unknown")).toBe(false);
        });

        it("should return true for connected users", () => {
            const res = createMockResponse();
            sseManager.addClient("user-1", "student", res);
            expect(sseManager.isUserConnected("user-1")).toBe(true);
        });
    });

    describe("getClientCount", () => {
        it("should return 0 when no clients connected", () => {
            expect(sseManager.getClientCount()).toBe(0);
        });

        it("should count all connected clients", () => {
            sseManager.addClient("user-1", "student", createMockResponse());
            sseManager.addClient("user-2", "company", createMockResponse());
            expect(sseManager.getClientCount()).toBe(2);
        });
    });
});
