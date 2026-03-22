# 📊 Data Dependency Tracker with Deletion Impact Visualizer

A complete full-stack web application that allows users to create relational data structures, manually insert data, and visualize the impact of deleting records with cascading dependencies.

## ✨ Features

- **Dynamic Table Creation**: Create tables with custom columns, data types, and define primary/foreign keys
- **Manual Data Entry**: Insert rows into tables with automatic validation of foreign key constraints
- **Relationship Analysis**: Automatically detect and display one-to-many, many-to-one, and one-to-one relationships
- **Deletion Simulation**: Simulate deletion of any row and see all cascading impacts
- **Interactive Graph Visualization**: Cytoscape.js powered graph showing:
  - Target row (red)
  - Dependent rows (orange)
  - Critical dependencies (red edges)
  - Normal dependencies (dashed yellow edges)
- **Cascade Analysis**: View the step-by-step deletion order required to maintain referential integrity
- **Real-time UI**: Modern, responsive interface with tab-based navigation

## 🏗️ Architecture

### Frontend (React + Cytoscape.js)
```
frontend/
├── src/
│   ├── components/
│   │   ├── TableBuilder.jsx       # Create tables and schema
│   │   ├── DataEntry.jsx          # Insert and manage rows
│   │   ├── Simulator.jsx          # Simulate deletion
│   │   ├── GraphView.jsx          # Cytoscape.js visualization
│   │   └── RelationshipManager.jsx # Show relationships
│   ├── styles/
│   │   ├── app.css               # Global styles
│   │   └── components.css        # Component styles
│   ├── api.js                    # API client
│   ├── App.jsx                   # Main app component
│   └── main.jsx                  # Entry point
├── index.html
├── vite.config.js
└── package.json
```

### Backend (Node.js + Express)
```
backend/
├── index.js                   # Express server & API endpoints
├── storage.js                 # In-memory data storage
├── dependencyEngine.js        # Dependency detection (DFS/BFS)
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm installed
- Git (optional)

### Installation

1. **Navigate to the project directory**:
```bash
cd c:\dbs_harshi\data-dependency-tracker
```

2. **Install Backend Dependencies**:
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**:
```bash
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Start Backend Server** (from `backend` directory):
```bash
npm start
```
The backend will start at `http://localhost:5000`

**Terminal 2 - Start Frontend** (from `frontend` directory):
```bash
npm run dev
```
The frontend will start at `http://localhost:3000`

The app will automatically open in your browser!

## 📖 Usage Guide

### 1. Create Tables

1. Go to **"📊 Table Builder"** tab
2. Enter a table name (e.g., "users")
3. Add columns:
   - **Column Name**: Name of the column
   - **Data Type**: text, number, integer, date, boolean
   - **Primary Key**: Mark one column as PRIMARY KEY
   - **Foreign Key**: Optional - link to another table's primary key
4. Click **"✓ Create Table"**

**Example Tables to Create**:

**Table 1: Categories**
- `category_id` (PK, integer)
- `name` (text)

**Table 2: Products**
- `product_id` (PK, integer)
- `category_id` (FK → Categories.category_id)
- `name` (text)
- `price` (number)

**Table 3: Orders**
- `order_id` (PK, integer)
- `product_id` (FK → Products.product_id)
- `customer_name` (text)
- `quantity` (integer)

### 2. View Relationships

1. Go to **"🔗 Relationships"** tab
2. See all defined relationships and their cardinality
3. Understand how tables are connected

### 3. Insert Data

1. Go to **"📝 Data Entry"** tab
2. Select a table from dropdown
3. Fill in column values:
   - For FK fields, enter a valid PK value from the referenced table
   - System will validate foreign key constraints
4. Click **"➕ Insert Row"**
5. View existing data in the table below

**Example Data to Insert**:

**Categories**:
- category_id: 1, name: "Electronics"
- category_id: 2, name: "Books"

**Products**:
- product_id: 101, category_id: 1, name: "Laptop", price: 999.99
- product_id: 102, category_id: 1, name: "Phone", price: 599.99
- product_id: 201, category_id: 2, name: "Python Guide", price: 49.99

**Orders**:
- order_id: 1001, product_id: 101, customer_name: "Alice", quantity: 1
- order_id: 1002, product_id: 101, customer_name: "Bob", quantity: 2
- order_id: 1003, product_id: 102, customer_name: "Charlie", quantity: 1
- order_id: 1004, product_id: 201, customer_name: "Alice", quantity: 3

### 4. Simulate Deletion Impact

1. Go to **"⚙️ Simulator"** tab
2. Select a table (e.g., "Products")
3. Choose a specific row to delete (e.g., Product ID 101)
4. Click **"🔍 Simulate Delete"**
5. System will:
   - Show cascade deletion order (which rows must be deleted)
   - Display count of affected rows
   - Generate dependency graph

**Cascade Deletion Example**:
If you delete Product #101:
- Step 1: Delete Order #1001 (references Product 101)
- Step 2: Delete Order #1002 (references Product 101)
- Step 3: Delete Product #101 (the target)

### 5. Analyze Graph Visualization

1. After simulation, go to **"📈 Graph"** tab
2. **Red Node**: The row being deleted (target)
3. **Orange Nodes**: Rows that depend on target deletion
4. **Red Edges**: Critical dependencies (will cascade)
5. **Dashed Yellow Edges**: Normal references (for information)
6. Toggle **"Show Only Critical Dependencies"** to filter

