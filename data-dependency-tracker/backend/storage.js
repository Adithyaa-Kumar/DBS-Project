/**
 * Storage Module
 * Manages in-memory data storage for tables and relationships
 */

class StorageEngine {
  constructor() {
    this.tables = {};
    this.metadata = {}; // Stores table metadata (columns, constraints)
  }

  /**
   * Create a new table with schema
   * @param {string} tableName - Name of the table
   * @param {Array} columns - Array of column definitions
   * @returns {boolean} - Success/failure
   */
  createTable(tableName, columns) {
    if (this.tables[tableName]) {
      throw new Error(`Table ${tableName} already exists`);
    }

    this.tables[tableName] = {
      rows: [],
      nextRowId: 1
    };

    this.metadata[tableName] = {
      columns: columns.map(col => ({
        name: col.name,
        dataType: col.dataType,
        isPrimaryKey: col.isPrimaryKey || false,
        isForeignKey: col.isForeignKey || false,
        referencedTable: col.referencedTable || null,
        referencedColumn: col.referencedColumn || null
      }))
    };

    return true;
  }

  /**
   * Get all tables
   * @returns {Object} - All tables with metadata
   */
  getAllTables() {
    const result = {};
    for (const tableName in this.tables) {
      result[tableName] = {
        metadata: this.metadata[tableName],
        rows: this.tables[tableName].rows
      };
    }
    return result;
  }

  /**
   * Get specific table
   * @param {string} tableName - Name of the table
   * @returns {Object} - Table data and metadata
   */
  getTable(tableName) {
    if (!this.tables[tableName]) {
      throw new Error(`Table ${tableName} not found`);
    }

    return {
      metadata: this.metadata[tableName],
      rows: this.tables[tableName].rows
    };
  }

  /**
   * Insert a row into a table
   * @param {string} tableName - Name of the table
   * @param {Object} data - Row data
   * @returns {Object} - Inserted row with ID
   */
  insertRow(tableName, data) {
    if (!this.tables[tableName]) {
      throw new Error(`Table ${tableName} not found`);
    }

    // Validate foreign keys
    this.validateForeignKeys(tableName, data);

    const row = {
      _id: this.tables[tableName].nextRowId++,
      ...data
    };

    this.tables[tableName].rows.push(row);
    return row;
  }

  /**
   * Validate foreign key constraints
   * @param {string} tableName - Table name
   * @param {Object} data - Row data
   */
  validateForeignKeys(tableName, data) {
    const columns = this.metadata[tableName].columns;

    for (const column of columns) {
      if (column.isForeignKey && data[column.name] !== null && data[column.name] !== undefined) {
        const refTable = this.tables[column.referencedTable];
        const refColumn = column.referencedColumn;

        if (!refTable) {
          throw new Error(`Referenced table ${column.referencedTable} not found`);
        }

        // Check if the referenced value exists
        const found = refTable.rows.some(row => row[refColumn] === data[column.name]);

        if (!found) {
          throw new Error(
            `Foreign key constraint violation: ${data[column.name]} not found in ${column.referencedTable}.${refColumn}`
          );
        }
      }
    }
  }

  /**
   * Get a specific row by primary key
   * @param {string} tableName - Table name
   * @param {*} pkValue - Primary key value
   * @returns {Object} - The row
   */
  getRowByPK(tableName, pkValue) {
    if (!this.tables[tableName]) {
      throw new Error(`Table ${tableName} not found`);
    }

    const columns = this.metadata[tableName].columns;
    const pkColumn = columns.find(col => col.isPrimaryKey);

    if (!pkColumn) {
      throw new Error(`No primary key defined for table ${tableName}`);
    }

    return this.tables[tableName].rows.find(row => row[pkColumn.name] === pkValue);
  }

