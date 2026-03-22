/**
 * TableBuilder Component
 * Allows users to create tables and define columns with relationships
 */

import React, { useState } from 'react';
import API from '../api';
import '../styles/components.css';

export default function TableBuilder({ onTableCreated, tables }) {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState([]);
  const [newColumn, setNewColumn] = useState({
    name: '',
    dataType: 'text',
    isPrimaryKey: false,
    isForeignKey: false,
    referencedTable: '',
    referencedColumn: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const dataTypes = ['text', 'number', 'integer', 'date', 'boolean'];

  const handleAddColumn = () => {
    if (!newColumn.name) {
      setError('Column name is required');
      return;
    }

    if (newColumn.isForeignKey && (!newColumn.referencedTable || !newColumn.referencedColumn)) {
      setError('Referenced table and column are required for foreign keys');
      return;
    }

    // Check for duplicate column names
    if (columns.some(c => c.name === newColumn.name)) {
      setError('Column name already exists');
      return;
    }

    // Check for multiple primary keys
    if (newColumn.isPrimaryKey && columns.some(c => c.isPrimaryKey)) {
      setError('Only one primary key is allowed per table');
      return;
    }

    setColumns([...columns, { ...newColumn }]);
    setNewColumn({
      name: '',
      dataType: 'text',
      isPrimaryKey: false,
      isForeignKey: false,
      referencedTable: '',
      referencedColumn: ''
    });
    setError('');
  };

  const handleRemoveColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleCreateTable = async () => {
    if (!tableName.trim()) {
      setError('Table name is required');
      return;
    }

    if (columns.length === 0) {
      setError('At least one column is required');
      return;
    }

    if (!columns.some(c => c.isPrimaryKey)) {
      setError('A primary key column is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.createTable(tableName, columns);
      setSuccess(`Table "${tableName}" created successfully!`);
      setTableName('');
      setColumns([]);

      if (onTableCreated) {
        onTableCreated(response.data.table);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const tablesList = tables?.schemas || [];

  return (
    <div className="card table-builder-card">
      <h2 className="card-title">📊 Table Builder</h2>

      <div className="form-group">
        <label>Table Name</label>
        <input
          type="text"
          placeholder="e.g., Users, Products, Orders"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          className="input"
        />
      </div>

      <div className="column-builder">
        <h3>Define Columns</h3>

        <div className="column-inputs">
          <div className="form-group">
            <label>Column Name</label>
            <input
              type="text"
              placeholder="e.g., user_id, email"
              value={newColumn.name}
              onChange={(e) =>
                setNewColumn({ ...newColumn, name: e.target.value })
              }
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Data Type</label>
            <select
              value={newColumn.dataType}
              onChange={(e) =>
                setNewColumn({ ...newColumn, dataType: e.target.value })
              }
              className="input"
            >
              {dataTypes.map(dt => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={newColumn.isPrimaryKey}
                onChange={(e) =>
                  setNewColumn({ ...newColumn, isPrimaryKey: e.target.checked })
                }
              />
              Primary Key
            </label>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={newColumn.isForeignKey}
                onChange={(e) =>
                  setNewColumn({ ...newColumn, isForeignKey: e.target.checked })
                }
              />
              Foreign Key
            </label>
          </div>

          {newColumn.isForeignKey && (
            <>
              <div className="form-group">
                <label>Referenced Table</label>
                <select
                  value={newColumn.referencedTable}
                  onChange={(e) =>
                    setNewColumn({ ...newColumn, referencedTable: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select table...</option>
                  {tablesList.map(table => (
                    <option key={table.tableName} value={table.tableName}>
                      {table.tableName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Referenced Column</label>
                <input
                  type="text"
                  placeholder="e.g., user_id"
                  value={newColumn.referencedColumn}
                  onChange={(e) =>
                    setNewColumn({ ...newColumn, referencedColumn: e.target.value })
                  }
                  className="input"
                />
              </div>
            </>
          )}

          <button
            onClick={handleAddColumn}
            className="btn btn-secondary"
          >
            + Add Column
          </button>
        </div>

        {columns.length > 0 && (
          <div className="columns-list">
            <h4>Columns ({columns.length})</h4>
            {columns.map((col, idx) => (
              <div key={idx} className="column-item">
                <div className="column-info">
                  <strong>{col.name}</strong>
                  <span className="data-type">{col.dataType}</span>
                  {col.isPrimaryKey && <span className="badge badge-primary">PK</span>}
                  {col.isForeignKey && (
                    <span className="badge badge-warning">
                      FK → {col.referencedTable}.{col.referencedColumn}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveColumn(idx)}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <button
        onClick={handleCreateTable}
        disabled={loading}
        className="btn btn-primary btn-large"
      >
        {loading ? 'Creating...' : '✓ Create Table'}
      </button>
    </div>
  );
}
