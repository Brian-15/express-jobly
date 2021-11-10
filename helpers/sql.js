const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** 
 * format data and column names for SQL UPDATE clause
 * @param {*} dataToUpdate Object containing data to update
 * @param {*} jsToSql Object containing column names in camelCase and values in snake_case: { colName: col_name }
 * @returns object containing:
 *  - setCols: a string of comma-separated column names and value indices ($1, $2, etc.)
 *  - values: array of values t
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
