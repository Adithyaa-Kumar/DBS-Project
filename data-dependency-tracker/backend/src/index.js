/**
 * Cloudflare Worker for Data Dependency Tracker Backend
 * Converts the Express.js backend to serverless functions
 */

import D1Storage from './d1Storage.js';
import DependencyEngine from '../dependencyEngine.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // Shared CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Initialize D1-backed storage per request
    const storage = new D1Storage(env.DB);
    await storage.init();
    const dependencyEngine = new DependencyEngine(storage);

    try {
      // Health check
      if (url.pathname === '/api/health' && method === 'GET') {
        return new Response(JSON.stringify({
          status: 'Server is running',
          timestamp: new Date().toISOString(),
          platform: 'Cloudflare Workers'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Tables endpoints
      if (url.pathname === '/api/tables' && method === 'POST') {
        const body = await request.json();
        const { tableName, columns } = body;

        if (!tableName || !columns || columns.length === 0) {
          return new Response(JSON.stringify({ error: 'Invalid table definition' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await storage.createTable(tableName, columns);
        return new Response(JSON.stringify({
          success: true,
          message: `Table ${tableName} created successfully`,
          table: { tableName, columns }
        }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/api/tables' && method === 'GET') {
        const tables = await storage.getAllTables();
        const schemas = await storage.getTableSchemas();

        return new Response(JSON.stringify({
          tables,
          schemas,
          total: Object.keys(tables).length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Specific table endpoints
      const tableMatch = url.pathname.match(/^\/api\/tables\/([^\/]+)$/);
      if (tableMatch && method === 'GET') {
        const tableName = decodeURIComponent(tableMatch[1]);
        const table = await storage.getTable(tableName);

        return new Response(JSON.stringify({
          tableName,
          ...table
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Row endpoints
      const rowMatch = url.pathname.match(/^\/api\/tables\/([^\/]+)\/rows$/);
      if (rowMatch) {
        const tableName = decodeURIComponent(rowMatch[1]);

        if (method === 'POST') {
          const body = await request.json();
          const { data } = body;

          if (!data || typeof data !== 'object') {
            return new Response(JSON.stringify({ error: 'Invalid row data' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const row = await storage.insertRow(tableName, data);

          return new Response(JSON.stringify({
            success: true,
            message: `Row inserted into ${tableName}`,
            row
          }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (method === 'GET') {
          const table = await storage.getTable(tableName);

          return new Response(JSON.stringify({
            tableName,
            rows: table.rows,
            count: table.rows.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Delete row endpoint
      const deleteMatch = url.pathname.match(/^\/api\/tables\/([^\/]+)\/rows\/(.+)$/);
      if (deleteMatch && method === 'DELETE') {
        const tableName = decodeURIComponent(deleteMatch[1]);
        const pkValue = decodeURIComponent(deleteMatch[2]);

        await storage.deleteRow(tableName, isNaN(pkValue) ? pkValue : Number(pkValue));

        return new Response(JSON.stringify({
          success: true,
          message: `Row deleted from ${tableName}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Simulation endpoints
      if (url.pathname === '/api/simulate-deletion' && method === 'POST') {
        const body = await request.json();
        const { tableName, pkValue } = body;

        if (!tableName || pkValue === undefined) {
          return new Response(JSON.stringify({ error: 'Missing tableName or pkValue' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const graph = await dependencyEngine.simulateDeletion(
          tableName,
          isNaN(pkValue) ? pkValue : Number(pkValue)
        );

        return new Response(JSON.stringify({
          success: true,
          graph
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Relationships endpoint
      if (url.pathname === '/api/relationships' && method === 'GET') {
        const relationships = await dependencyEngine.analyzeRelationships();

        return new Response(JSON.stringify({
          success: true,
          relationships,
          totalRelationships: Object.values(relationships).reduce((sum, arr) => sum + arr.length, 0)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Cascade order endpoint
      if (url.pathname === '/api/cascade-order' && method === 'POST') {
        const body = await request.json();
        const { tableName, pkValue } = body;

        const deletionOrder = await dependencyEngine.getCascadingDeletionOrder(
          tableName,
          isNaN(pkValue) ? pkValue : Number(pkValue)
        );

        return new Response(JSON.stringify({
          success: true,
          deletionOrder,
          steps: Math.max(...deletionOrder.map(d => d.step), 0) + 1
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Query endpoints
      if (url.pathname === '/api/query/join' && method === 'POST') {
        const body = await request.json();
        const { type, leftTable, rightTable, leftColumn, rightColumn, selectColumns } = body;

        if (!type || !leftTable || !rightTable || !leftColumn || !rightColumn) {
          return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        let result;
        switch (type.toLowerCase()) {
          case 'inner':
            result = await storage.innerJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns);
            break;
          case 'left':
            result = await storage.leftJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns);
            break;
          case 'right':
            result = await storage.rightJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns);
            break;
          case 'full':
            result = await storage.fullOuterJoin(leftTable, rightTable, leftColumn, rightColumn, selectColumns);
            break;
          default:
            return new Response(JSON.stringify({ error: 'Invalid join type. Use: inner, left, right, full' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
          success: true,
          query: { type, leftTable, rightTable, leftColumn, rightColumn },
          result,
          count: result.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/api/query/complex' && method === 'POST') {
        const query = await request.json();

        if (!query.from) {
          return new Response(JSON.stringify({ error: 'Missing required parameter: from' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await storage.executeComplexQuery(query);

        return new Response(JSON.stringify({
          success: true,
          query,
          result,
          count: result.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/api/query/examples' && method === 'GET') {
        return new Response(JSON.stringify({
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
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Clear data endpoint
      if (url.pathname === '/api/clear' && method === 'POST') {
        await storage.clear();
        return new Response(JSON.stringify({ success: true, message: 'All data cleared' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Setup demo data endpoint
      if (url.pathname === '/api/setup-demo' && method === 'POST') {
        // Clear existing data
        await storage.clear();

        // Create Categories table
        await storage.createTable('Categories', [
          { name: 'category_id', dataType: 'integer', isPrimaryKey: true },
          { name: 'name', dataType: 'text' }
        ]);

        // Create Products table
        await storage.createTable('Products', [
          { name: 'product_id', dataType: 'integer', isPrimaryKey: true },
          { name: 'category_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Categories', referencedColumn: 'category_id' },
          { name: 'name', dataType: 'text' },
          { name: 'price', dataType: 'number' }
        ]);

        // Create Orders table
        await storage.createTable('Orders', [
          { name: 'order_id', dataType: 'integer', isPrimaryKey: true },
          { name: 'product_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Products', referencedColumn: 'product_id' },
          { name: 'customer_name', dataType: 'text' },
          { name: 'quantity', dataType: 'integer' },
          { name: 'total_price', dataType: 'number' }
        ]);

        // Insert sample data
        await storage.insertRow('Categories', { category_id: 1, name: 'Electronics' });
        await storage.insertRow('Categories', { category_id: 2, name: 'Books' });
        await storage.insertRow('Categories', { category_id: 3, name: 'Furniture' });

        await storage.insertRow('Products', { product_id: 101, category_id: 1, name: 'Laptop', price: 999.99 });
        await storage.insertRow('Products', { product_id: 102, category_id: 1, name: 'Smartphone', price: 599.99 });
        await storage.insertRow('Products', { product_id: 201, category_id: 2, name: 'Python Guide', price: 49.99 });
        await storage.insertRow('Products', { product_id: 301, category_id: 3, name: 'Office Chair', price: 249.99 });

        await storage.insertRow('Orders', { order_id: 1001, product_id: 101, customer_name: 'Alice Johnson', quantity: 1, total_price: 999.99 });
        await storage.insertRow('Orders', { order_id: 1002, product_id: 102, customer_name: 'Bob Smith', quantity: 2, total_price: 1199.98 });
        await storage.insertRow('Orders', { order_id: 1003, product_id: 201, customer_name: 'Charlie Brown', quantity: 1, total_price: 49.99 });

        return new Response(JSON.stringify({
          success: true,
          message: 'Demo data loaded successfully',
          data: {
            tables: ['Categories', 'Products', 'Orders'],
            categories: 3,
            products: 4,
            orders: 3
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 for unknown endpoints
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};