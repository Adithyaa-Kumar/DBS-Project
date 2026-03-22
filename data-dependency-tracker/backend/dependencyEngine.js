/**
 * Dependency Detection Engine
 * Analyzes deletion impact and creates graph for visualization
 */

class DependencyEngine {
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Find all dependencies when deleting a specific row
   * Returns nodes and edges for graph visualization
   * @param {string} tableName - Table to delete from
   * @param {*} pkValue - Primary key value of row to delete
   * @returns {Object} - Graph data (nodes and edges)
   */
  async simulateDeletion(tableName, pkValue) {
    const row = await this.storage.getRowByPK(tableName, pkValue);
    if (!row) {
      throw new Error(`Row not found: ${tableName} with PK ${pkValue}`);
    }

    const nodes = [];
    const edges = [];

    // Add the target node (the one being deleted)
    const tableSchema = await this.storage.getTableSchema(tableName);
    const pkColumn = tableSchema.find(c => c.isPrimaryKey);
    const targetNodeId = `${tableName}:${pkValue}`;

    nodes.push({
      id: targetNodeId,
      label: `${tableName} (#${pkValue})`,
      tableName: tableName,
      rowData: row,
      type: 'target'
    });

    // Find all dependencies using BFS
    const visited = new Set();
    const queue = [{
      tableName: tableName,
      pkValue: pkValue,
      parentNodeId: targetNodeId
    }];

    visited.add(targetNodeId);

    while (queue.length > 0) {
      const current = queue.shift();

      // Find all rows that reference this row via foreign keys
      const dependentRows = await this.findDependentRows(current.tableName, current.pkValue);

      for (const dependent of dependentRows) {
        const dependentNodeId = `${dependent.tableName}:${dependent.pkValue}`;

        // Add node if not already added
        if (!visited.has(dependentNodeId)) {
          nodes.push({
            id: dependentNodeId,
            label: `${dependent.tableName} (#${dependent.pkValue})`,
            tableName: dependent.tableName,
            rowData: dependent.row,
            type: 'dependent'
          });

          visited.add(dependentNodeId);
          queue.push({
            tableName: dependent.tableName,
            pkValue: dependent.pkValue,
            parentNodeId: dependentNodeId
          });
        }

        // Add edge
        edges.push({
          source: current.parentNodeId,
          target: dependentNodeId,
          type: 'CRITICAL', // All dependencies are critical in cascade
          label: `references via ${dependent.refColumnName}`
        });
      }
    }

    return {
      nodes,
      edges,
      targetNode: targetNodeId,
      statistics: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        impactedTables: [...new Set(nodes.map(n => n.tableName))]
      }
    };
  }

  /**
   * Find all rows that reference a specific row
   * @param {string} tableName - Table name
   * @param {*} pkValue - Primary key value
   * @returns {Array} - Array of dependent rows
   */
  async findDependentRows(tableName, pkValue) {
    const dependents = [];
    const tableSchema = await this.storage.getTableSchema(tableName);
    const pkColumn = tableSchema.find(c => c.isPrimaryKey);

    const relationships = await this.storage.getAllRelationships();
    const incomingRelations = relationships.filter(
      rel => rel.toTable === tableName && rel.toColumn === pkColumn.name
    );

    for (const relation of incomingRelations) {
      const refTable = await this.storage.getTable(relation.fromTable);
      const matchingRows = refTable.rows.filter(row => row[relation.fromColumn] === pkValue);
      const refTableSchema = await this.storage.getTableSchema(relation.fromTable);
      const refPkColumn = refTableSchema.find(c => c.isPrimaryKey);

      for (const matchingRow of matchingRows) {
        dependents.push({
          tableName: relation.fromTable,
          pkValue: matchingRow[refPkColumn.name],
          refColumnName: relation.fromColumn,
          row: matchingRow
        });
      }
    }

    return dependents;
  }

  /**
   * Analyze relationships and create a full dependency map
   * @returns {Object} - Complete relationship map
   */
  async analyzeRelationships() {
    const relationships = await this.storage.getAllRelationships();
    const tables = await this.storage.getAllTables();

    const relationshipMap = {
      oneToMany: [],
      manyToOne: [],
      oneToOne: []
    };

    for (const rel of relationships) {
      const fromTableRows = tables[rel.fromTable].rows.length;
      const toTableRows = tables[rel.toTable].rows.length;

      const relationship = {
        from: {
          table: rel.fromTable,
          column: rel.fromColumn
        },
        to: {
          table: rel.toTable,
          column: rel.toColumn
        },
        cardinality: await this.determineCardinality(rel.fromTable, rel.toTable, rel.fromColumn, rel.toColumn)
      };

      if (relationship.cardinality === 'one-to-many') {
        relationshipMap.oneToMany.push(relationship);
      } else if (relationship.cardinality === 'many-to-one') {
        relationshipMap.manyToOne.push(relationship);
      } else {
        relationshipMap.oneToOne.push(relationship);
      }
    }

    return relationshipMap;
  }

  /**
   * Determine cardinality of a relationship
   * @private
   */
  async determineCardinality(fromTable, toTable, fromColumn, toColumn) {
    const fromTableData = await this.storage.getTable(fromTable);
    const toTableData = await this.storage.getTable(toTable);

    // Count unique FK values
    const uniqueFKValues = new Set(
      fromTableData.rows.map(row => row[fromColumn])
    );

    const toTableRowCount = toTableData.rows.length;

    if (uniqueFKValues.size <= toTableRowCount / 2) {
      return 'many-to-one';
    } else if (uniqueFKValues.size === toTableRowCount) {
      return 'one-to-one';
    } else {
      return 'one-to-many';
    }
  }

  /**
   * Get cascading deletion order
   * Returns the order in which rows should be deleted to respect foreign key constraints
   * @param {string} tableName - Table name
   * @param {*} pkValue - Primary key value
   * @returns {Array} - Ordered list of deletions
   */
  async getCascadingDeletionOrder(tableName, pkValue) {
    const deletionOrder = [];
    const graph = await this.simulateDeletion(tableName, pkValue);

    // Group nodes by "distance" from target
    const levels = new Map();
    levels.set(0, [graph.targetNode]);

    for (let distance = 0; distance < graph.nodes.length; distance++) {
      if (!levels.has(distance)) break;

      const currentLevel = levels.get(distance);
      const nextLevel = [];

      for (const nodeId of currentLevel) {
        const children = graph.edges
          .filter(e => e.source === nodeId)
          .map(e => e.target);

        nextLevel.push(...children);

        deletionOrder.push({
          step: distance,
          nodeId,
          table: nodeId.split(':')[0],
          pkValue: nodeId.split(':')[1]
        });
      }

      if (nextLevel.length > 0) {
        levels.set(distance + 1, nextLevel);
      }
    }

    return deletionOrder;
  }
}

export default DependencyEngine;
