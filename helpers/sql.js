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

function sqlForCompanyFilters(filters) {
  if (!filters || Object.keys(filters).length === 0) return "";
  
  const { nameLike, maxEmployees, minEmployees } = filters;
  const filterStrings = [];

  if (nameLike) {
    filterStrings.push(`name ILIKE '%${nameLike}%'`);
  }

  if (maxEmployees) {
    filterStrings.push(`num_employees <= ${maxEmployees}`);
  }

  if (minEmployees) {
    filterStrings.push(`num_employees >= ${minEmployees}`);
  }
  
  return ` WHERE ${filterStrings.join(" AND ")} `;
}

function sqlForJobFilters(filters) {
  if (!filters || Object.keys(filters).length === 0) return "";
  
  const { title, minSalary, hasEquity } = filters;
  const filterStrings = [];

  if (title) {
    filterStrings.push(`title ILIKE '%${title}%'`);
  }

  if ("minSalary") {
    filterStrings.push(`salary >= ${minSalary}`);
  }

  if (hasEquity === true) {
    filterStrings.push("equity > 0");
  }
  else if (hasEquity === false) {
    filterStrings.push("equity = 0");
  }
  
  return ` WHERE ${filterStrings.join(" AND ")} `;
}

module.exports = { sqlForPartialUpdate, sqlForJobFilters, sqlForCompanyFilters };
