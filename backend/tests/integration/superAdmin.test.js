const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/db");
const { getTestContext } = require("./helpers/testContext");

describe("Super-admin: creación y activación de restaurantes", () => {
  let ctx;
  const restaurantesCreados = [];

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    // Limpiamos cualquier restaurante secundario que hayamos creado en
    // este archivo (el restaurante de prueba principal lo borra globalTeardown).
    // Filtramos ids undefined: si alguna creación falló (ej. por el 401),
    // res.body.id nunca existió y no hay que intentar borrar "undefined".
    for (const id of restaurantesCreados.filter(Boolean)) {
      await pool.execute("DELETE FROM usuarios WHERE restaurante_id = ?", [id]);
      await pool.execute("DELETE FROM restaurantes WHERE id = ?", [id]);
    }
  });

  it("crea un restaurante nuevo con su admin, en estado pendiente", async () => {
    const slug = `test-superadmin-${Date.now()}`;
    const res = await request(app)
      .post("/api/super-admin/restaurantes")
      .set("Authorization", `Bearer ${ctx.superAdminToken}`)
      .send({
        nombre: "Restaurante Temporal",
        slug,
        admin_nombre: "Temp Admin",
        admin_correo: `temp-${Date.now()}@test-mesasmart.com`,
        admin_correo_personal: "temp.personal@test-mesasmart.com",
        admin_telefono: "3000000001",
        admin_password: "temp123456",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    restaurantesCreados.push(res.body.id);

    const [[row]] = await pool.execute("SELECT estado, plan FROM restaurantes WHERE id = ?", [res.body.id]);
    expect(row.estado).toBe("pendiente");
    expect(row.plan).toBe("basico"); // plan por defecto cuando no se manda uno válido
  });

  it("rechaza un slug duplicado", async () => {
    const res = await request(app)
      .post("/api/super-admin/restaurantes")
      .set("Authorization", `Bearer ${ctx.superAdminToken}`)
      .send({
        nombre: "Duplicado",
        slug: ctx.slug, // ya existe, es el restaurante de prueba principal
        admin_nombre: "X",
        admin_correo: `dup-${Date.now()}@test-mesasmart.com`,
        admin_correo_personal: "dup.personal@test-mesasmart.com",
        admin_telefono: "3000000002",
        admin_password: "temp123456",
      });
    expect(res.status).toBe(409);
  });

  it("el admin de un restaurante en estado pendiente no puede loguearse", async () => {
    const slug = `test-pendiente-${Date.now()}`;
    const correo = `pendiente-${Date.now()}@test-mesasmart.com`;

    const crear = await request(app)
      .post("/api/super-admin/restaurantes")
      .set("Authorization", `Bearer ${ctx.superAdminToken}`)
      .send({
        nombre: "Pendiente Test",
        slug,
        admin_nombre: "Pendiente Admin",
        admin_correo: correo,
        admin_correo_personal: "pend.personal@test-mesasmart.com",
        admin_telefono: "3000000003",
        admin_password: "temp123456",
      });
    restaurantesCreados.push(crear.body.id);

    const loginRes = await request(app).post("/api/auth/login").send({ correo, password: "temp123456" });
    expect(loginRes.status).toBe(403);
  });

  it("activar deja al restaurante en estado activo y permite loguear al admin", async () => {
    const slug = `test-activar-${Date.now()}`;
    const correo = `activar-${Date.now()}@test-mesasmart.com`;

    const crear = await request(app)
      .post("/api/super-admin/restaurantes")
      .set("Authorization", `Bearer ${ctx.superAdminToken}`)
      .send({
        nombre: "Activar Test",
        slug,
        admin_nombre: "Activar Admin",
        admin_correo: correo,
        admin_correo_personal: "activar.personal@test-mesasmart.com",
        admin_telefono: "3000000004",
        admin_password: "temp123456",
      });
    restaurantesCreados.push(crear.body.id);

    const activarRes = await request(app)
      .patch(`/api/super-admin/restaurantes/${crear.body.id}/activar`)
      .set("Authorization", `Bearer ${ctx.superAdminToken}`);
    expect(activarRes.status).toBe(200);

    const loginRes = await request(app).post("/api/auth/login").send({ correo, password: "temp123456" });
    expect(loginRes.status).toBe(200);
  });

  it("rechaza crear restaurantes sin token de super_admin (admin normal no puede)", async () => {
    const res = await request(app)
      .post("/api/super-admin/restaurantes")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ nombre: "X", slug: `x-${Date.now()}` });
    expect([401, 403]).toContain(res.status);
  });

  it("rechaza sin token", async () => {
    const res = await request(app).post("/api/super-admin/restaurantes").send({ nombre: "X", slug: "x" });
    expect(res.status).toBe(401);
  });
});