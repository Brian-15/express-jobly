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

function sqlForSelectFilters(filters) {
  if (!filters || Object.keys(filters).length === 0) return "";
  
  const filterStrings = [];

  if (filters["nameLike"]) {
    filterStrings.push(`name ILIKE '%${filters["nameLike"]}%'`);
  }

  if (filters["maxEmployees"]) {
    filterStrings.push(`num_employees <= ${filters["maxEmployees"]}`);
  }

  if (filters["minEmployees"]) {
    filterStrings.push(`num_employees >= ${filters["minEmployees"]}`);
  }
  console.log(filterStrings);
  
  return ` WHERE ${filterStrings.join(" AND ")} `;
}

module.exports = { sqlForPartialUpdate, sqlForSelectFilters };
