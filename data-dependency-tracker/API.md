# API Reference

## Base URL
`http://localhost:5000/api`

## Health Check

### GET /health
Server health check endpoint.

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2024-03-22T10:00:00.000Z"
}
```

## Tables Management

### POST /tables
Create a new table with schema.

**Request:**
```json
{
  "tableName": "users",
  "columns": [
    {
      "name": "user_id",
      "dataType": "integer",
      "isPrimaryKey": true,
      "isForeignKey": false
    },
    {
      "name": "email",
      "dataType": "text",
      "isPrimaryKey": false,
      "isForeignKey": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Table users created successfully",
  "table": {
    "tableName": "users",
    "columns": [...]
  }
}
```

### GET /tables
Get all tables with their data and schema.

**Response:**
```json
{
  "tables": {
    "users": {
      "metadata": { "columns": [...] },
      "rows": [...]
    }
  },
  "schemas": [...],
  "total": 1
}
```

### GET /tables/:tableName
Get specific table.

**Response:**
```json
{
  "tableName": "users",
  "metadata": { "columns": [...] },
  "rows": [...]
}
```

## Data Management

### POST /tables/:tableName/rows
Insert a row into a table.

**Request:**
```json
{
  "data": {
    "user_id": 1,
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Row inserted into users",
  "row": {
    "_id": 1,
    "user_id": 1,
    "email": "john@example.com"
  }
}
```

**Errors:**
- Foreign key constraint violation
- Invalid data type

### GET /tables/:tableName/rows
Get all rows from a table.

**Response:**
```json
{
  "tableName": "users",
  "rows": [...],
  "count": 5
}
```

### DELETE /tables/:tableName/rows/:pkValue
Delete a row by primary key value.

**Response:**
```json
{
  "success": true,
  "message": "Row deleted from users"
}
```

## Deletion Simulation

### POST /simulate-deletion
Analyze deletion impact and generate dependency graph.

**Request:**
```json
{
  "tableName": "users",
  "pkValue": 1
}
```

**Response:**
```json
{
  "success": true,
  "graph": {
    "nodes": [
      {
        "id": "users:1",
        "label": "users (#1)",
        "tableName": "users",
        "rowData": {...},
        "type": "target"
      },
      {
        "id": "posts:101",
        "label": "posts (#101)",
        "tableName": "posts",
        "rowData": {...},
        "type": "dependent"
      }
    ],
    "edges": [
      {
        "source": "users:1",
        "target": "posts:101",
        "type": "CRITICAL",
        "label": "references via user_id"
      }
    ],
    "targetNode": "users:1",
    "statistics": {
      "totalNodes": 2,
      "totalEdges": 1,
      "impactedTables": ["users", "posts"]
    }
  }
}
```

## Relationships

### GET /relationships
Analyze all table relationships and their cardinality.

**Response:**
```json
{
  "success": true,
  "relationships": {
    "oneToMany": [
      {
        "from": {
          "table": "users",
          "column": "user_id"
        },
        "to": {
          "table": "posts",
          "column": "user_id"
        },
        "cardinality": "one-to-many"
      }
    ],
    "manyToOne": [],
    "oneToOne": []
  },
  "totalRelationships": 1
}
```

### POST /cascade-order
Get the deletion order for cascading deletes.

**Request:**
```json
{
  "tableName": "users",
  "pkValue": 1
}
```

**Response:**
```json
{
  "success": true,
  "deletionOrder": [
    {
      "step": 0,
      "nodeId": "posts:101",
      "table": "posts",
      "pkValue": 101
    },
    {
      "step": 1,
      "nodeId": "users:1",
      "table": "users",
      "pkValue": 1
    }
  ],
  "steps": 2
}
```

## Utility

### POST /clear
Clear all data from the system (for testing).

**Response:**
```json
{
  "success": true,
  "message": "All data cleared"
}
```

## Data Types

Supported data types:
- `text` - String/VARCHAR
- `number` - Decimal/FLOAT
- `integer` - INT
- `date` - DATE
- `boolean` - BOOLEAN

## Error Responses

All errors return appropriate HTTP status codes:

- `400` - Bad Request (validation error)
- `404` - Not Found (table/row doesn't exist)
- `500` - Server Error

**Error Response Format:**
```json
{
  "error": "Error message describing what went wrong"
}
```

Common errors:
- `Table {tableName} already exists`
- `Table {tableName} not found`
- `Foreign key constraint violation: {value} not found in {table}.{column}`
- `No primary key defined for table {tableName}`
- `Row with {pkColumn}={pkValue} not found in {tableName}`

## Rate Limiting

No rate limiting is enforced. The in-memory storage has no built-in limits.

## Authentication

No authentication is required for this demo version. In production, add JWT or OAuth2.

## CORS

CORS is enabled for all origins. Modify in backend/index.js if needed:
```javascript
app.use(cors());
```

## Examples

### Create Tables with Relationships

```bash
# Create Categories table
curl -X POST http://localhost:5000/api/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "categories",
    "columns": [
      {"name": "id", "dataType": "integer", "isPrimaryKey": true},
      {"name": "name", "dataType": "text"}
    ]
  }'

# Create Products table
curl -X POST http://localhost:5000/api/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "products",
    "columns": [
      {"name": "id", "dataType": "integer", "isPrimaryKey": true},
      {"name": "category_id", "dataType": "integer", "isForeignKey": true, "referencedTable": "categories", "referencedColumn": "id"},
      {"name": "name", "dataType": "text"}
    ]
  }'

# Create Orders table
curl -X POST http://localhost:5000/api/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "orders",
    "columns": [
      {"name": "id", "dataType": "integer", "isPrimaryKey": true},
      {"name": "product_id", "dataType": "integer", "isForeignKey": true, "referencedTable": "products", "referencedColumn": "id"},
      {"name": "qty", "dataType": "integer"}
    ]
  }'
```

### Insert Data

```bash
# Insert category
curl -X POST http://localhost:5000/api/tables/categories/rows \
  -H "Content-Type: application/json" \
  -d '{"data": {"id": 1, "name": "Electronics"}}'

# Insert product
curl -X POST http://localhost:5000/api/tables/products/rows \
  -H "Content-Type: application/json" \
  -d '{"data": {"id": 101, "category_id": 1, "name": "Laptop"}}'

# Insert order
curl -X POST http://localhost:5000/api/tables/orders/rows \
  -H "Content-Type: application/json" \
  -d '{"data": {"id": 1001, "product_id": 101, "qty": 2}}'
```

### Simulate Deletion

```bash
curl -X POST http://localhost:5000/api/simulate-deletion \
  -H "Content-Type: application/json" \
  -d '{"tableName": "products", "pkValue": 101}'
```

## Pagination

Pagination is not implemented. All rows are returned at once. Consider implementing for large datasets:

```javascript
// Example enhancement
GET /tables/:tableName/rows?skip=0&limit=50
```
