const request = require("supertest");
const app = require("../../src/app");
const { getTestContext } = require("./helpers/testContext");
describe("POST /api/auth/login", () => {
  let ctx;
  beforeAll(() => {
    ctx = getTestContext();
  });

  it("inicia sesión con las credenciales correctas del admin de prueba", async () => {
    const res = await request(app).post("/api/auth/login").send({
      correo: ctx.adminCorreo,
      password: ctx.adminPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.usuario.restaurante_id).toBe(ctx.restauranteId);
    expect(res.body.usuario.rol).toBe("admin");
    expect(res.body.usuario.plan).toBe("completo");
  });

  it("rechaza con contraseña incorrecta", async () => {
    const res = await request(app).post("/api/auth/login").send({
      correo: ctx.adminCorreo,
      password: "password-incorrecto",
    });
    expect(res.status).toBe(401);
  });

  it("rechaza sin password", async () => {
    const res = await request(app).post("/api/auth/login").send({ correo: ctx.adminCorreo });
    expect(res.status).toBe(400);
  });

  it("rechaza un correo que no existe", async () => {
    const res = await request(app).post("/api/auth/login").send({
      correo: "no-existe@test-mesasmart.com",
      password: "lo-que-sea",
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  let ctx;
  beforeAll(() => {
    ctx = getTestContext();
  });

  it("devuelve los datos del usuario autenticado", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${ctx.adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.usuario.correo).toBe(ctx.adminCorreo);
    expect(res.body.usuario.restaurante_id).toBe(ctx.restauranteId);
  });

  it("rechaza sin token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rechaza un token con formato inválido", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer token-invalido");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("cierra la sesión y el token deja de servir para rutas protegidas", async () => {
    const ctx = getTestContext();

    // Logueamos de nuevo (no reusamos ctx.adminToken, para no invalidar
    // la sesión que usan el resto de los tests de este archivo)
    const login = await request(app).post("/api/auth/login").send({
      correo: ctx.adminCorreo,
      password: ctx.adminPassword,
    });
    const token = login.body.token;

    const logoutRes = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    const meRes = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(meRes.status).toBe(401);
  });
});