### 6. Export & Clear

- **Refresh**: Button at top-right to reload all data
- **Clear All**: Button at top-right to reset everything

## 🔧 API Endpoints

### Tables
- `POST /api/tables` - Create table
- `GET /api/tables` - Get all tables
- `GET /api/tables/:tableName` - Get specific table

### Data
- `POST /api/tables/:tableName/rows` - Insert row
- `GET /api/tables/:tableName/rows` - Get all rows
- `DELETE /api/tables/:tableName/rows/:pkValue` - Delete row

### Analysis
- `POST /api/simulate-deletion` - Analyze deletion impact
- `GET /api/relationships` - Get all relationships
- `POST /api/cascade-order` - Get deletion order

### Utility
- `GET /api/health` - Server health check
- `POST /api/clear` - Clear all data

## 🎨 Technology Stack

### Frontend
- **React 18**: UI library
- **Cytoscape.js**: Interactive graph visualization
- **Axios**: HTTP client
- **Vite**: Build tool
- **CSS3**: Styling with gradients and animations

### Backend
- **Node.js**: Runtime
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **UUID**: ID generation

### Architecture
- **In-Memory Storage**: Fast, no database setup needed
- **DFS/BFS Algorithm**: Efficient dependency traversal
- **RESTful API**: Standard HTTP endpoints

## 🔍 How Dependency Detection Works

The dependency engine uses a **Breadth-First Search (BFS)** algorithm:

1. **Mark target row** to be deleted
2. **Find all incoming foreign keys** - which tables reference this row
3. **Traverse each dependent row** - recursively find what depends on those rows
4. **Build graph** with nodes (rows) and edges (relationships)
5. **Classify edges** as CRITICAL (cascade) or NORMAL (reference)

**Example Algorithm Flow**:
```
Delete Product #101
  ↓
Find rows with product_id = 101
  ↓
Found: Order #1001, Order #1002
  ↓
Add edges: Product 101 → Order 1001, Order 1002
  ↓
Check if Orders have dependents
  ↓
No more dependents
  ↓
Return graph with 3 nodes, 2 edges
```

## 📊 Graph Styling Rules

| Element | Color | Style | Meaning |
|---------|-------|-------|---------|
| Target Node | Red | Solid | Row being deleted |
| Dependent Node | Orange | Solid | Affected rows |
| Critical Edge | Red | Solid | Cascade dependency |
| Normal Edge | Yellow | Dashed | Reference only |

## 🧪 Example Scenario

### Setup
```
Create 3 tables:
1. Categories (category_id PK, name)
2. Products (product_id PK, category_id FK, name, price)
3. Orders (order_id PK, product_id FK, customer_name, quantity)
```

### Data
```
Categories: 1, 2
Products: 101→1, 102→1, 201→2
Orders: 1001→101, 1002→101, 1003→102, 1004→201
```

### Simulation: Delete Product #101
```
Result:
- Target: Product #101 (RED)
- Dependents: Order #1001, Order #1002 (ORANGE)
- Cascade Delete Order:
  1. Delete Order #1001
  2. Delete Order #1002
  3. Delete Product #101
- Total Impact: 3 rows
```

## 🚀 Deployment

### Cloudflare Pages (Frontend)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Cloudflare Pages
```

### Cloudflare Workers (Backend - Optional)
The backend can be converted to Cloudflare Workers:
1. Install `wrangler`
2. Create Cloudflare Worker project
3. Migrate Express routes to Worker handlers
4. Use Cloudflare D1 for persistent storage

## 📝 Notes

- **No SQL Required**: All operations are through the UI
- **In-Memory Storage**: Data persists during session, clears on server restart
- **Validation**: Foreign key constraints validated on insert
- **Real-time**: Updates immediately reflected in UI
- **Responsive**: Works on desktop and tablet devices

## 🐛 Troubleshooting

### Cannot connect to backend
- Ensure backend is running: `npm start` in backend folder
- Check backend is on port 5000
- Verify CORS is enabled

### Foreign key validation fails
- Ensure the referenced row exists in the target table
- Check primary key value is typed correctly
- Verify foreign key points to correct table/column

### Graph not displaying
- Run simulation first (it generates the graph data)
- Check browser console for errors
- Ensure Cytoscape.js is loaded

### Cascade order seems wrong
- Cascade follows BFS traversal
- Multiple rows at same level process simultaneously
- Order within a level is non-deterministic

## 📄 License

This project is open source for educational and commercial use.

## 👨‍💻 Development

To extend the application:

1. **Add new components**: Create in `frontend/src/components/`
2. **Add API endpoints**: Extend `backend/index.js`
3. **Modify storage**: Edit `backend/storage.js`
4. **Update styles**: Modify CSS files in `frontend/src/styles/`

## 💡 Future Enhancements

- [ ] SQLite persistent storage
- [ ] User authentication
- [ ] Export/import data
- [ ] Custom cascade rules
- [ ] Undo/redo functionality
- [ ] Graph animation improvements
- [ ] Dark mode theme
- [ ] Data validation rules
- [ ] Audit logging
- [ ] Multi-user support

---

**Created with ❤️ for data management and visualization**
