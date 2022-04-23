const { BadRequestError } = require("../expressError");

/** 
 * format data and column names for SQL UPDATE clause
 * @param {object} dataToUpdate Object containing data to update
 * @param {object} jsToSql Object containing column names in camelCase and values in snake_case.
 * e.g.: { colName: col_name }
 * @yields { setCols: string, values: array } where:
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

/**
 * Generates partial SQL query string for filtering data from the companies table.
 * If no filters are provided, return empty string.
 * @param {Object} [filters] - company filters
 * @param {string} [filters.nameLike]
 * @param {number} [filters.minEmployees]
 * @param {number} [filters.maxEmployees]
 * @yields string containing part of SQL query starting at WHERE keyword
 */
function sqlForCompanyFilters(filters) {
  if (!filters || Object.keys(filters).length === 0) return "";
  
  const { nameLike, maxEmployees, minEmployees } = filters;
  const filterStrings = [];

  // handle corner case
  if (minEmployees && maxEmployees && minEmployees > maxEmployees) {
    throw new BadRequestError();
  }

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

/**
 * Generates partial SQL query string for filtering data from the jobs table.
 * If no filters are provided, return empty string.
 * @param {object} [filters] - job filters
 * @param {string} [filters.title]
 * @param {number} [filters.minSalary]
 * @param {boolean} [filters.hasEquity]
 * 
 * @yields string containing SQL query starting at WHERE
 */
function sqlForJobFilters(filters) {
  if (!filters || Object.keys(filters).length === 0) return "";
  
  const { title, minSalary, hasEquity } = filters;
  const filterStrings = [];

  if (title) {
    filterStrings.push(`title ILIKE '%${title}%'`);
  }

  if (minSalary) {
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
