/**
 * Simulator Component
 * Allows users to simulate deletion and analyze impact
 */

import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/components.css';

export default function Simulator({ tables, onSimulation }) {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedRowId, setSelectedRowId] = useState('');
  const [tableRows, setTableRows] = useState([]);
  const [cascadeOrder, setCascadeOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animationStep, setAnimationStep] = useState(0);

  const tableNames = tables?.schemas?.map(t => t.tableName) || [];

  // Load table rows when table is selected
  useEffect(() => {
    if (selectedTable) {
      loadTableRows();
    } else {
      setTableRows([]);
      setSelectedRowId('');
    }
  }, [selectedTable]);

  const loadTableRows = async () => {
    try {
      const response = await API.getTableRows(selectedTable);
      setTableRows(response.data.rows);
      setSelectedRowId('');
      setError('');
    } catch (err) {
      setError('Failed to load table rows');
    }
  };

  const handleSimulateDeletion = async () => {
    if (!selectedTable || selectedRowId === '') {
      setError('Please select a table and row');
      return;
    }

    setLoading(true);
    setError('');
    setAnimationStep(0);

    try {
      // Run both simulation and cascade order in parallel
      const [simResponse, cascadeResponse] = await Promise.all([
        API.simulateDeletion(selectedTable, Number(selectedRowId)),
        API.getCascadingOrder(selectedTable, Number(selectedRowId))
      ]);

      setCascadeOrder(cascadeResponse.data.deletionOrder);
      setAnimationStep(1);

      if (onSimulation) {
        onSimulation(simResponse.data.graph);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryKeyColumn = () => {
    if (!selectedTable) return null;
    const schema = tables.schemas?.find(t => t.tableName === selectedTable);
    if (!schema) return null;
    return schema.columns.find(c => c.isPrimaryKey)?.name || '_id';
  };

  const getPrimaryKeyValue = (row) => {
    const pkColumn = getPrimaryKeyColumn();
    return row[pkColumn];
  };

  return (
    <div className="card simulator-card">
      <h2 className="card-title">⚙️ Deletion Simulator</h2>

      <div className="form-group">
        <label>Select Table</label>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="input"
        >
          <option value="">Choose a table...</option>
          {tableNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {selectedTable && tableRows.length > 0 && (
        <div className="form-group">
          <label>Select Row to Delete</label>
          <div className="row-selector">
            {tableRows.map(row => {
              const pkValue = getPrimaryKeyValue(row);
              return (
                <div
                  key={pkValue}
                  className={`row-option ${selectedRowId === String(pkValue) ? 'selected' : ''}`}
                  onClick={() => setSelectedRowId(String(pkValue))}
                >
                  <input
                    type="radio"
                    name="rowSelect"
                    value={String(pkValue)}
                    checked={selectedRowId === String(pkValue)}
                    onChange={(e) => setSelectedRowId(e.target.value)}
                  />
                  <span className="row-label">
                    Row #{pkValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTable && tableRows.length === 0 && (
        <div className="alert alert-warning">
          No data in this table. Insert some rows first.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <button
        onClick={handleSimulateDeletion}
        disabled={loading || !selectedTable || selectedRowId === ''}
        className="btn btn-danger btn-large"
      >
        {loading ? 'Simulating...' : '🔍 Simulate Delete'}
      </button>

      {cascadeOrder && (
        <div className="cascade-order">
          <h3>Deletion Order (Cascade)</h3>
          <p className="description">
            These rows would be deleted in order to maintain referential integrity:
          </p>

          <div className="steps-timeline">
            {cascadeOrder.map((order, idx) => (
              <div
                key={idx}
                className={`step ${animationStep > order.step ? 'completed' : ''} ${animationStep === order.step ? 'current' : ''}`}
                style={{
                  animationDelay: `${order.step * 0.3}s`
                }}
              >
                <div className="step-number">Step {order.step + 1}</div>
                <div className="step-content">
                  <strong>{order.table}</strong>
                  <span className="step-pk">ID: {order.pkValue}</span>
                </div>
                <div className="step-icon">
                  {animationStep > order.step ? '✓' : '→'}
                </div>
              </div>
            ))}
          </div>

          <div className="cascade-summary">
            <p>
              <strong>Total rows to delete:</strong> {cascadeOrder.length}
            </p>
            <p>
              <strong>Deletion steps:</strong> {Math.max(...cascadeOrder.map(o => o.step), 0) + 1}
            </p>
          </div>
        </div>
      )}

      <div className="simulator-help">
        <h4>How It Works</h4>
        <ol>
          <li>Select a table from the dropdown</li>
          <li>Choose a specific row by its primary key</li>
          <li>Click "Simulate Delete" to see impact</li>
          <li>View the cascade deletion order and graph visualization</li>
          <li>The graph shows all dependencies and affected rows</li>
        </ol>
      </div>
    </div>
  );
}
