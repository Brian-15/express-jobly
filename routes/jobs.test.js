"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

jest.useFakeTimers('legacy');

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "jNew",
    salary: 75000,
    equity: 0,
    companyHandle: "c3"
  };
  
  test("ok for admin user", async function() {
    const { equity, ...rest } = newJob;
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({ job: { equity: `${equity}`, ...rest } });
  });

  test("unauthorized for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: { message: "Unauthorized", status: 401 }
    });
  });

  test("bad request with missing data", async function () {
    const { title, salary } = newJob;
    const resp = await request(app)
        .post("/jobs")
        .send({ title, salary })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    let { salary, ...rest } = newJob;
    salary = "invalid";
    const resp = await request(app)
        .post("/jobs")
        .send({ salary, ...rest })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body.jobs.length).toBe(4);
  });

  test("works: gets job with title like \"j1\"", async function () {
    const jobResult = await db.query(
        `SELECT title, salary, equity,
           company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'j1'`);
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "j1" });

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({jobs: [ jobResult.rows[0] ]});
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobResult = await db.query(
        `SELECT id, title, salary, equity,
           company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'j1'`);
    const { id, ...job } = jobResult.rows[0];
    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({ job });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request data for job", async function () {
    const resp = await request(app).get(`/jobs/DNE`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {

  test("ok for admins", async function () {
    const jobResult = await db.query(
        `SELECT id, title, salary, equity,
           company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'j1'`);
    const { id, title, ...rest } = jobResult.rows[0];
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "newTitle",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ job: { title: "newTitle", ...rest } });
  });

  test("unauth for users", async function () {
    const jobResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = jobResult.rows[0];
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({ title: "newTitle" })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
    expect(resp.body).toEqual({
      error: { message: "Unauthorized", status: 401 }
    });
  });

  test("unauth for anon", async function () {
    const jobResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = jobResult.rows[0];
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({ title: "newTitle" });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({ title: "new nope" })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const jobResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = jobResult.rows[0];
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({ id: 0 })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const jobResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = jobResult.rows[0];
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({ equity: "stuff" })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const jobResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = jobResult.rows[0];
    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ deleted: `${id}` });
  });

  test("unauth for users", async function () {
    const jobResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = jobResult.rows[0];
    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
    expect(resp.body).toEqual({ error: { message: "Unauthorized", status: 401 } });
  });

  test("unauth for anon", async function () {
    const jobResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = jobResult.rows[0];
    const resp = await request(app)
        .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
