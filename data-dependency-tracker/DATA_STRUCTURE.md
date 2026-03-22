# 📊 Data Dependency Tracker - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [How the Project Works](#how-the-project-works)
3. [System Architecture](#system-architecture)
4. [Database Structure](#database-structure)
5. [Table Definitions](#table-definitions)
6. [Entity-Relationship Diagram](#entity-relationship-diagram)
7. [Data Flow](#data-flow)
8. [Algorithms](#algorithms)
9. [Complex Queries](#complex-queries)
10. [Dependency Detection Logic](#dependency-detection-logic)
11. [Example Scenarios](#example-scenarios)
12. [API Reference](#api-reference)

---

## Project Overview

### What is Data Dependency Tracker?

A full-stack web application that allows users to:
- Create relational database tables dynamically (no SQL required)
- Define relationships via primary and foreign keys
- Insert data with automatic FK validation
- **Simulate deletion impact** by analyzing cascading dependencies
- **Visualize dependencies** using interactive graph (Cytoscape.js)
- Understand complex data relationships in real-time

### Key Features

✅ **Dynamic Table Creation** - Create tables with custom columns and constraints
✅ **Automatic FK Validation** - Prevent orphaned references
✅ **Dependency Detection** - BFS algorithm finds all cascading impacts
✅ **Interactive Visualization** - Cytoscape.js graph with node/edge styling
✅ **Complex Relationships** - Supports 1:1, 1:N, N:1 cardinalities
✅ **No SQL Required** - Everything through intuitive UI

---

## How the Project Works

### 1. User Flow

```
User Creates Tables
      ↓
User Defines Columns & Constraints (PK, FK)
      ↓
User Inserts Data (with FK validation)
      ↓
User Selects Row for Deletion Simulation
      ↓
System Runs Dependency Detection (BFS Algorithm)
      ↓
System Generates Graph (Nodes + Edges)
      ↓
User Views Interactive Graph Visualization
      ↓
User Sees Impact Statistics & Cascade Order
```

### 2. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌─────────────┬──────────────┬────────────────────┐   │
│  │TableBuilder │ DataEntry    │ Simulator          │   │
│  └─────────────┴──────────────┴────────────────────┘   │
│  ┌──────────────────┬──────────────────────────────┐   │
│  │  RelationshipMgr │  GraphView (Cytoscape.js)    │   │
│  └──────────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
                    REST API (Axios)
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                   │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ API Routes   │ Storage      │ Dependency       │    │
│  │ (index.js)   │ Engine       │ Engine           │    │
│  │              │ (storage.js) │ (dependencyEng.js)    │
│  └──────────────┴──────────────┴──────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           ↓
         ┌──────────────────────────────────┐
         │   In-Memory JSON Storage         │
         │   (Cleared on server restart)    │
         └──────────────────────────────────┘
```

### 3. Data Storage Model

```javascript
// In-Memory Storage Structure
{
  tables: {
    "TableName": {
      rows: [
        { _id: 1, col1: value1, col2: value2, ... },
        { _id: 2, col1: value1, col2: value2, ... }
      ],
      nextRowId: 3
    }
  },
  metadata: {
    "TableName": {
      columns: [
        { name: 'id', dataType: 'integer', isPrimaryKey: true },
        { name: 'fk_id', dataType: 'integer', isForeignKey: true,
          referencedTable: 'OtherTable', referencedColumn: 'id' }
      ]
    }
  }
}
```

---

## System Architecture

### Frontend Architecture (React)

**Component Hierarchy:**

```
App.jsx (Main Container)
├── Header (Logo, Actions)
├── Navigation (Tab Selector)
└── MainContent
    ├── TableBuilder Component
    │   ├── Form Inputs
    │   └── Column Definition List
    │
    ├── DataEntry Component
    │   ├── Table Selector
    │   ├── Form for Row Insertion
    │   └── Data Table Display
    │
    ├── Simulator Component
    │   ├── Table & Row Selector
    │   └── Cascade Timeline Display
    │
    ├── RelationshipManager Component
    │   ├── Relationship Statistics
    │   └── Relationship List
    │
    └── GraphView Component
        ├── Graph Canvas (Cytoscape)
        ├── Legend
        ├── Node Details Panel
        └── Statistics Dashboard
```

### Backend Architecture (Node.js/Express)

**API Layer:**

```
Express.js Server (Port 5000)
├── Table Management Routes
│   ├── POST /api/tables (create)
│   ├── GET /api/tables (list all)
│   └── GET /api/tables/:tableName (get specific)
│
├── Data Management Routes
│   ├── POST /api/tables/:tableName/rows (insert)
│   ├── GET /api/tables/:tableName/rows (list)
│   └── DELETE /api/tables/:tableName/rows/:pkValue (delete)
│
├── Analysis Routes
│   ├── POST /api/simulate-deletion (dependency detection)
│   ├── GET /api/relationships (analyze all)
│   └── POST /api/cascade-order (deletion sequence)
│
├── Utility Routes
│   ├── GET /api/health (server check)
│   └── POST /api/clear (clear data)
│
└── Middleware
    ├── CORS
    ├── JSON Parser
    └── Error Handler
```

**Business Logic Layer:**

```
StorageEngine (storage.js)
├── createTable(tableName, columns)
├── insertRow(tableName, data)
├── getTable(tableName)
├── deleteRow(tableName, pkValue)
├── getRowByPK(tableName, value)
├── validateForeignKeys(tableName, data)
└── getAllRelationships()

DependencyEngine (dependencyEngine.js)
├── simulateDeletion(tableName, pkValue)
│   └── Returns: { nodes: [...], edges: [...], statistics }
├── findDependentRows(tableName, pkValue)
├── analyzeRelationships()
├── determineCardinality()
└── getCascadingDeletionOrder()
```

---

## Database Structure

### In-Memory Table Schema

The system uses in-memory JSON storage that mimics relational database structure:

#### Core Data Structure

```javascript
// Table Definition
{
  tableName: "Customers",
  columns: [
    {
      name: "customer_id",
      dataType: "integer",
      isPrimaryKey: true,
      isForeignKey: false
    },
    {
      name: "name",
      dataType: "text",
      isPrimaryKey: false,
      isForeignKey: false
    },
    {
      name: "email",
      dataType: "text",
      isPrimaryKey: false,
      isForeignKey: false
    }
  ]
}

// Row Data
{
  _id: 1,  // Internal ID (auto-generated)
  customer_id: 1,
  name: "Alice Johnson",
  email: "alice@example.com"
}
```

#### Foreign Key Definition

```javascript
{
  name: "customer_id",
  dataType: "integer",
  isPrimaryKey: false,
  isForeignKey: true,
  referencedTable: "Customers",
  referencedColumn: "customer_id"
}
```

---

## Table Definitions

### Demo Database Schema

#### 1. CUSTOMERS Table

```
┌──────────────────────────────────────────┐
│            CUSTOMERS                      │
├──────────────┬──────────┬────────────────┤
│ Column       │ Type     │ Constraints    │
├──────────────┼──────────┼────────────────┤
│customer_id   │ INTEGER  │ PK, AUTO       │
│name          │ TEXT     │ NOT NULL       │
│email         │ TEXT     │ UNIQUE         │
│country       │ TEXT     │               │
└──────────────┴──────────┴────────────────┘

Sample Data:
1 | Alice Johnson  | alice@example.com    | USA
2 | Bob Smith      | bob@example.com      | UK
3 | Charlie Brown  | charlie@example.com  | Canada
4 | Diana Prince   | diana@example.com    | USA
5 | Eve Taylor     | eve@example.com      | Australia
```

#### 2. CATEGORIES Table

```
┌──────────────────────────────────────────┐
│            CATEGORIES                     │
├──────────────┬──────────┬────────────────┤
│ Column       │ Type     │ Constraints    │
├──────────────┼──────────┼────────────────┤
│category_id   │ INTEGER  │ PK, AUTO       │
│name          │ TEXT     │ NOT NULL       │
│description   │ TEXT     │               │
└──────────────┴──────────┴────────────────┘

Sample Data:
1 | Electronics | Electronic devices and gadgets
2 | Books       | Physical and digital books
3 | Furniture   | Home and office furniture
4 | Clothing    | Fashion and apparel
```

#### 3. PRODUCTS Table

```
┌─────────────────────────────────────────────┐
│              PRODUCTS                        │
├───────────────┬──────────┬──────────────────┤
│ Column        │ Type     │ Constraints      │
├───────────────┼──────────┼──────────────────┤
│product_id     │ INTEGER  │ PK, AUTO         │
│category_id    │ INTEGER  │ FK → Categories  │
│name           │ TEXT     │ NOT NULL         │
│price          │ DECIMAL  │ NOT NULL         │
│stock          │ INTEGER  │ DEFAULT 0        │
└───────────────┴──────────┴──────────────────┘

Sample Data:
101 | 1 | Laptop Pro        | 1299.99 | 15
102 | 1 | Smartphone X      |  799.99 | 28
103 | 1 | Tablet Ultra      |  499.99 | 42
104 | 1 | Wireless Earbuds  |  199.99 | 89
201 | 2 | Python Guide      |   49.99 |156
202 | 2 | JavaScript Book   |   39.99 |203
203 | 2 | React Tutorial    |   54.99 | 87
301 | 3 | Office Chair      |  249.99 | 12
302 | 3 | Standing Desk     |  399.99 |  8
401 | 4 | Cotton T-Shirt    |   29.99 |145
402 | 4 | Jeans             |   79.99 | 67
```

#### 4. ORDERS Table

```
┌──────────────────────────────────────────────┐
│              ORDERS                           │
├────────────────┬──────────┬──────────────────┤
│ Column         │ Type     │ Constraints      │
├────────────────┼──────────┼──────────────────┤
│order_id        │ INTEGER  │ PK, AUTO         │
│customer_id     │ INTEGER  │ FK → Customers   │
│order_date      │ DATE     │ NOT NULL         │
│total_amount    │ DECIMAL  │ NOT NULL         │
│status          │ TEXT     │ DEFAULT PENDING  │
└────────────────┴──────────┴──────────────────┘

Sample Data:
1001 | 1 | 2024-03-01 | 1299.99 | Delivered
1002 | 1 | 2024-03-05 |  199.99 | Delivered
1003 | 2 | 2024-03-08 | 2099.98 | Processing
1004 | 2 | 2024-03-12 |  499.99 | Shipped
1005 | 3 | 2024-03-15 |  249.95 | Delivered
1006 | 4 | 2024-03-18 |  879.98 | Processing
1007 | 5 | 2024-03-20 |  999.96 | Pending
```

#### 5. ORDERITEMS Table

```
┌────────────────────────────────────────────┐
│            ORDERITEMS                       │
├──────────────┬──────────┬──────────────────┤
│ Column       │ Type     │ Constraints      │
├──────────────┼──────────┼──────────────────┤
│item_id       │ INTEGER  │ PK, AUTO         │
│order_id      │ INTEGER  │ FK → Orders      │
│product_id    │ INTEGER  │ FK → Products    │
│quantity      │ INTEGER  │ NOT NULL         │
│unit_price    │ DECIMAL  │ NOT NULL         │
└──────────────┴──────────┴──────────────────┘

Sample Data:
10001 | 1001 | 101 | 1 | 1299.99
10002 | 1002 | 104 | 1 |  199.99
10003 | 1003 | 102 | 2 |  799.99
10004 | 1003 | 104 | 1 |  199.99
10005 | 1004 | 103 | 1 |  499.99
10006 | 1005 | 201 | 5 |   49.99
10007 | 1006 | 301 | 2 |  249.99
10008 | 1006 | 302 | 1 |  399.99
10009 | 1007 | 401 | 4 |   29.99
10010 | 1007 | 402 | 2 |   79.99
```

#### 6. REVIEWS Table

```
┌──────────────────────────────────────────┐
│              REVIEWS                      │
├──────────────┬──────────┬────────────────┤
│ Column       │ Type     │ Constraints    │
├──────────────┼──────────┼────────────────┤
│review_id     │ INTEGER  │ PK, AUTO       │
│product_id    │ INTEGER  │ FK → Products  │
│customer_id   │ INTEGER  │ FK → Customers │
│rating        │ INTEGER  │ 1-5 RANGE      │
│comment       │ TEXT     │               │
└──────────────┴──────────┴────────────────┘

Sample Data:
5001 | 101 | 1 | 5 | Excellent laptop, fast and reliable!
5002 | 102 | 2 | 4 | Great phone, good value for money
5003 | 201 | 3 | 5 | Best Python book I have read
5004 | 301 | 4 | 4 | Comfortable chair for work
5005 | 401 | 5 | 3 | Good quality, fits well
```

---

## Entity-Relationship Diagram

### ER Diagram (Text Format)

```
┌──────────────────┐                 ┌──────────────────┐
│   CUSTOMERS      │                 │   CATEGORIES     │
├──────────────────┤                 ├──────────────────┤
│ PK: customer_id  │                 │ PK: category_id  │
│    name          │                 │    name          │
│    email         │                 │    description   │
│    country       │                 └──────────────────┘
└──────────────────┘                          ▲
         ▲                                     │
         │ 1:N                                 │ 1:N
         │                                     │
    ┌────┴──────────┐          ┌──────────────┴────┐
    │               │          │                   │
┌───┴──────────┐  ┌───┴──────────────┐         ┌───┴──────────────┐
│   ORDERS     │  │   REVIEWS        │         │   PRODUCTS       │
├──────────────┤  ├──────────────────┤         ├──────────────────┤
│ PK: order_id │  │ PK: review_id    │         │ PK: product_id   │
│ FK: cust_id  │  │ FK: product_id   │◄───────►│ FK: category_id  │
│ order_date   │  │ FK: customer_id  │         │ name             │
│ total_amount │  │ rating           │         │ price            │
│ status       │  │ comment          │         │ stock            │
└──────┬───────┘  └──────────────────┘         └──────────────────┘
       │ 1:N
       │ FK: order_id
       │
┌──────┴──────────┐
│  ORDERITEMS     │
├─────────────────┤
│ PK: item_id     │
│ FK: order_id    │◄──────────1:N────────────┐
│ FK: product_id  │◄──────────1:N────────────┘
│ quantity        │
│ unit_price      │
└─────────────────┘

Relationship Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Relationship          │ Type      │ Cardinality │ Cascade
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customers → Orders    │ FK        │ 1:N         │ YES
Orders → OrderItems   │ FK        │ 1:N         │ YES
Products → OrderItems │ FK        │ 1:N         │ YES
Categories → Products │ FK        │ 1:N         │ YES
Customers → Reviews   │ FK        │ 1:N         │ YES
Products → Reviews    │ FK        │ 1:N         │ YES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Data Flow

### Create Table Flow

```
User Input (TableBuilder)
    │ name: "Customers"
    │ columns: [...]
    ↓
API: POST /api/tables
    │ { tableName, columns }
    ↓
Backend: app.post('/api/tables')
    │
    ├→ Validate input
    ├→ StorageEngine.createTable(tableName, columns)
    │   ├→ Check if table exists
    │   ├→ Create metadata entry
    │   └→ Initialize empty rows array
    │
    └→ Response: { success, table }
         ↓
UI: Update table list
    └→ Display in Table Builder
```

### Insert Row Flow

```
User Input (DataEntry)
    │ selectedTable: "Customers"
    │ formData: { customer_id: 1, name: "Alice", ... }
    ↓
API: POST /api/tables/:tableName/rows
    │ { data }
    ↓
Backend: app.post('/api/tables/:name/rows')
    │
    ├→ Validate input
    ├→ StorageEngine.validateForeignKeys(tableName, data)
    │   ├→ For each FK column:
    │   │   ├→ Get referenced table
    │   │   ├→ Check if value exists in referenced table
    │   │   └→ Throw error if not found
    │   └→ Return valid if all FKs exist
    │
    ├→ StorageEngine.insertRow(tableName, data)
    │   ├→ Generate internal _id
    │   ├→ Add row to table
    │   └→ Increment nextRowId
    │
    └→ Response: { success, row }
         ↓
UI: Show confirmation
    └→ Reload table data
```

### Delete Simulation Flow

```
User Input (Simulator)
    │ select: { tableName: "Customers", pkValue: 1 }
    ↓
API: POST /api/simulate-deletion
    │ { tableName, pkValue }
    ↓
Backend: app.post('/api/simulate-deletion')
    │
    ├→ DependencyEngine.simulateDeletion(tableName, pkValue)
    │   │
    │   ├→ CREATE nodes array:
    │   │   └→ Add target node (type: "target")
    │   │
    │   ├→ RUN BFS Algorithm:
    │   │   ├→ queue = [target_row]
    │   │   ├→ visited = [target_id]
    │   │   │
    │   │   └→ WHILE queue NOT empty:
    │   │       ├→ current = queue.pop()
    │   │       ├→ dependents = findDependentRows(current)
    │   │       │
    │   │       ├→ FOR EACH dependent:
    │   │       │   ├→ Add node (type: "dependent")
    │   │       │   ├→ Add edge (source→dependent, type: "CRITICAL")
    │   │       │   ├→ Mark visited
    │   │       │   └→ queue.push(dependent)
    │   │
    │   └→ RETURN { nodes, edges, statistics }
    │
    └→ Response: { graph: { nodes, edges, stats } }
         ↓
UI: GraphView renders
    └→ Display graph with nodes and edges
```

---

## Algorithms

### 1. Dependency Detection Algorithm (BFS)

**Purpose:** Find all rows affected by deleting a specific row

**Algorithm:**

```
FUNCTION simulateDeletion(targetTable, targetPK)
    nodes = []
    edges = []
    visited = Set()

    // Add target node
    targetNode = { id: targetTable:targetPK, type: "target" }
    nodes.add(targetNode)
    visited.add(targetNode.id)

    queue = [targetNode]

    WHILE queue is not empty:
        current = queue.dequeue()

        // Find all rows that reference current row
        dependentRows = findDependentRows(current.table, current.pk)

        FOR EACH dependentRow in dependentRows:
            dependentId = dependentRow.table:dependentRow.pk

            IF dependentId NOT in visited:
                // Add dependent node
                node = { id: dependentId, type: "dependent" }
                nodes.add(node)
                visited.add(dependentId)

                // Add edge
                edge = {
                    source: current.id,
                    target: dependentId,
                    type: "CRITICAL"
                }
                edges.add(edge)

                // Continue traversal
                queue.enqueue({
                    table: dependentRow.table,
                    pk: dependentRow.pk
                })

    RETURN {
        nodes: nodes,
        edges: edges,
        statistics: {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            impactedTables: unique(table from all nodes)
        }
    }
END FUNCTION


FUNCTION findDependentRows(table, pkValue)
    dependents = []
    pkColumn = getPrimaryKeyColumn(table)

    // Get all foreign key relationships pointing to this table
    relationships = getAllRelationships()
    incomingRels = relationships.filter(r =>
        r.referencedTable == table AND
        r.referencedColumn == pkColumn.name
    )

    // For each incoming relationship, find matching rows
    FOR EACH rel in incomingRels:
        refTable = getTable(rel.fromTable)
        matchingRows = refTable.rows.filter(row =>
            row[rel.fromColumn] == pkValue
        )

        FOR EACH matchingRow in matchingRows:
            refPkColumn = getPrimaryKeyColumn(rel.fromTable)
            dependents.add({
                table: rel.fromTable,
                pkValue: matchingRow[refPkColumn.name],
                row: matchingRow
            })

    RETURN dependents
END FUNCTION
```

**Time Complexity:** O(V + E)
- V = number of rows in all tables
- E = number of foreign key relationships

**Space Complexity:** O(V)
- For visited set and queue

### 2. Foreign Key Validation Algorithm

```
FUNCTION validateForeignKeys(tableName, data)
    columns = getTableColumns(tableName)

    FOR EACH column in columns:
        IF column.isForeignKey == True:
            fkValue = data[column.name]

            IF fkValue != null AND fkValue != undefined:
                refTable = getTable(column.referencedTable)
                refColumn = column.referencedColumn

                // Check if value exists in referenced table
                exists = refTable.rows.any(row =>
                    row[refColumn] == fkValue
                )

                IF NOT exists:
                    THROW ERROR: "FK Constraint Violation"

    RETURN True
END FUNCTION
```

**Validation Rules:**
- All FK values must exist in referenced table
- PK values must be unique
- Cannot insert duplicate PK values

### 3. Cardinality Detection Algorithm

```
FUNCTION determineCardinality(fromTable, toTable,
                              fromColumn, toColumn)
    fromData = getTable(fromTable)
    toData = getTable(toTable)

    // Count unique FK values in source table
    uniqueFKValues = Set()
    FOR EACH row in fromData.rows:
        uniqueFKValues.add(row[fromColumn])

    toRowCount = toData.rows.length

    // Determine cardinality based on ratio
    IF uniqueFKValues.size <= toRowCount / 2:
        RETURN "many-to-one"    // Many source rows point to one target
    ELSE IF uniqueFKValues.size == toRowCount:
        RETURN "one-to-one"     // Each source has unique target
    ELSE:
        RETURN "one-to-many"    // One source can have many targets
END FUNCTION
```

---

## Complex Queries

### Query 1: Get All Orders for a Customer with Products

**Scenario:** Retrieve all orders placed by customer #1 with product details

**Logic Flow:**
```
Step 1: Find customer
    SELECT * FROM Customers WHERE customer_id = 1

Step 2: Find their orders
    SELECT * FROM Orders WHERE customer_id = 1

Step 3: For each order, find order items
    SELECT * FROM OrderItems WHERE order_id IN (1001, 1002)

Step 4: For each order item, get product details
    SELECT * FROM Products WHERE product_id IN (101, 104)

Step 5: Join everything together
    Orders JOIN OrderItems JOIN Products
```

**Result Structure:**
```javascript
{
  customer_id: 1,
  name: "Alice Johnson",
  orders: [
    {
      order_id: 1001,
      order_date: "2024-03-01",
      total_amount: 1299.99,
      items: [
        {
          item_id: 10001,
          product_id: 101,
          product_name: "Laptop Pro",
          quantity: 1,
          unit_price: 1299.99
        }
      ]
    },
    {
      order_id: 1002,
      order_date: "2024-03-05",
      total_amount: 199.99,
      items: [
        {
          item_id: 10002,
          product_id: 104,
          product_name: "Wireless Earbuds",
          quantity: 1,
          unit_price: 199.99
        }
      ]
    }
  ]
}
```

### Query 2: Find All Products in a Category with Reviews

**Scenario:** Get all products in "Electronics" category with their reviews and ratings

**Logic Flow:**
```
Step 1: Find category
    SELECT * FROM Categories WHERE name = "Electronics"

Step 2: Find all products in category
    SELECT * FROM Products WHERE category_id = 1

Step 3: For each product, find reviews
    SELECT * FROM Reviews WHERE product_id IN (101, 102, 103, 104)

Step 4: Join customer info for reviews
    SELECT * FROM Customers WHERE customer_id IN (1, 2, ...)
```

**Result Structure:**
```javascript
{
  category_id: 1,
  category_name: "Electronics",
  products: [
    {
      product_id: 101,
      name: "Laptop Pro",
      price: 1299.99,
      stock: 15,
      reviews: [
        {
          review_id: 5001,
          customer_name: "Alice Johnson",
          rating: 5,
          comment: "Excellent laptop..."
        }
      ],
      averageRating: 5.0,
      totalReviews: 1
    }
  ]
}
```

### Query 3: Cascade Impact Analysis

**Scenario:** Delete Product #101 - what gets affected?

**Logic Flow:**
```
Step 1: Find product
    SELECT * FROM Products WHERE product_id = 101

Step 2: Find OrderItems with this product
    SELECT oi.* FROM OrderItems oi
    WHERE oi.product_id = 101

Step 3: From OrderItems, find Orders
    SELECT o.* FROM Orders o
    WHERE o.order_id IN (1001)

Step 4: From Orders, find Customers affected
    SELECT c.* FROM Customers c
    WHERE c.customer_id IN (1)

Step 5: Find Reviews for this product
    SELECT r.* FROM Reviews r
    WHERE r.product_id = 101

Step 6: Find related OrderItems indirectly
    OrderItems (2 rows)
    Orders (potentially 1 row)
    Reviews (1 row)
```

**Deletion Cascade:**
```
Product #101 (DELETE)
├── OrderItem #10001 (DELETE - references Product 101)
└── Review #5001 (DELETE - references Product 101)

Total Impact: 3 rows deleted
Cascade Depth: 2 levels
```

---

## Dependency Detection Logic

### Complete Dependency Detection Example

**Scenario: Delete Customer #1 (Alice Johnson)**

**Step 1: Initialize**
```
Target: Customer #1
Queue: [Customer#1]
Visited: {Customer#1}
Nodes: [{id: "Customers:1", type: "target"}]
Edges: []
```

**Step 2: Find Direct Dependents**
```
Query: Find all Orders WHERE customer_id = 1
Result: Order #1001, Order #1002

Add to Nodes:
  - {id: "Orders:1001", type: "dependent"}
  - {id: "Orders:1002", type: "dependent"}

Add to Edges:
  - {source: "Customers:1", target: "Orders:1001", type: "CRITICAL"}
  - {source: "Customers:1", target: "Orders:1002", type: "CRITICAL"}

Add to Queue: [Order#1001, Order#1002]
Visited: {Customers:1, Orders:1001, Orders:1002}
```

**Step 3: Find Order Dependents**
```
Query: Find all OrderItems WHERE order_id IN (1001, 1002)
Result: Item #10001, Item #10002

Add to Nodes:
  - {id: "OrderItems:10001", type: "dependent"}
  - {id: "OrderItems:10002", type: "dependent"}

Add to Edges:
  - {source: "Orders:1001", target: "OrderItems:10001"}
  - {source: "Orders:1002", target: "OrderItems:10002"}

Queue: [OrderItem#10001, OrderItem#10002]
Visited: {Customers:1, Orders:1001, Orders:1002, OrderItems:10001, 10002}
```

**Step 4: Find OrderItem Dependents**
```
Query: Find all rows referencing OrderItems #10001, #10002
Result: None (OrderItems is leaf node)

Queue: [] (Empty - stop traversal)
```

**Step 5: Find Reviews**
```
Query: Find all Reviews WHERE customer_id = 1
Result: Review #5001

Add to Nodes:
  - {id: "Reviews:5001", type: "dependent"}

Add to Edges:
  - {source: "Customers:1", target: "Reviews:5001"}
```

**Final Result:**

```
Graph:
{
  nodes: [
    {id: "Customers:1", label: "Customers (#1)", type: "target"},
    {id: "Orders:1001", label: "Orders (#1001)", type: "dependent"},
    {id: "Orders:1002", label: "Orders (#1002)", type: "dependent"},
    {id: "OrderItems:10001", label: "OrderItems (#10001)", type: "dependent"},
    {id: "OrderItems:10002", label: "OrderItems (#10002)", type: "dependent"},
    {id: "Reviews:5001", label: "Reviews (#5001)", type: "dependent"}
  ],
  edges: [
    {source: "Customers:1", target: "Orders:1001", type: "CRITICAL"},
    {source: "Customers:1", target: "Orders:1002", type: "CRITICAL"},
    {source: "Orders:1001", target: "OrderItems:10001", type: "CRITICAL"},
    {source: "Orders:1002", target: "OrderItems:10002", type: "CRITICAL"},
    {source: "Customers:1", target: "Reviews:5001", type: "CRITICAL"}
  ],
  statistics: {
    totalNodes: 6,
    totalEdges: 5,
    impactedTables: ["Customers", "Orders", "OrderItems", "Reviews"]
  }
}

Deletion Order:
1. Reviews #5001
2. OrderItems #10001, #10002
3. Orders #1001, #1002
4. Customers #1
```

---

## Example Scenarios

### Scenario 1: Simple One-Level Cascade

**Delete Order #1001**

```
Target: Order #1001
Dependents: OrderItem #10001

Cascade:
Order #1001 (DELETE)
└── OrderItem #10001 (DELETE)

Impact: 2 rows
Depth: 1 level
```

### Scenario 2: Multi-Level Cascade

**Delete Product #101**

```
Target: Product #101
Dependents: OrderItem #10001, Review #5001

Cascade:
Product #101 (DELETE)
├── OrderItem #10001 (DELETE)
│   └── Order #1001 (NO - has other items)
└── Review #5001 (DELETE)

Impact: 3 rows
Depth: 2 levels
```

### Scenario 3: Complex Multi-Branch Cascade

**Delete Category #1 (Electronics)**

```
Target: Category #1
Dependents: Products #101, #102, #103, #104

Cascade:
Category #1 (DELETE)
├── Product #101 (DELETE)
│   ├── OrderItem #10001 (DELETE)
│   ├── OrderItem #10003 (DELETE)
│   ├── Review #5001 (DELETE)
│   └── ...
├── Product #102 (DELETE)
│   ├── OrderItem #10003 (from Order #1003)
│   └── Review #5002 (DELETE)
└── ...

Impact: 15+ rows across 5 tables
Depth: 3-4 levels
```

---

## API Reference

### Table Management

#### POST /api/tables
**Create a new table**

```javascript
Request:
{
  "tableName": "Customers",
  "columns": [
    {
      "name": "customer_id",
      "dataType": "integer",
      "isPrimaryKey": true
    },
    {
      "name": "email",
      "dataType": "text",
      "isPrimaryKey": false
    }
  ]
}

Response:
{
  "success": true,
  "message": "Table Customers created successfully",
  "table": {
    "tableName": "Customers",
    "columns": [...]
  }
}
```

#### GET /api/tables
**Get all tables**

```javascript
Response:
{
  "tables": {
    "Customers": {
      "metadata": {
        "columns": [...]
      },
      "rows": [...]
    }
  },
  "schemas": [...],
  "total": 1
}
```

### Data Management

#### POST /api/tables/:tableName/rows
**Insert a row**

```javascript
Request:
{
  "data": {
    "customer_id": 1,
    "email": "alice@example.com"
  }
}

Response:
{
  "success": true,
  "message": "Row inserted",
  "row": {
    "_id": 1,
    "customer_id": 1,
    "email": "alice@example.com"
  }
}
```

#### POST /api/simulate-deletion
**Analyze deletion impact**

```javascript
Request:
{
  "tableName": "Customers",
  "pkValue": 1
}

Response:
{
  "success": true,
  "graph": {
    "nodes": [...],
    "edges": [...],
    "targetNode": "Customers:1",
    "statistics": {
      "totalNodes": 6,
      "totalEdges": 5,
      "impactedTables": ["Customers", "Orders", ...]
    }
  }
}
```

#### GET /api/relationships
**Analyze all relationships**

```javascript
Response:
{
  "success": true,
  "relationships": {
    "oneToMany": [
      {
        "from": {"table": "Customers", "column": "customer_id"},
        "to": {"table": "Orders", "column": "customer_id"},
        "cardinality": "one-to-many"
      }
    ],
    "manyToOne": [...],
    "oneToOne": [...]
  },
  "totalRelationships": 6
}
```

---

## Key Concepts

### 1. Foreign Key (FK)

Links records between tables while maintaining referential integrity.

```javascript
// Products table has FK pointing to Categories
{
  name: "category_id",
  isForeignKey: true,
  referencedTable: "Categories",
  referencedColumn: "category_id"
}

// Creates constraint:
// Every Product.category_id MUST exist in Categories.category_id
```

### 2. Primary Key (PK)

Uniquely identifies each row in a table.

```javascript
{
  name: "customer_id",
  isPrimaryKey: true
}

// Constraint:
// Each customer_id must be unique
// No NULL values allowed
```

### 3. Cascade Deletion

When parent row is deleted, child rows depending on it are also deleted.

```
Parent (Customer #1) DELETED
    ↓
Child (Order #1001) CASCADE DELETED
    ↓
Grandchild (OrderItem #10001) CASCADE DELETED
```

### 4. Referential Integrity

Ensures consistency between related tables.

```javascript
Rule: Cannot insert Order with customer_id = 999
      unless Customer #999 exists

Action: System throws FK constraint error
```

### 5. Cardinality

Describes relationship type between entities:

- **1:1** (One-to-One): One parent, one child
- **1:N** (One-to-Many): One parent, many children
- **N:1** (Many-to-One): Many parents, one child
- **N:M** (Many-to-Many): Many parents, many children

---

## Data Integrity Rules

### Rules Enforced

1. **Primary Key Uniqueness**
   - No duplicate PK values
   - No NULL PK values

2. **Foreign Key Constraint**
   - FK values must exist in referenced table
   - Or be NULL (optional FK)

3. **Data Type Validation**
   - Integer values in integer columns
   - Text values in text columns
   - Proper date formatting

4. **Cascade Deletion**
   - Child rows deleted when parent deleted
   - All levels cascade (grandchildren, etc.)

---

## Performance Characteristics

### Storage Complexity
- **Memory Usage**: O(R × C)
  - R = total number of rows
  - C = average columns per row

### Query Complexity
- **Dependency Detection**: O(V + E)
  - V = vertices (rows)
  - E = edges (relationships)

- **FK Validation**: O(N)
  - N = number of FK columns

- **Cardinality Detection**: O(R)
  - R = rows in table

### Graph Rendering
- **Node Creation**: O(D)
  - D = cascade depth
- **Edge Creation**: O(D × B)
  - B = average branching factor

---

## Limitations & Future Enhancements

### Current Limitations

- ✗ No persistent storage (in-memory only)
- ✗ No authentication/authorization
- ✗ No transaction support
- ✗ Limited data type validation
- ✗ No constraints beyond FK/PK
- ✗ Single user only

### Planned Enhancements

- ✓ SQLite persistent storage
- ✓ Multi-user support with authentication
- ✓ Transaction support (ACID)
- ✓ Additional constraints (UNIQUE, CHECK)
- ✓ Stored procedures/triggers
- ✓ Query builder UI
- ✓ Data backup/export
- ✓ Real-time collaboration

---

## Conclusion

The Data Dependency Tracker provides a powerful, visual way to understand and analyze data relationships without writing a single SQL query. By combining dynamic table creation, automatic FK validation, and intelligent dependency detection algorithms, it enables users to safely explore the impact of data modifications.

The system's architecture cleanly separates concerns between frontend UI, backend API, and business logic, making it maintainable and extensible for future enhancements.

