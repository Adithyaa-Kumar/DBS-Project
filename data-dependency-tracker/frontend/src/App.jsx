/**
 * Main App Component
 * Orchestrates all components and manages global state
 */

import React, { useState, useEffect } from 'react';
import TableBuilder from './components/TableBuilder';
import DataEntry from './components/DataEntry';
import GraphView from './components/GraphView';
import Simulator from './components/Simulator';
import RelationshipManager from './components/RelationshipManager';
import QueryBuilder from './components/QueryBuilder';
import API from './api';
import './styles/app.css';

function App() {
  const [tables, setTables] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check server health on mount
  useEffect(() => {
    checkServerHealth();
    loadTables();
  }, []);

  const checkServerHealth = async () => {
    try {
      await API.healthCheck();
    } catch (err) {
      setError(
        'Cannot connect to backend server. Make sure it is running on http://localhost:5000'
      );
    }
  };

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await API.getAllTables();
      setTables(response.data);
      setError('');
    } catch (err) {
      // Don't show error if server is not running, just set empty state
      setTables({ tables: {}, schemas: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleTableCreated = async () => {
    // Reload tables after creation
    await loadTables();
  };

  const handleDataInserted = async () => {
    // Reload tables after insertion
    await loadTables();
  };

  const handleSimulation = (data) => {
    setGraphData(data);
    setActiveTab('graph');
  };

  const handleClearData = async () => {
    if (window.confirm('This will clear all tables and data. Are you sure?')) {
      try {
        await API.clearAllData();
        setTables({ tables: {}, schemas: [] });
        setGraphData(null);
        setActiveTab('builder');
      } catch (err) {
        setError('Failed to clear data');
      }
    }
  };

  const handleLoadDemoData = async () => {
    try {
      // Create sample tables and data using existing API endpoints

      // Create Customers table
      await API.createTable('Customers', [
        { name: 'customer_id', dataType: 'integer', isPrimaryKey: true },
        { name: 'name', dataType: 'text' },
        { name: 'email', dataType: 'text' },
        { name: 'country', dataType: 'text' }
      ]);

      // Create Categories table
      await API.createTable('Categories', [
        { name: 'category_id', dataType: 'integer', isPrimaryKey: true },
        { name: 'name', dataType: 'text' },
        { name: 'description', dataType: 'text' }
      ]);

      // Create Products table
      await API.createTable('Products', [
        { name: 'product_id', dataType: 'integer', isPrimaryKey: true },
        { name: 'category_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Categories', referencedColumn: 'category_id' },
        { name: 'name', dataType: 'text' },
        { name: 'price', dataType: 'number' },
        { name: 'stock', dataType: 'integer' }
      ]);

      // Create Orders table
      await API.createTable('Orders', [
        { name: 'order_id', dataType: 'integer', isPrimaryKey: true },
        { name: 'customer_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Customers', referencedColumn: 'customer_id' },
        { name: 'order_date', dataType: 'date' },
        { name: 'total_amount', dataType: 'number' },
        { name: 'status', dataType: 'text' }
      ]);

      // Create OrderItems table
      await API.createTable('OrderItems', [
        { name: 'item_id', dataType: 'integer', isPrimaryKey: true },
        { name: 'order_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Orders', referencedColumn: 'order_id' },
        { name: 'product_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Products', referencedColumn: 'product_id' },
        { name: 'quantity', dataType: 'integer' },
        { name: 'unit_price', dataType: 'number' }
      ]);

      // Create Reviews table
      await API.createTable('Reviews', [
        { name: 'review_id', dataType: 'integer', isPrimaryKey: true },
        { name: 'product_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Products', referencedColumn: 'product_id' },
        { name: 'customer_id', dataType: 'integer', isForeignKey: true, referencedTable: 'Customers', referencedColumn: 'customer_id' },
        { name: 'rating', dataType: 'integer' },
        { name: 'comment', dataType: 'text' }
      ]);

      // Insert Customers
      await API.insertRow('Customers', { customer_id: 1, name: 'Alice Johnson', email: 'alice@example.com', country: 'USA' });
      await API.insertRow('Customers', { customer_id: 2, name: 'Bob Smith', email: 'bob@example.com', country: 'UK' });
      await API.insertRow('Customers', { customer_id: 3, name: 'Charlie Brown', email: 'charlie@example.com', country: 'Canada' });
      await API.insertRow('Customers', { customer_id: 4, name: 'Diana Prince', email: 'diana@example.com', country: 'USA' });
      await API.insertRow('Customers', { customer_id: 5, name: 'Eve Taylor', email: 'eve@example.com', country: 'Australia' });

      // Insert Categories
      await API.insertRow('Categories', { category_id: 1, name: 'Electronics', description: 'Electronic devices and gadgets' });
      await API.insertRow('Categories', { category_id: 2, name: 'Books', description: 'Physical and digital books' });
      await API.insertRow('Categories', { category_id: 3, name: 'Furniture', description: 'Home and office furniture' });
      await API.insertRow('Categories', { category_id: 4, name: 'Clothing', description: 'Fashion and apparel' });

      // Insert Products
      await API.insertRow('Products', { product_id: 101, category_id: 1, name: 'Laptop Pro', price: 1299.99, stock: 15 });
      await API.insertRow('Products', { product_id: 102, category_id: 1, name: 'Smartphone X', price: 799.99, stock: 28 });
      await API.insertRow('Products', { product_id: 103, category_id: 1, name: 'Tablet Ultra', price: 499.99, stock: 42 });
      await API.insertRow('Products', { product_id: 104, category_id: 1, name: 'Wireless Earbuds', price: 199.99, stock: 89 });
      await API.insertRow('Products', { product_id: 201, category_id: 2, name: 'Python Guide', price: 49.99, stock: 156 });
      await API.insertRow('Products', { product_id: 202, category_id: 2, name: 'JavaScript Book', price: 39.99, stock: 203 });
      await API.insertRow('Products', { product_id: 203, category_id: 2, name: 'React Tutorial', price: 54.99, stock: 87 });
      await API.insertRow('Products', { product_id: 301, category_id: 3, name: 'Office Chair', price: 249.99, stock: 12 });
      await API.insertRow('Products', { product_id: 302, category_id: 3, name: 'Standing Desk', price: 399.99, stock: 8 });
      await API.insertRow('Products', { product_id: 401, category_id: 4, name: 'Cotton T-Shirt', price: 29.99, stock: 145 });
      await API.insertRow('Products', { product_id: 402, category_id: 4, name: 'Jeans', price: 79.99, stock: 67 });

      // Insert Orders
      await API.insertRow('Orders', { order_id: 1001, customer_id: 1, order_date: '2024-03-01', total_amount: 1299.99, status: 'Delivered' });
      await API.insertRow('Orders', { order_id: 1002, customer_id: 1, order_date: '2024-03-05', total_amount: 199.99, status: 'Delivered' });
      await API.insertRow('Orders', { order_id: 1003, customer_id: 2, order_date: '2024-03-08', total_amount: 2099.98, status: 'Processing' });
      await API.insertRow('Orders', { order_id: 1004, customer_id: 2, order_date: '2024-03-12', total_amount: 499.99, status: 'Shipped' });
      await API.insertRow('Orders', { order_id: 1005, customer_id: 3, order_date: '2024-03-15', total_amount: 249.95, status: 'Delivered' });
      await API.insertRow('Orders', { order_id: 1006, customer_id: 4, order_date: '2024-03-18', total_amount: 879.98, status: 'Processing' });
      await API.insertRow('Orders', { order_id: 1007, customer_id: 5, order_date: '2024-03-20', total_amount: 999.96, status: 'Pending' });

      // Insert OrderItems
      await API.insertRow('OrderItems', { item_id: 10001, order_id: 1001, product_id: 101, quantity: 1, unit_price: 1299.99 });
      await API.insertRow('OrderItems', { item_id: 10002, order_id: 1002, product_id: 104, quantity: 1, unit_price: 199.99 });
      await API.insertRow('OrderItems', { item_id: 10003, order_id: 1003, product_id: 102, quantity: 2, unit_price: 799.99 });
      await API.insertRow('OrderItems', { item_id: 10004, order_id: 1003, product_id: 104, quantity: 1, unit_price: 199.99 });
      await API.insertRow('OrderItems', { item_id: 10005, order_id: 1004, product_id: 103, quantity: 1, unit_price: 499.99 });
      await API.insertRow('OrderItems', { item_id: 10006, order_id: 1005, product_id: 201, quantity: 5, unit_price: 49.99 });
      await API.insertRow('OrderItems', { item_id: 10007, order_id: 1006, product_id: 301, quantity: 2, unit_price: 249.99 });
      await API.insertRow('OrderItems', { item_id: 10008, order_id: 1006, product_id: 302, quantity: 1, unit_price: 399.99 });
      await API.insertRow('OrderItems', { item_id: 10009, order_id: 1007, product_id: 401, quantity: 4, unit_price: 29.99 });
      await API.insertRow('OrderItems', { item_id: 10010, order_id: 1007, product_id: 402, quantity: 2, unit_price: 79.99 });

      // Insert Reviews
      await API.insertRow('Reviews', { review_id: 5001, product_id: 101, customer_id: 1, rating: 5, comment: 'Excellent laptop, fast and reliable!' });
      await API.insertRow('Reviews', { review_id: 5002, product_id: 102, customer_id: 2, rating: 4, comment: 'Great phone, good value for money' });
      await API.insertRow('Reviews', { review_id: 5003, product_id: 201, customer_id: 3, rating: 5, comment: 'Best Python book I have read' });
      await API.insertRow('Reviews', { review_id: 5004, product_id: 301, customer_id: 4, rating: 4, comment: 'Comfortable chair for work' });
      await API.insertRow('Reviews', { review_id: 5005, product_id: 401, customer_id: 5, rating: 3, comment: 'Good quality, fits well' });

      // Reload and navigate to simulator
      setError('');
      await loadTables();
      setActiveTab('simulator');

      alert('✅ Demo data loaded successfully!\n\n📦 Tables created:\n  • Customers (5 users)\n  • Categories (4 types)\n  • Products (11 items)\n  • Orders (7 orders)\n  • OrderItems (10 items)\n  • Reviews (5 reviews)\n\n🔗 Relationships:\n  • Orders → Customers\n  • OrderItems → Orders & Products\n  • Reviews → Products & Customers\n\n🎯 Try these simulations:\n  1. Delete Customer #1 → See 3 orders cascade\n  2. Delete Product #101 → See reviews + order items\n  3. Delete Order #1003 → See order items cascade');
    } catch (err) {
      setError('Failed to load demo data: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>📊 Data Dependency Tracker</h1>
          <p>Visualize deletion impact with real-time dependency analysis</p>
        </div>
        <div className="header-actions">
          <button onClick={handleLoadDemoData} className="btn btn-primary" style={{ background: '#27ae60' }}>
            📦 Load Demo Data
          </button>
          <button onClick={loadTables} className="btn btn-secondary">
            🔄 Refresh
          </button>
          <button onClick={handleClearData} className="btn btn-warning">
            🗑️ Clear All
          </button>
        </div>
      </header>

      {error && (
        <div className="app-error">
          <strong>⚠️ Error:</strong> {error}
          <button onClick={() => setError('')} className="btn-close">✕</button>
        </div>
      )}

      <nav className="app-navigation">
        <button
          className={`nav-button ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          📊 Table Builder
        </button>
        <button
          className={`nav-button ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          📝 Data Entry
        </button>
        <button
          className={`nav-button ${activeTab === 'relationships' ? 'active' : ''}`}
          onClick={() => setActiveTab('relationships')}
        >
          🔗 Relationships
        </button>
        <button
          className={`nav-button ${activeTab === 'query' ? 'active' : ''}`}
          onClick={() => setActiveTab('query')}
        >
          🔍 Query Builder
        </button>
        <button
          className={`nav-button ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          ⚙️ Simulator
        </button>
        <button
          className={`nav-button ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          📈 Graph
        </button>
      </nav>

      <main className="app-main">
        {loading ? (
          <div className="loading-state">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'builder' && (
              <div className="tab-content">
                <TableBuilder onTableCreated={handleTableCreated} tables={tables} />
              </div>
            )}

            {activeTab === 'data' && (
              <div className="tab-content">
                <DataEntry tables={tables} onDataInserted={handleDataInserted} />
              </div>
            )}

            {activeTab === 'relationships' && (
              <div className="tab-content">
                <RelationshipManager />
              </div>
            )}

            {activeTab === 'query' && (
              <div className="tab-content">
                <QueryBuilder />
              </div>
            )}

            {activeTab === 'simulator' && (
              <div className="tab-content">
                <Simulator tables={tables} onSimulation={handleSimulation} />
              </div>
            )}

            {activeTab === 'graph' && (
              <div className="tab-content">
                <GraphView graphData={graphData} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Data Dependency Tracker with Deletion Impact Visualizer |
          Built with React & Cytoscape.js
        </p>
      </footer>
    </div>
  );
}

export default App;