  /**
   * Delete a row by primary key
   * @param {string} tableName - Table name
   * @param {*} pkValue - Primary key value
   * @returns {boolean} - Success/failure
   */
  deleteRow(tableName, pkValue) {
    if (!this.tables[tableName]) {
      throw new Error(`Table ${tableName} not found`);
    }

    const columns = this.metadata[tableName].columns;
    const pkColumn = columns.find(col => col.isPrimaryKey);

    if (!pkColumn) {
      throw new Error(`No primary key defined for table ${tableName}`);
    }

    const index = this.tables[tableName].rows.findIndex(
      row => row[pkColumn.name] === pkValue
    );

    if (index === -1) {
      throw new Error(`Row with ${pkColumn.name}=${pkValue} not found in ${tableName}`);
    }

    this.tables[tableName].rows.splice(index, 1);
    return true;
  }

  /**
   * Get all tables with their columns
   * @returns {Array} - Array of table metadata
   */
  getTableSchemas() {
    const schemas = [];
    for (const tableName in this.metadata) {
      schemas.push({
        tableName,
        columns: this.metadata[tableName].columns
      });
    }
    return schemas;
  }

  /**
   * Get schema for a specific table
   * @param {string} tableName - Name of the table
   * @returns {Array} - Array of column definitions
   */
  getTableSchema(tableName) {
    if (!this.metadata[tableName]) {
      throw new Error(`Table ${tableName} not found`);
    }
    return this.metadata[tableName].columns;
  }

