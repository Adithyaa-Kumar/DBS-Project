/**
 * D1 Storage Engine for Cloudflare Workers
 * Stores dynamic table schema + rows in D1 with JSON payloads.
 */

class D1Storage {
  /**
   * @param {import('@cloudflare/d1').D1Database} db
   */
  constructor(db) {
    this.db = db;
  }

  async init() {
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS tables (
        table_name TEXT PRIMARY KEY,
        columns TEXT
      )
    `).run();

    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS rows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        data TEXT
      )
    `).run();
  }

  async createTable(tableName, columns) {
    const exists = await this.db.prepare(`SELECT table_name FROM tables WHERE table_name = ?`).bind(tableName).get();
    if (exists) {
      throw new Error(`Table ${tableName} already exists`);
    }

    await this.db.prepare(`INSERT INTO tables (table_name, columns) VALUES (?, ?)`)
      .bind(tableName, JSON.stringify(columns))
      .run();

    return true;
  }

  async getTableSchema(tableName) {
    const row = await this.db.prepare(`SELECT columns FROM tables WHERE table_name = ?`).bind(tableName).get();
    if (!row) throw new Error(`Table ${tableName} not found`);
    return JSON.parse(row.columns);
  }

  async getAllTables() {
    const tables = {};
    const list = await this.db.prepare(`SELECT table_name, columns FROM tables`).all();

    for (const table of list.results) {
      const columns = JSON.parse(table.columns);
      const rows = await this.getTableRows(table.table_name);
      tables[table.table_name] = { metadata: { columns }, rows };
    }

    return tables;
  }

  async getTable(tableName) {
    const tableRow = await this.db.prepare(`SELECT columns FROM tables WHERE table_name = ?`).bind(tableName).get();
    if (!tableRow) throw new Error(`Table ${tableName} not found`);

    const columns = JSON.parse(tableRow.columns);
    const rows = await this.getTableRows(tableName);

    return { metadata: { columns }, rows };
  }

  async getTableRows(tableName) {
    const result = await this.db.prepare(`SELECT data FROM rows WHERE table_name = ?`).bind(tableName).all();
    if (!result || !result.results) return [];
    return result.results.map(r => JSON.parse(r.data));
  }

  async insertRow(tableName, data) {
    const tableRow = await this.db.prepare(`SELECT columns FROM tables WHERE table_name = ?`).bind(tableName).get();
    if (!tableRow) throw new Error(`Table ${tableName} not found`);

    const columns = JSON.parse(tableRow.columns);
    await this.validateForeignKeys(tableName, data);

    const pkColumn = columns.find(c => c.isPrimaryKey);
    if (pkColumn) {
      const existing = await this.getRowByPK(tableName, data[pkColumn.name]);
      if (existing) {
        throw new Error(`Primary key violation: ${pkColumn.name}=${data[pkColumn.name]} already exists in ${tableName}`);
      }
    }

    const insertRow = JSON.stringify(data);
    await this.db.prepare(`INSERT INTO rows (table_name, data) VALUES (?, ?)`).bind(tableName, insertRow).run();
    return data;
  }

  async validateForeignKeys(tableName, data) {
    const columns = await this.getTableSchema(tableName);

    for (const column of columns) {
      if (column.isForeignKey && data[column.name] != null) {
        const refTable = await this.getTable(column.referencedTable);
        if (!refTable) {
          throw new Error(`Referenced table ${column.referencedTable} not found`);
        }

        const exists = refTable.rows.some(row => row[column.referencedColumn] === data[column.name]);

        if (!exists) {
          throw new Error(`Foreign key constraint violation: ${data[column.name]} not found in ${column.referencedTable}.${column.referencedColumn}`);
        }
      }
    }
  }

  async getRowByPK(tableName, pkValue) {
    const columns = await this.getTableSchema(tableName);
    const pkColumn = columns.find(c => c.isPrimaryKey);
    if (!pkColumn) throw new Error(`No primary key defined for table ${tableName}`);

    const rows = await this.getTableRows(tableName);
    return rows.find(row => String(row[pkColumn.name]) === String(pkValue));
  }

  async deleteRow(tableName, pkValue) {
    const columns = await this.getTableSchema(tableName);
    const pkColumn = columns.find(c => c.isPrimaryKey);
    if (!pkColumn) throw new Error(`No primary key defined for table ${tableName}`);

    const rows = await this.getTableRows(tableName);
    const row = rows.find(r => String(r[pkColumn.name]) === String(pkValue));
    if (!row) {
      throw new Error(`Row with ${pkColumn.name}=${pkValue} not found in ${tableName}`);
    }

    // delete matching rows
    await this.db.prepare(`DELETE FROM rows WHERE table_name = ? AND json_extract(data, ?) = ?`)
      .bind(tableName, `$.${pkColumn.name}`, String(pkValue))
      .run();

    return true;
  }

  async getTableSchemas() {
    const result = await this.db.prepare(`SELECT table_name, columns FROM tables`).all();
    const schemas = [];
    for (const table of result.results) {
      schemas.push({ tableName: table.table_name, columns: JSON.parse(table.columns) });
    }
    return schemas;
  }

  async getAllRelationships() {
    const schemas = await this.getTableSchemas();
    const relationships = [];

    for (const schema of schemas) {
      for (const col of schema.columns) {
        if (col.isForeignKey) {
          relationships.push({
            fromTable: schema.tableName,
            fromColumn: col.name,
            toTable: col.referencedTable,
            toColumn: col.referencedColumn
          });
        }
      }
    }

    return relationships;
  }

  async clear() {
    await this.db.prepare(`DELETE FROM rows`).run();
    await this.db.prepare(`DELETE FROM tables`).run();
    return true;
  }

  async innerJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns = null) {
    const leftRows = await this.getTableRows(leftTable);
    const rightRows = await this.getTableRows(rightTable);
    const result = [];

    for (const leftRow of leftRows) {
      for (const rightRow of rightRows) {
        if (leftRow[leftColumn] === rightRow[rightColumn]) {
          const joinedRow = {
            [`${leftTable}_${leftColumn}`]: leftRow[leftColumn],
            [`${rightTable}_${rightColumn}`]: rightRow[rightColumn]
          };

          for (const [key, value] of Object.entries(leftRow)) {
            joinedRow[`${leftTable}_${key}`] = value;
          }

          for (const [key, value] of Object.entries(rightRow)) {
            joinedRow[`${rightTable}_${key}`] = value;
          }

          result.push(joinedRow);
        }
      }
    }

    return selectColumns ? this.selectColumns(result, selectColumns) : result;
  }

  async leftJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns = null) {
    const leftRows = await this.getTableRows(leftTable);
    const rightRows = await this.getTableRows(rightTable);
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

          for (const [key, value] of Object.entries(leftRow)) {
            joinedRow[`${leftTable}_${key}`] = value;
          }

          for (const [key, value] of Object.entries(rightRow)) {
            joinedRow[`${rightTable}_${key}`] = value;
          }

          result.push(joinedRow);
        }
      }

      if (!found) {
        const joinedRow = {
          [`${leftTable}_${leftColumn}`]: leftRow[leftColumn],
          [`${rightTable}_${rightColumn}`]: null
        };

        for (const [key, value] of Object.entries(leftRow)) {
          joinedRow[`${leftTable}_${key}`] = value;
        }

        const sampleRight = rightRows[0] || {};
        for (const key of Object.keys(sampleRight)) {
          joinedRow[`${rightTable}_${key}`] = null;
        }

        result.push(joinedRow);
      }
    }

    return selectColumns ? this.selectColumns(result, selectColumns) : result;
  }

  async rightJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns = null) {
    return this.leftJoin(rightTable, leftTable, rightColumn, leftColumn, selectColumns);
  }

  async fullOuterJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns = null) {
    const left = await this.leftJoin(leftTable, rightTable, leftColumn, rightColumn);
    const right = await this.rightJoin(leftTable, rightTable, leftColumn, rightColumn);
    const result = [...left];
    const seen = new Set(left.map(r => JSON.stringify(r)));

    for (const row of right) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        result.push(row);
        seen.add(key);
      }
    }

    return selectColumns ? this.selectColumns(result, selectColumns) : result;
  }

  selectColumns(data, columns) {
    return data.map(row => {
      const filteredRow = {};
      for (const column of columns) {
        if (Object.prototype.hasOwnProperty.call(row, column)) {
          filteredRow[column] = row[column];
        }
      }
      return filteredRow;
    });
  }

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

  sortRows(data, column, order = 'ASC') {
    return [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal < bVal) return order === 'ASC' ? -1 : 1;
      if (aVal > bVal) return order === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  groupBy(data, groupByColumn, aggregates = []) {
    const groups = {};

    for (const row of data) {
      const key = row[groupByColumn];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    }

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
            aggregatedRow[`${func}_${column}`] = values.length > 0 ? values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length : 0;
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

  async executeComplexQuery(query) {
    const {
      from,
      joins = [],
      where = [],
      select = null,
      orderBy = null,
      groupBy = null,
      aggregates = []
    } = query;

    let result = await this.getTableRows(from);

    for (const join of joins) {
      const { type, table, on } = join;
      const [leftCol, rightCol] = on.split('=').map(s => s.trim());
      switch (type.toUpperCase()) {
        case 'INNER':
          result = await this.innerJoin(from, table, leftCol, rightCol);
          break;
        case 'LEFT':
          result = await this.leftJoin(from, table, leftCol, rightCol);
          break;
        case 'RIGHT':
          result = await this.rightJoin(from, table, leftCol, rightCol);
          break;
        case 'FULL':
          result = await this.fullOuterJoin(from, table, leftCol, rightCol);
          break;
        default:
          throw new Error(`Unsupported join type: ${type}`);
      }
    }

    result = this.filterRows(result, where);

    if (groupBy) {
      result = this.groupBy(result, groupBy, aggregates);
    }

    if (select) {
      result = this.selectColumns(result, select);
    }

    if (orderBy) {
      result = this.sortRows(result, orderBy.column, orderBy.order);
    }

    return result;
  }
}

export default D1Storage;
