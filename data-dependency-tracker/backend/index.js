/**
 * Express Backend Server
 * Handles all API endpoints for the Data Dependency Tracker
 */

import express from 'express';
import cors from 'cors';
import StorageEngine from './storage.js';
import DependencyEngine from './dependencyEngine.js';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize storage and dependency engine
const storage = new StorageEngine();
const dependencyEngine = new DependencyEngine(storage);

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

/**
 * CREATE TABLE endpoint
 * POST /api/tables
 * Body: { tableName: string, columns: Array }
 */
app.post('/api/tables', (req, res) => {
  try {
    const { tableName, columns } = req.body;

    if (!tableName || !columns || columns.length === 0) {
      return res.status(400).json({ error: 'Invalid table definition' });
    }

    storage.createTable(tableName, columns);
    res.status(201).json({
      success: true,
      message: `Table ${tableName} created successfully`,
      table: {
        tableName,
        columns
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET ALL TABLES endpoint
 * GET /api/tables
 */
app.get('/api/tables', (req, res) => {
  try {
    const tables = storage.getAllTables();
    const schemas = storage.getTableSchemas();

    res.json({
      tables,
      schemas,
      total: Object.keys(tables).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET SPECIFIC TABLE endpoint
 * GET /api/tables/:tableName
 */
app.get('/api/tables/:tableName', (req, res) => {
  try {
    const { tableName } = req.params;
    const table = storage.getTable(tableName);

    res.json({
      tableName,
      ...table
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * INSERT ROW endpoint
 * POST /api/tables/:tableName/rows
 * Body: { data: Object }
 */
app.post('/api/tables/:tableName/rows', (req, res) => {
  try {
    const { tableName } = req.params;
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid row data' });
    }

    const row = storage.insertRow(tableName, data);

    res.status(201).json({
      success: true,
      message: `Row inserted into ${tableName}`,
      row
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET ALL ROWS endpoint
 * GET /api/tables/:tableName/rows
 */
app.get('/api/tables/:tableName/rows', (req, res) => {
  try {
    const { tableName } = req.params;
    const table = storage.getTable(tableName);

    res.json({
      tableName,
      rows: table.rows,
      count: table.rows.length
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * DELETE ROW endpoint
 * DELETE /api/tables/:tableName/rows/:pkValue
 */
app.delete('/api/tables/:tableName/rows/:pkValue', (req, res) => {
  try {
    const { tableName, pkValue } = req.params;

    storage.deleteRow(tableName, isNaN(pkValue) ? pkValue : Number(pkValue));

    res.json({
      success: true,
      message: `Row deleted from ${tableName}`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * SIMULATE DELETION endpoint
 * POST /api/simulate-deletion
 * Body: { tableName: string, pkValue: any }
 * Returns: Graph data with nodes and edges
 */
app.post('/api/simulate-deletion', (req, res) => {
  try {
    const { tableName, pkValue } = req.body;

    if (!tableName || pkValue === undefined) {
      return res.status(400).json({ error: 'Missing tableName or pkValue' });
    }

    const graph = dependencyEngine.simulateDeletion(
      tableName,
      isNaN(pkValue) ? pkValue : Number(pkValue)
    );

    res.json({
      success: true,
      graph
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ANALYZE RELATIONSHIPS endpoint
 * GET /api/relationships
 */
app.get('/api/relationships', (req, res) => {
  try {
    const relationships = dependencyEngine.analyzeRelationships();

    res.json({
      success: true,
      relationships,
      totalRelationships: Object.values(relationships).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET CASCADING DELETION ORDER endpoint
 * POST /api/cascade-order
 * Body: { tableName: string, pkValue: any }
 */
app.post('/api/cascade-order', (req, res) => {
  try {
    const { tableName, pkValue } = req.body;

    const deletionOrder = dependencyEngine.getCascadingDeletionOrder(
      tableName,
      isNaN(pkValue) ? pkValue : Number(pkValue)
    );

    res.json({
      success: true,
      deletionOrder,
      steps: Math.max(...deletionOrder.map(d => d.step), 0) + 1
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * CLEAR ALL DATA endpoint (for testing)
 * POST /api/clear
 */
app.post('/api/clear', (req, res) => {
  storage.clear();
  res.json({ success: true, message: 'All data cleared' });
});

/**
 * SETUP DEMO DATA endpoint
 * POST /api/setup-demo
 * Creates sample tables and data for demonstration
 */
app.post('/api/setup-demo', (req, res) => {
  try {
    // Clear existing data
    storage.clear();

    // Create Categories table
    storage.createTable('Categories', [
      { name: 'category_id', dataType: 'integer', isPrimaryKey: true },
      { name: 'name', dataType: 'text' }
    ]);

    // Create Products table
    storage.createTable('Products', [
      { name: 'product_id', dataType: 'integer', isPrimaryKey: true },
      { name: 'category_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Categories', referencedColumn: 'category_id' },
      { name: 'name', dataType: 'text' },
      { name: 'price', dataType: 'number' }
    ]);

    // Create Orders table
    storage.createTable('Orders', [
      { name: 'order_id', dataType: 'integer', isPrimaryKey: true },
      { name: 'product_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Products', referencedColumn: 'product_id' },
      { name: 'customer_name', dataType: 'text' },
      { name: 'quantity', dataType: 'integer' },
      { name: 'total_price', dataType: 'number' }
    ]);

    // Insert sample data into Categories
    storage.insertRow('Categories', { category_id: 1, name: 'Electronics' });
    storage.insertRow('Categories', { category_id: 2, name: 'Books' });
    storage.insertRow('Categories', { category_id: 3, name: 'Furniture' });

    // Insert sample data into Products
    storage.insertRow('Products', { product_id: 101, category_id: 1, name: 'Laptop', price: 999.99 });
    storage.insertRow('Products', { product_id: 102, category_id: 1, name: 'Smartphone', price: 599.99 });
    storage.insertRow('Products', { product_id: 103, category_id: 1, name: 'Tablet', price: 399.99 });
    storage.insertRow('Products', { product_id: 201, category_id: 2, name: 'Python Guide', price: 49.99 });
    storage.insertRow('Products', { product_id: 202, category_id: 2, name: 'JavaScript Book', price: 39.99 });
    storage.insertRow('Products', { product_id: 301, category_id: 3, name: 'Office Chair', price: 249.99 });

    // Insert sample data into Orders
    storage.insertRow('Orders', { order_id: 1001, product_id: 101, customer_name: 'Alice Johnson', quantity: 1, total_price: 999.99 });
    storage.insertRow('Orders', { order_id: 1002, product_id: 101, customer_name: 'Bob Smith', quantity: 2, total_price: 1999.98 });
    storage.insertRow('Orders', { order_id: 1003, product_id: 102, customer_name: 'Charlie Brown', quantity: 1, total_price: 599.99 });
    storage.insertRow('Orders', { order_id: 1004, product_id: 102, customer_name: 'Alice Johnson', quantity: 3, total_price: 1799.97 });
    storage.insertRow('Orders', { order_id: 1005, product_id: 201, customer_name: 'David Wilson', quantity: 5, total_price: 249.95 });
    storage.insertRow('Orders', { order_id: 1006, product_id: 202, customer_name: 'Emma Davis', quantity: 2, total_price: 79.98 });
    storage.insertRow('Orders', { order_id: 1007, product_id: 301, customer_name: 'Bob Smith', quantity: 4, total_price: 999.96 });

    res.json({
      success: true,
      message: 'Demo data loaded successfully',
      data: {
        tables: ['Categories', 'Products', 'Orders'],
        categories: 3,
        products: 6,
        orders: 7,
        relationships: [
          'Products.category_id → Categories.category_id (Many-to-One)',
          'Orders.product_id → Products.product_id (Many-to-One)'
        ]
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

/**
 * Execute join query
 * POST /api/query/join
 * Body: { type: 'inner|left|right|full', leftTable, rightTable, leftColumn, rightColumn, selectColumns? }
 */
app.post('/api/query/join', (req, res) => {
  try {
    const { type, leftTable, rightTable, leftColumn, rightColumn, selectColumns } = req.body;

    if (!type || !leftTable || !rightTable || !leftColumn || !rightColumn) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let result;
    switch (type.toLowerCase()) {
      case 'inner':
        result = storage.innerJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns);
        break;
      case 'left':
        result = storage.leftJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns);
        break;
      case 'right':
        result = storage.rightJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns);
        break;
      case 'full':
        result = storage.fullOuterJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns);
        break;
      default:
        return res.status(400).json({ error: 'Invalid join type. Use: inner, left, right, full' });
    }

    res.json({
      success: true,
      query: { type, leftTable, rightTable, leftColumn, rightColumn },
      result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Execute complex query
 * POST /api/query/complex
 * Body: {
 *   from: string,
 *   joins?: [{ type, table, on }],
 *   where?: [{ column, operator, value }],
 *   select?: [string],
 *   orderBy?: { column, order? },
 *   groupBy?: string,
 *   aggregates?: [{ column, function }]
 * }
 */
app.post('/api/query/complex', (req, res) => {
  try {
    const query = req.body;

    if (!query.from) {
      return res.status(400).json({ error: 'Missing required parameter: from' });
    }

    const result = storage.executeComplexQuery(query);

    res.json({
      success: true,
      query,
      result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get query examples and documentation
 * GET /api/query/examples
 */
app.get('/api/query/examples', (req, res) => {
  res.json({
    joinExamples: {
      innerJoin: {
        description: "Returns only matching rows from both tables",
        example: {
          type: "inner",
          leftTable: "orders",
          rightTable: "customers",
          leftColumn: "customer_id",
          rightColumn: "id",
          selectColumns: ["orders_id", "orders_amount", "customers_name"]
        }
      },
      leftJoin: {
        description: "Returns all rows from left table and matching rows from right table",
        example: {
          type: "left",
          leftTable: "customers",
          rightTable: "orders",
          leftColumn: "id",
          rightColumn: "customer_id"
        }
      }
    },
    complexQueryExamples: {
      basic: {
        description: "Simple query with filtering and sorting",
        example: {
          from: "products",
          where: [
            { column: "price", operator: ">", value: 100 },
            { column: "category", operator: "=", value: "electronics" }
          ],
          orderBy: { column: "price", order: "DESC" }
        }
      },
      withJoins: {
        description: "Query with joins and aggregation",
        example: {
          from: "orders",
          joins: [
            { type: "inner", table: "customers", on: "customer_id = customers.id" },
            { type: "left", table: "products", on: "product_id = products.id" }
          ],
          where: [
            { column: "orders_date", operator: ">", value: "2024-01-01" }
          ],
          select: ["orders_id", "customers_name", "products_name", "orders_quantity"],
          groupBy: "customers_name",
          aggregates: [
            { column: "orders_quantity", function: "SUM" },
            { column: "orders_id", function: "COUNT" }
          ]
        }
      }
    },
    operators: ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"],
    aggregateFunctions: ["COUNT", "SUM", "AVG", "MIN", "MAX"],
    joinTypes: ["inner", "left", "right", "full"]
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Data Dependency Tracker - Backend Server              ║
║  Server running at http://localhost:${PORT}            ║
║  API docs available at http://localhost:${PORT}/api    ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
