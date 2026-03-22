/**
 * RelationshipManager Component
 * Displays all table relationships and their cardinality
 */

import React, { useState, useEffect } from 'react';
import API from '../api';
import '../styles/components.css';

export default function RelationshipManager() {
  const [relationships, setRelationships] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      setLoading(true);
      const response = await API.getRelationships();
      setRelationships(response.data.relationships);
      setError('');
    } catch (err) {
      setError('Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card relationships-card">
        <h2 className="card-title">🔗 Relationship Manager</h2>
        <p>Loading relationships...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card relationships-card">
        <h2 className="card-title">🔗 Relationship Manager</h2>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const totalRelationships =
    (relationships?.oneToMany?.length || 0) +
    (relationships?.manyToOne?.length || 0) +
    (relationships?.oneToOne?.length || 0);

  return (
    <div className="card relationships-card">
      <h2 className="card-title">🔗 Relationship Manager</h2>

      <div className="relationships-stats">
        <div className="stat-box">
          <div className="stat-number">{relationships?.oneToMany?.length || 0}</div>
          <div className="stat-label">One-to-Many</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{relationships?.manyToOne?.length || 0}</div>
          <div className="stat-label">Many-to-One</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{relationships?.oneToOne?.length || 0}</div>
          <div className="stat-label">One-to-One</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{totalRelationships}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      {totalRelationships === 0 ? (
        <p className="empty-state">No relationships defined yet. Create tables with foreign keys.</p>
      ) : (
        <>
          {relationships?.manyToOne && relationships.manyToOne.length > 0 && (
            <div className="relationship-section">
              <h3 className="relationship-type-title">
                <span className="badge badge-info">Many-to-One</span>
              </h3>
              <div className="relationship-list">
                {relationships.manyToOne.map((rel, idx) => (
                  <div key={idx} className="relationship-item">
                    <div className="relationship-path">
                      <span className="table-name">{rel.from.table}</span>
                      <span className="column-name">.{rel.from.column}</span>
                      <span className="arrow">→</span>
                      <span className="table-name">{rel.to.table}</span>
                      <span className="column-name">.{rel.to.column}</span>
                    </div>
                    <div className="relationship-badge">Many-to-One</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relationships?.oneToMany && relationships.oneToMany.length > 0 && (
            <div className="relationship-section">
              <h3 className="relationship-type-title">
                <span className="badge badge-success">One-to-Many</span>
              </h3>
              <div className="relationship-list">
                {relationships.oneToMany.map((rel, idx) => (
                  <div key={idx} className="relationship-item">
                    <div className="relationship-path">
                      <span className="table-name">{rel.from.table}</span>
                      <span className="column-name">.{rel.from.column}</span>
                      <span className="arrow">→</span>
                      <span className="table-name">{rel.to.table}</span>
                      <span className="column-name">.{rel.to.column}</span>
                    </div>
                    <div className="relationship-badge">One-to-Many</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relationships?.oneToOne && relationships.oneToOne.length > 0 && (
            <div className="relationship-section">
              <h3 className="relationship-type-title">
                <span className="badge badge-warning">One-to-One</span>
              </h3>
              <div className="relationship-list">
                {relationships.oneToOne.map((rel, idx) => (
                  <div key={idx} className="relationship-item">
                    <div className="relationship-path">
                      <span className="table-name">{rel.from.table}</span>
                      <span className="column-name">.{rel.from.column}</span>
                      <span className="arrow">↔</span>
                      <span className="table-name">{rel.to.table}</span>
                      <span className="column-name">.{rel.to.column}</span>
                    </div>
                    <div className="relationship-badge">One-to-One</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button onClick={loadRelationships} className="btn btn-secondary">
        🔄 Refresh
      </button>
    </div>
  );
}
