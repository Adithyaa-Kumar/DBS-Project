/**
 * GraphView Component
 * Visualizes dependencies using Cytoscape.js
 */

import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import '../styles/components.css';

// Import layout algorithm
import coseBilkent from 'cytoscape-cose-bilkent';
cytoscape.use(coseBilkent);

export default function GraphView({ graphData }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    // Prepare nodes with styling
    const nodes = graphData.nodes.map(node => ({
      data: {
        id: node.id,
        label: node.label,
        type: node.type
      }
    }));

    // Filter edges if showing critical only
    let edgesToShow = graphData.edges;
    if (showCriticalOnly) {
      edgesToShow = edgesToShow.filter(e => e.type === 'CRITICAL');
    }

    const edges = edgesToShow.map(edge => ({
      data: {
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type
      }
    }));

    // Create Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'content': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#3498db',
            'color': 'white',
            'width': '90px',
            'height': '90px',
            'font-size': '13px',
            'font-weight': 'bold',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'border-width': 2,
            'border-color': '#2980b9',
            'padding': '12px',
            'box-shadow': '0 2px 8px rgba(0,0,0,0.2)',
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': '300ms'
          }
        },
        {
          selector: 'node[type="target"]',
          style: {
            'background-color': '#e74c3c',
            'border-color': '#c0392b',
            'border-width': 4,
            'width': '120px',
            'height': '120px',
            'font-size': '14px',
            'box-shadow': '0 0 20px rgba(231, 76, 60, 0.6)'
          }
        },
        {
          selector: 'node[type="dependent"]',
          style: {
            'background-color': '#f39c12',
            'border-color': '#d68910',
            'border-width': 2,
            'width': '100px',
            'height': '100px',
            'font-size': '13px',
            'box-shadow': '0 2px 10px rgba(243, 156, 18, 0.4)'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#27ae60',
            'border-color': '#229954',
            'border-width': 3,
            'box-shadow': '0 0 20px rgba(39, 174, 96, 0.8)',
            'width': '110px',
            'height': '110px'
          }
        },
        {
          selector: 'node:hover',
          style: {
            'background-color': '#2980b9',
            'border-width': 3
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'line-color': '#bdc3c7',
            'target-arrow-color': '#bdc3c7',
            'width': 2,
            'label': 'data(label)',
            'text-background-color': 'white',
            'text-background-padding': '5px',
            'text-background-opacity': 0.95,
            'text-font-size': '11px',
            'font-weight': 'bold',
            'transition-property': 'width, line-color',
            'transition-duration': '300ms'
          }
        },
        {
          selector: 'edge[type="CRITICAL"]',
          style: {
            'line-color': '#e74c3c',
            'target-arrow-color': '#e74c3c',
            'width': 4,
            'line-style': 'solid',
            'opacity': 1
          }
        },
        {
          selector: 'edge[type="NORMAL"]',
          style: {
            'line-color': '#95a5a6',
            'target-arrow-color': '#95a5a6',
            'width': 2,
            'line-style': 'dashed',
            'opacity': 0.6
          }
        }
      ],
      layout: {
        name: 'cose-bilkent',
        animate: true,
        animationDuration: 1000,
        randomize: false,
        fit: true,
        padding: 50,
        nodeSeparation: 80,
        edgeElasticity: 0.5,
        refresh: 30,
        gravity: 0.05,
        gravityRange: 300
      }
    });

    // Click handling
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      setSelectedNode({
        id: node.id(),
        label: node.data('label'),
        type: node.data('type')
      });
    });

    cy.on('tap', () => {
      if (event.target === cy) {
        setSelectedNode(null);
        cy.$('node').removeClass('selected');
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graphData, showCriticalOnly]);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="card graph-view-card">
        <h2 className="card-title">📊 Dependency Graph</h2>
        <p className="empty-state">No dependency graph available. Run a simulation first.</p>
      </div>
    );
  }

  return (
    <div className="card graph-view-card">
      <h2 className="card-title">📊 Dependency Graph</h2>

      <div className="graph-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showCriticalOnly}
            onChange={(e) => setShowCriticalOnly(e.target.checked)}
          />
          Show Only Critical Dependencies
        </label>

        <div className="graph-stats">
          <span className="stat">
            <strong>Nodes:</strong> {graphData.nodes.length}
          </span>
          <span className="stat">
            <strong>Relationships:</strong> {graphData.edges.length}
          </span>
          <span className="stat">
            <strong>Impacted Tables:</strong> {graphData.statistics.impactedTables.length}
          </span>
        </div>
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: '#e74c3c' }}></span>
          <strong>Target Row</strong> (will be deleted)
        </div>
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: '#f39c12' }}></span>
          <strong>Dependent Rows</strong> (affected by deletion)
        </div>
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: '#3498db' }}></span>
          <strong>Other Rows</strong> (no cascade)
        </div>
        <div className="legend-item">
          <span className="legend-line" style={{ borderTop: '4px solid #e74c3c' }}></span>
          <strong>Critical Edge</strong> (cascade delete)
        </div>
        <div className="legend-item">
          <span className="legend-line" style={{ borderTop: '2px dashed #95a5a6' }}></span>
          <strong>Normal Edge</strong> (reference only)
        </div>
      </div>

      <div className="graph-container" ref={containerRef}></div>

      {selectedNode && (
        <div className="node-info">
          <h4>🎯 Selected Node Details</h4>
          <div className="node-details-grid">
            <div className="detail-item">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{selectedNode.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Display:</span>
              <span className="detail-value">{selectedNode.label}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type:</span>
              <span className={`detail-value type-${selectedNode.type.toLowerCase()}`}>
                {selectedNode.type === 'target' ? '🔴 Target' : selectedNode.type === 'dependent' ? '🟠 Dependent' : '🔵 Other'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="graph-stats-detailed">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <div className="stat-title">Total Nodes</div>
              <div className="stat-value">{graphData.nodes.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔗</div>
            <div className="stat-info">
              <div className="stat-title">Relationships</div>
              <div className="stat-value">{graphData.edges.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <div className="stat-title">Tables Impacted</div>
              <div className="stat-value">{graphData.statistics.impactedTables.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <div className="stat-title">Critical Cascades</div>
              <div className="stat-value">{graphData.edges.filter(e => e.type === 'CRITICAL').length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
