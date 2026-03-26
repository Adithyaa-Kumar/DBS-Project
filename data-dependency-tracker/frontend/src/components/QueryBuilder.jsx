import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QueryBuilder = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('join');

  // Join Query State
  const [joinType, setJoinType] = useState('inner');
  const [leftTable, setLeftTable] = useState('Products');
  const [rightTable, setRightTable] = useState('Categories');
  const [leftColumn, setLeftColumn] = useState('category_id');
  const [rightColumn, setRightColumn] = useState('category_id');

  // Complex Query State
  const [fromTable, setFromTable] = useState('Products');
  const [whereClause, setWhereClause] = useState('');
  const [orderByColumn, setOrderByColumn] = useState('');
  const [orderByOrder, setOrderByOrder] = useState('ASC');

  // Get API base URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://ddt-backend-worker.dbsproject.workers.dev/api';

  // Load tables on component mount
  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setError(null);
    try {
      console.log(`[QueryBuilder] Fetching tables from: ${API_URL}/tables`);
      
      const response = await axios.get(`${API_URL}/tables`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('[QueryBuilder] API Response:', response.data);

      // Extract table names from the response
      let tableNames = [];
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.tables) {
          // If tables is an object, get its keys
          tableNames = typeof response.data.tables === 'object' 
            ? Object.keys(response.data.tables) 
            : [];
        } else if (Array.isArray(response.data)) {
          // If response is an array, map table names
          tableNames = response.data.map(t => t.name || t.tableName || t);
        } else {
          // Try to extract table names directly
          tableNames = Object.keys(response.data).filter(key => key !== 'status' && key !== 'success');
        }
      }

      console.log('[QueryBuilder] Extracted table names:', tableNames);

      if (tableNames.length === 0) {
        setError('No tables found in database. Response: ' + JSON.stringify(response.data).substring(0, 100));
        setTables([]);
      } else {
        setTables(tableNames);
        console.log('[QueryBuilder] Tables loaded successfully:', tableNames);
      }
    } catch (err) {
      console.error('[QueryBuilder] Error loading tables:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });

      setError(`Failed to load tables: ${err.message}`);
      setTables([]);
    }
  };

  // Execute Join Query
  const executeJoin = async () => {
    if (!leftTable || !rightTable || !leftColumn || !rightColumn) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('[QueryBuilder] Executing join query:', {
        type: joinType,
        leftTable,
        rightTable,
        leftColumn,
        rightColumn
      });

      const response = await axios.post(`${API_URL}/query/join`, {
        type: joinType,
        leftTable,
        rightTable,
        leftColumn,
        rightColumn
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('[QueryBuilder] Join query result:', response.data);

      const resultData = response.data.result || response.data.data || [];
      setResult({
        type: 'join',
        query: `${joinType.toUpperCase()} JOIN ${leftTable} ${rightTable} ON ${leftTable}.${leftColumn} = ${rightTable}.${rightColumn}`,
        data: resultData,
        count: resultData.length
      });
    } catch (err) {
      console.error('[QueryBuilder] Join query error:', err);
      setError(`Join query failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Execute Complex Query
  const executeComplex = async () => {
    if (!fromTable) {
      setError('Please select a table to query from');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        from: fromTable,
        where: [],
        orderBy: null
      };

      // Parse where condition
      if (whereClause && whereClause.trim()) {
        const match = whereClause.match(/(\w+)\s*(>|<|=|!=|>=|<=|LIKE|IN)\s*(.+)/i);
        if (match) {
          payload.where = [{
            column: match[1],
            operator: match[2],
            value: isNaN(match[3]) ? match[3].replace(/'/g, '').trim() : Number(match[3])
          }];
        }
      }

      // Add order by
      if (orderByColumn && orderByColumn.trim()) {
        payload.orderBy = {
          column: orderByColumn,
          order: orderByOrder
        };
      }

      console.log('[QueryBuilder] Executing complex query:', payload);

      const response = await axios.post(`${API_URL}/query/complex`, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('[QueryBuilder] Complex query result:', response.data);

      const resultData = response.data.result || response.data.data || [];
      setResult({
        type: 'complex',
        query: `SELECT * FROM ${fromTable}${payload.where.length > 0 ? ' WHERE ' + whereClause : ''}${payload.orderBy ? ' ORDER BY ' + payload.orderBy.column + ' ' + payload.orderBy.order : ''}`,
        data: resultData,
        count: resultData.length
      });
    } catch (err) {
      console.error('[QueryBuilder] Complex query error:', err);
      setError(`Complex query failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Quick examples
  const runJoinExample = () => {
    setLeftTable('Products');
    setRightTable('Categories');
    setLeftColumn('category_id');
    setRightColumn('category_id');
    setJoinType('inner');
    setTimeout(() => executeJoin(), 100);
  };

  const runJoinExample2 = () => {
    setLeftTable('Orders');
    setRightTable('Products');
    setLeftColumn('product_id');
    setRightColumn('product_id');
    setJoinType('inner');
    setTimeout(() => executeJoin(), 100);
  };

  const runComplexExample1 = () => {
    setFromTable('Products');
    setWhereClause('price > 100');
    setOrderByColumn('price');
    setOrderByOrder('DESC');
    setTimeout(() => executeComplex(), 100);
  };

  const runComplexExample2 = () => {
    setFromTable('Orders');
    setWhereClause('');
    setOrderByColumn('order_id');
    setOrderByOrder('DESC');
    setTimeout(() => executeComplex(), 100);
  };

  // Results Component
  const ResultsTable = () => {
    if (!result || !result.data || result.data.length === 0) {
      return <div className="info-message">No results found</div>;
    }

    const columns = Object.keys(result.data[0]);

    return (
      <div className="results-container">
        <h3>Results ({result.count} rows)</h3>
        <p className="query-text"><strong>Query:</strong> {result.query}</p>
        <div className="table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.slice(0, 50).map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={`${idx}-${col}`}>{row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.data.length > 50 && <p className="info">Showing first 50 of {result.count} rows</p>}
      </div>
    );
  };

  if (tables.length === 0 && !error) {
    return (
      <div className="query-builder">
        <div className="query-header">
          <h2>📊 Query Builder</h2>
          <p className="subtitle">Loading database connection...</p>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Connecting to database...</p>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>API URL: {API_URL}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="query-builder">
      <div className="query-header">
        <h2>📊 Query Builder</h2>
        <p className="subtitle">Execute JOIN and Complex queries on your database</p>
        {tables.length > 0 && <p className="db-info">Available Tables: {tables.join(', ')}</p>}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            🔗 JOIN Queries
          </button>
          <button
            className={`tab ${activeTab === 'complex' ? 'active' : ''}`}
            onClick={() => setActiveTab('complex')}
          >
            🔍 Complex Queries
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>⚠️ Error:</strong> {error}
          <button className="btn-retry" onClick={loadTables}>Retry Connection</button>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="error-message">
          <p>No tables available. Check your database connection.</p>
        </div>
      ) : (
        <>
          {/* JOIN QUERY TAB */}
          {activeTab === 'join' && (
            <div className="tab-content">
              <div className="form-card">
                <h3>JOIN Query Builder</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Join Type</label>
                    <select value={joinType} onChange={(e) => setJoinType(e.target.value)}>
                      <option value="inner">INNER JOIN</option>
                      <option value="left">LEFT JOIN</option>
                      <option value="right">RIGHT JOIN</option>
                      <option value="full">FULL OUTER JOIN</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Left Table</label>
                    <select value={leftTable} onChange={(e) => setLeftTable(e.target.value)}>
                      {tables.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Left Column</label>
                    <input
                      type="text"
                      value={leftColumn}
                      onChange={(e) => setLeftColumn(e.target.value)}
                      placeholder="e.g., category_id"
                    />
                  </div>

                  <div className="form-group">
                    <label>Right Table</label>
                    <select value={rightTable} onChange={(e) => setRightTable(e.target.value)}>
                      {tables.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Right Column</label>
                    <input
                      type="text"
                      value={rightColumn}
                      onChange={(e) => setRightColumn(e.target.value)}
                      placeholder="e.g., category_id"
                    />
                  </div>
                </div>

                <div className="button-group">
                  <button
                    className="btn btn-primary"
                    onClick={executeJoin}
                    disabled={loading}
                  >
                    {loading ? '⏳ Executing...' : '▶ Execute JOIN'}
                  </button>
                </div>
              </div>

              <div className="examples-card">
                <h4>Quick Examples</h4>
                <button className="btn btn-secondary" onClick={runJoinExample} disabled={loading}>
                  Products ⨝ Categories
                </button>
                <button className="btn btn-secondary" onClick={runJoinExample2} disabled={loading}>
                  Orders ⨝ Products
                </button>
              </div>
            </div>
          )}

          {/* COMPLEX QUERY TAB */}
          {activeTab === 'complex' && (
            <div className="tab-content">
              <div className="form-card">
                <h3>Complex Query Builder</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>From Table *</label>
                    <select value={fromTable} onChange={(e) => setFromTable(e.target.value)}>
                      {tables.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Where Clause (Optional)</label>
                    <input
                      type="text"
                      value={whereClause}
                      onChange={(e) => setWhereClause(e.target.value)}
                      placeholder="e.g., price > 100"
                    />
                    <small>Format: column operator value (e.g., price &gt; 100, name = Electronics)</small>
                  </div>

                  <div className="form-group">
                    <label>Order By Column (Optional)</label>
                    <input
                      type="text"
                      value={orderByColumn}
                      onChange={(e) => setOrderByColumn(e.target.value)}
                      placeholder="Column name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Sort Order</label>
                    <select value={orderByOrder} onChange={(e) => setOrderByOrder(e.target.value)}>
                      <option value="ASC">Ascending ↑</option>
                      <option value="DESC">Descending ↓</option>
                    </select>
                  </div>
                </div>

                <div className="button-group">
                  <button
                    className="btn btn-primary"
                    onClick={executeComplex}
                    disabled={loading}
                  >
                    {loading ? '⏳ Executing...' : '▶ Execute Query'}
                  </button>
                </div>
              </div>

              <div className="examples-card">
                <h4>Quick Examples</h4>
                <button className="btn btn-secondary" onClick={runComplexExample1} disabled={loading}>
                  Products &gt; 100
                </button>
                <button className="btn btn-secondary" onClick={runComplexExample2} disabled={loading}>
                  All Orders (sorted)
                </button>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {result && (
            <div className="results-card">
              <ResultsTable />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QueryBuilder;