  /**
   * Get all foreign key relationships
   * @returns {Array} - Array of foreign key relationships
   */
  getAllRelationships() {
    const relationships = [];

    for (const tableName in this.metadata) {
      const columns = this.metadata[tableName].columns;
      for (const column of columns) {
        if (column.isForeignKey) {
          relationships.push({
            fromTable: tableName,
            fromColumn: column.name,
            toTable: column.referencedTable,
            toColumn: column.referencedColumn
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.tables = {};
    this.metadata = {};
  }

  /**
   * Perform INNER JOIN between two tables
   * @param {string} leftTable - Left table name
   * @param {string} rightTable - Right table name
   * @param {string} leftColumn - Join column from left table
   * @param {string} rightColumn - Join column from right table
   * @param {Array} selectColumns - Columns to select (optional)
   * @returns {Array} - Joined result set
   */
  innerJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns = null) {
    if (!this.tables[leftTable] || !this.tables[rightTable]) {
      throw new Error(`Table not found: ${!this.tables[leftTable] ? leftTable : rightTable}`);
    }

    const leftRows = this.tables[leftTable].rows;
    const rightRows = this.tables[rightTable].rows;
    const result = [];

    for (const leftRow of leftRows) {
      for (const rightRow of rightRows) {
        if (leftRow[leftColumn] === rightRow[rightColumn]) {
          const joinedRow = {
            [`${leftTable}_${leftColumn}`]: leftRow[leftColumn],
            [`${rightTable}_${rightColumn}`]: rightRow[rightColumn]
          };

          // Add all columns from left table
          for (const [key, value] of Object.entries(leftRow)) {
            if (key !== '_id') {
              joinedRow[`${leftTable}_${key}`] = value;
            }
          }

          // Add all columns from right table
          for (const [key, value] of Object.entries(rightRow)) {
            if (key !== '_id') {
              joinedRow[`${rightTable}_${key}`] = value;
            }
          }

          result.push(joinedRow);
        }
      }
    }

    return selectColumns ? this.selectColumns(result, selectColumns) : result;
  }

  /**
   * Perform LEFT JOIN between two tables
   * @param {string} leftTable - Left table name
   * @param {string} rightTable - Right table name
   * @param {string} leftColumn - Join column from left table
   * @param {string} rightColumn - Join column from right table
   * @param {Array} selectColumns - Columns to select (optional)
   * @returns {Array} - Joined result set
   */
  leftJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns = null) {
    if (!this.tables[leftTable] || !this.tables[rightTable]) {
      throw new Error(`Table not found: ${!this.tables[leftTable] ? leftTable : rightTable}`);
    }

    const leftRows = this.tables[leftTable].rows;
    const rightRows = this.tables[rightTable].rows;
    const result = [];

    for (const leftRow of leftRows) {
      let found = false;

      for (const rightRow of rightRows) {
        if (leftRow[leftColumn] === rightRow[rightColumn]) {
          found = true;
          const joinedRow = {
            [`${leftTable}_${leftColumn}`]: leftRow[leftColumn],
            [`${rightTable}_${rightColumn}`]: rightRow[rightColumn]
          };

          // Add all columns from left table
          for (const [key, value] of Object.entries(leftRow)) {
            if (key !== '_id') {
              joinedRow[`${leftTable}_${key}`] = value;
            }
          }

          // Add all columns from right table
          for (const [key, value] of Object.entries(rightRow)) {
            if (key !== '_id') {
              joinedRow[`${rightTable}_${key}`] = value;
            }
          }

          result.push(joinedRow);
        }
      }

      // If no match found, add left row with null right columns
      if (!found) {
        const joinedRow = {
          [`${leftTable}_${leftColumn}`]: leftRow[leftColumn],
          [`${rightTable}_${rightColumn}`]: null
        };

        // Add all columns from left table
        for (const [key, value] of Object.entries(leftRow)) {
          if (key !== '_id') {
            joinedRow[`${leftTable}_${key}`] = value;
          }
        }

        // Add null columns from right table
        for (const rightRow of rightRows.slice(0, 1)) { // Just get column names
          for (const key of Object.keys(rightRow)) {
            if (key !== '_id') {
              joinedRow[`${rightTable}_${key}`] = null;
            }
          }
          break;
        }

        result.push(joinedRow);
      }
    }

    return selectColumns ? this.selectColumns(result, selectColumns) : result;
  }

  /**
   * Perform RIGHT JOIN between two tables
   * @param {string} leftTable - Left table name
   * @param {string} rightTable - Right table name
   * @param {string} leftColumn - Join column from left table
   * @param {string} rightColumn - Join column from right table
   * @param {Array} selectColumns - Columns to select (optional)
   * @returns {Array} - Joined result set
   */
  rightJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns = null) {
    // Right join is essentially left join with tables swapped
    const result = this.leftJoin(rightTable, leftTable, rightColumn, leftColumn, selectColumns);
    return result;
  }

  /**
   * Perform FULL OUTER JOIN between two tables
   * @param {string} leftTable - Left table name
   * @param {string} rightTable - Right table name
   * @param {string} leftColumn - Join column from left table
   * @param {string} rightColumn - Join column from right table
   * @param {Array} selectColumns - Columns to select (optional)
   * @returns {Array} - Joined result set
   */
  fullOuterJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns = null) {
    const leftJoinResult = this.leftJoin(leftTable, rightTable, leftColumn, rightColumn);
    const rightJoinResult = this.rightJoin(leftTable, rightTable, leftColumn, rightColumn);

    // Combine results, avoiding duplicates
    const result = [...leftJoinResult];
    const seen = new Set(result.map(row => JSON.stringify(row)));

    for (const row of rightJoinResult) {
      const rowStr = JSON.stringify(row);
      if (!seen.has(rowStr)) {
        result.push(row);
        seen.add(rowStr);
      }
    }

    return selectColumns ? this.selectColumns(result, selectColumns) : result;
  }

  /**
   * Select specific columns from result set
   * @param {Array} data - Result set
   * @param {Array} columns - Column names to select
   * @returns {Array} - Filtered result set
   */
  selectColumns(data, columns) {
    return data.map(row => {
      const filteredRow = {};
      for (const column of columns) {
        if (row.hasOwnProperty(column)) {
          filteredRow[column] = row[column];
        }
      }
      return filteredRow;
    });
  }

  /**
   * Filter rows based on conditions
   * @param {Array} data - Data to filter
   * @param {Array} conditions - Array of condition objects {column, operator, value}
   * @returns {Array} - Filtered data
   */
  filterRows(data, conditions) {
    if (!conditions || conditions.length === 0) {
      return data;
    }

    return data.filter(row => {
      for (const condition of conditions) {
        const { column, operator, value } = condition;
        const cellValue = row[column];

        switch (operator) {
          case '=':
            if (cellValue !== value) return false;
            break;
          case '!=':
            if (cellValue === value) return false;
            break;
          case '>':
            if (!(cellValue > value)) return false;
            break;
          case '<':
            if (!(cellValue < value)) return false;
            break;
          case '>=':
            if (!(cellValue >= value)) return false;
            break;
          case '<=':
            if (!(cellValue <= value)) return false;
            break;
          case 'LIKE':
            if (!String(cellValue).includes(value)) return false;
            break;
          case 'IN':
            if (!Array.isArray(value) || !value.includes(cellValue)) return false;
            break;
          default:
            throw new Error(`Unsupported operator: ${operator}`);
        }
      }
      return true;
    });
  }

  /**
   * Sort rows by column
   * @param {Array} data - Data to sort
   * @param {string} column - Column to sort by
   * @param {string} order - 'ASC' or 'DESC'
   * @returns {Array} - Sorted data
   */
  sortRows(data, column, order = 'ASC') {
    return [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal < bVal) return order === 'ASC' ? -1 : 1;
      if (aVal > bVal) return order === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Group rows by column and apply aggregate functions
   * @param {Array} data - Data to group
   * @param {string} groupByColumn - Column to group by
   * @param {Array} aggregates - Array of {column, function} objects
   * @returns {Array} - Grouped and aggregated data
   */
  groupBy(data, groupByColumn, aggregates = []) {
    const groups = {};

    // Group data
    for (const row of data) {
      const key = row[groupByColumn];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    }

    // Apply aggregates
    const result = [];
    for (const [key, rows] of Object.entries(groups)) {
      const aggregatedRow = { [groupByColumn]: key };

      for (const aggregate of aggregates) {
        const { column, function: func } = aggregate;
        const values = rows.map(r => r[column]).filter(v => v != null);

        switch (func.toUpperCase()) {
          case 'COUNT':
            aggregatedRow[`${func}_${column}`] = values.length;
            break;
          case 'SUM':
            aggregatedRow[`${func}_${column}`] = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
            break;
          case 'AVG':
            aggregatedRow[`${func}_${column}`] = values.length > 0 ?
              values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length : 0;
            break;
          case 'MIN':
            aggregatedRow[`${func}_${column}`] = values.length > 0 ? Math.min(...values.map(v => Number(v) || 0)) : null;
            break;
          case 'MAX':
            aggregatedRow[`${func}_${column}`] = values.length > 0 ? Math.max(...values.map(v => Number(v) || 0)) : null;
            break;
          default:
            throw new Error(`Unsupported aggregate function: ${func}`);
        }
      }

      result.push(aggregatedRow);
    }

    return result;
  }

  /**
   * Execute complex query with joins, filters, sorting, and aggregation
   * @param {Object} query - Query specification
   * @returns {Array} - Query results
   */
  executeComplexQuery(query) {
    const {
      from,
      joins = [],
      where = [],
      select = null,
      orderBy = null,
      groupBy = null,
      aggregates = []
    } = query;

    let result = [...this.tables[from].rows];

    // Apply joins
    for (const join of joins) {
      const { type, table, on } = join;
      const [leftCol, rightCol] = on.split('=').map(s => s.trim());

      switch (type.toUpperCase()) {
        case 'INNER':
          result = this.innerJoin(from, table, leftCol, rightCol);
          break;
        case 'LEFT':
          result = this.leftJoin(from, table, leftCol, rightCol);
          break;
        case 'RIGHT':
          result = this.rightJoin(from, table, leftCol, rightCol);
          break;
        case 'FULL':
          result = this.fullOuterJoin(from, table, leftCol, rightCol);
          break;
        default:
          throw new Error(`Unsupported join type: ${type}`);
      }
    }

    // Apply WHERE conditions
    result = this.filterRows(result, where);

    // Apply GROUP BY and aggregates
    if (groupBy) {
      result = this.groupBy(result, groupBy, aggregates);
    }

    // Apply SELECT
    if (select) {
      result = this.selectColumns(result, select);
    }

    // Apply ORDER BY
    if (orderBy) {
      const { column, order = 'ASC' } = orderBy;
      result = this.sortRows(result, column, order);
    }

    return result;
  }
}

export default StorageEngine;
