// backend/tests/quejas.test.js
const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/config/db");

describe("POST /api/quejas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debería crear una queja (público)", async () => {
    pool.execute.mockResolvedValueOnce([{ insertId: 7 }]);

    const res = await request(app)
      .post("/api/quejas")
      .send({
        mensaje: "La comida llegó fría",
        mesa: "Mesa 5",
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });

    expect(pool.execute).toHaveBeenCalledWith(
      "INSERT INTO quejas (mesa, mensaje) VALUES (?, ?)",
      ["Mesa 5", "La comida llegó fría"]
    );
  });
});