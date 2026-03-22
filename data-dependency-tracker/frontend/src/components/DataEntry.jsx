/**
 * DataEntry Component
 * Allows users to insert rows into tables
 */

import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/components.css';

export default function DataEntry({ tables, onDataInserted }) {
  const [selectedTable, setSelectedTable] = useState('');
  const [formData, setFormData] = useState({});
  const [tableSchema, setTableSchema] = useState(null);
  const [tableRows, setTableRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const tableNames = tables?.schemas?.map(t => t.tableName) || [];

  // Load table schema when selected
  useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable]);

  const loadTableData = async () => {
    try {
      const response = await API.getTable(selectedTable);
      setTableSchema(response.data.metadata);
      setTableRows(response.data.rows);
      setFormData({});
      setError('');
    } catch (err) {
      setError('Failed to load table data');
    }
  };

  const handleInputChange = (columnName, value) => {
    setFormData({
      ...formData,
      [columnName]: value === '' ? null : (isNaN(value) ? value : Number(value))
    });
  };

  const handleInsertRow = async () => {
    if (!selectedTable) {
      setError('Please select a table');
      return;
    }

    // Validate that all non-null FK values exist in referenced tables
    for (const column of tableSchema.columns) {
      if (column.isForeignKey && formData[column.name]) {
        try {
          const refTable = await API.getTable(column.referencedTable);
          const pkColumn = refTable.metadata.columns.find(c => c.isPrimaryKey);
          const exists = refTable.rows.some(
            row => row[pkColumn.name] === formData[column.name]
          );

          if (!exists) {
            setError(
              `Foreign key violation: ${formData[column.name]} does not exist in ${column.referencedTable}.${column.referencedColumn}`
            );
            return;
          }
        } catch (err) {
          setError(`Failed to validate foreign key: ${err.message}`);
          return;
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.insertRow(selectedTable, formData);
      setSuccess(`Row inserted successfully!`);
      setFormData({});

      // Reload table data
      await loadTableData();

      if (onDataInserted) {
        onDataInserted(response.data.row);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to insert row');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = async (pkValue) => {
    if (!selectedTable) return;

    if (!window.confirm(`Delete row with ID ${pkValue}?`)) {
      return;
    }

    try {
      await API.deleteRow(selectedTable, pkValue);
      setSuccess('Row deleted successfully');
      await loadTableData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete row');
    }
  };

  return (
    <div className="card data-entry-card">
      <h2 className="card-title">📝 Data Entry</h2>

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

      {tableSchema && (
        <>
          <div className="form-grid">
            {tableSchema.columns.map(column => (
              <div key={column.name} className="form-group">
                <label>
                  {column.name}
                  {column.isPrimaryKey && <span className="badge badge-primary">PK</span>}
                  {column.isForeignKey && <span className="badge badge-warning">FK</span>}
                </label>

                {column.isForeignKey ? (
                  <select
                    value={formData[column.name] || ''}
                    onChange={(e) => handleInputChange(column.name, e.target.value)}
                    className="input"
                  >
                    <option value="">None</option>
                    {/* In a real app, you'd fetch the referenced table's values */}
                    <option value="">Select from {column.referencedTable}...</option>
                  </select>
                ) : column.dataType === 'date' ? (
                  <input
                    type="date"
                    value={formData[column.name] || ''}
                    onChange={(e) => handleInputChange(column.name, e.target.value)}
                    className="input"
                  />
                ) : column.dataType === 'boolean' ? (
                  <select
                    value={formData[column.name] || ''}
                    onChange={(e) => handleInputChange(column.name, e.target.value)}
                    className="input"
                  >
                    <option value="">None</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : column.dataType === 'number' || column.dataType === 'integer' ? (
                  <input
                    type="number"
                    value={formData[column.name] || ''}
                    onChange={(e) => handleInputChange(column.name, e.target.value)}
                    className="input"
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[column.name] || ''}
                    onChange={(e) => handleInputChange(column.name, e.target.value)}
                    className="input"
                  />
                )}
              </div>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button
            onClick={handleInsertRow}
            disabled={loading}
            className="btn btn-primary btn-large"
          >
            {loading ? 'Inserting...' : '➕ Insert Row'}
          </button>

          {tableRows.length > 0 && (
            <div className="table-view">
              <h3>Existing Data</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {tableSchema.columns.map(col => (
                        <th key={col.name}>{col.name}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, idx) => (
                      <tr key={idx}>
                        {tableSchema.columns.map(col => (
                          <td key={col.name}>
                            {String(row[col.name] || '')}
                          </td>
                        ))}
                        <td>
                          <button
                            onClick={() => handleDeleteRow(row._id)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
