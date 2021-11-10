const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("works", function () {
    const dataToUpdate = {firstName: "FIRSTNAME", lastName: "LASTNAME"};
    const jsToSql = {firstName: "first_name", lastName: "last_name"};
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
        setCols: "\"first_name\"=$1, \"last_name\"=$2",
        values: ["FIRSTNAME", "LASTNAME"]
    });
  });

  test("fails: no data", function () {
    expect(() => sqlForPartialUpdate({}, {})).toThrow("No data");
  });
});