"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "newJob",
    salary: 65000,
    equity: 0.2,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
        title: "newJob",
        salary: 65000,
        equity: "0.2",
        companyHandle: "c1",
      });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'newJob'`);
    expect(result.rows).toEqual([{
        title: "newJob",
        salary: 65000,
        equity: "0.2",
        company_handle: "c1",
      }]);
  });

  test("bad request with nonexistent company", async function () {
    try {
      await Job.create({companyHandle: "nope"});
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: without filters", async function () {
    const jobs = await Job.findAll();
    expect(jobs.length).toBe(4);
  });

  describe("works: with filters", function () {
    test("all filters", async function () {
      const jobs = await Job.findAll({
        title: "j1",
        minSalary: 49000,
        hasEquity: true
      });
      expect(jobs.length).toBe(1);
      expect(jobs[0].title).toEqual("j1");
    });

    test("only title", async function () {
      const jobs = await Job.findAll({ title: "j2" });
      expect(jobs.length).toBe(1);
      expect(jobs[0].title).toEqual("j2");
    });

    test("only minSalary", async function () {
      const jobs = await Job.findAll({ minSalary: 45000 });
      expect(jobs.length).toBe(3);
    });

    test("only hasEquity as true", async function () {
      const jobs = await Job.findAll({ hasEquity: true });
      expect(jobs.length).toBe(3);
    });

    test("only hasEquity as false", async function () {
      const jobs = await Job.findAll({ hasEquity: false });
      expect(jobs.length).toBe(1);
    });

    test("some filters", async function () {
      const jobs = await Job.findAll({
        minSalary: 49000,
        hasEquity: true
      });
      expect(jobs.length).toBe(3);
    });
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const job1 = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    const jobId = job1.rows[0].id;
    let job = await Job.get(jobId);
    expect(job).toEqual({
      title: "j1",
      salary: 50000,
      equity: "0.1",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** getByCompany */

describe("getByCompany", function () {
  test("works", async function () {
    const jobsQuery = await db.query(
      `SELECT title, salary, equity, 
         company_handle AS "companyHandle"
       FROM jobs
       WHERE company_handle = 'c1'`);
    const jobs = await Job.getByCompany("c1");
    expect(jobs).toEqual(jobsQuery.rows);
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "newTitle",
    salary: 80000,
    equity: 0.5,
  };

  test("works", async function () {
    const job1 = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    const jobId = job1.rows[0].id;
    let job = await Job.update(jobId, updateData);
    expect(job).toEqual({
      companyHandle: "c1",
      title: "newTitle",
      salary: 80000,
      equity: "0.5",
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [jobId]);
    expect(result.rows).toEqual([{
      company_handle: "c1",
      title: "newTitle",
      salary: 80000,
      equity: "0.5",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const job1 = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    const jobId = job1.rows[0].id;
    await Job.remove(jobId);
    const res = await db.query(`SELECT title FROM jobs WHERE id=${jobId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
