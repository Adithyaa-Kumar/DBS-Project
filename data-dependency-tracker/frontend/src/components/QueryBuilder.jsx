import React, { useState, useEffect } from 'react';
import api from '../api';

const QueryBuilder = () => {
  const [tables, setTables] = useState([]);
  const [queryType, setQueryType] = useState('join');
  const [joinQuery, setJoinQuery] = useState({
    type: 'inner',
    leftTable: '',
    rightTable: '',
    leftColumn: '',
    rightColumn: '',
    selectColumns: ''
  });
  const [complexQuery, setComplexQuery] = useState({
    from: '',
    joins: [],
    where: [],
    select: '',
    orderBy: { column: '', order: 'ASC' },
    groupBy: '',
    aggregates: []
  });
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [examples, setExamples] = useState(null);

  useEffect(() => {
    loadTables();
    loadExamples();
  }, []);

  const loadTables = async () => {
    try {
      const response = await api.get('/tables');
      setTables(Object.keys(response.data));
    } catch (err) {
      setError('Failed to load tables');
    }
  };

  const loadExamples = async () => {
    try {
      const response = await api.get('/query/examples');
      setExamples(response.data);
    } catch (err) {
      console.error('Failed to load examples:', err);
    }
  };

  const executeJoinQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...joinQuery,
        selectColumns: joinQuery.selectColumns ? joinQuery.selectColumns.split(',').map(s => s.trim()) : null
      };
      const response = await api.post('/query/join', payload);
      setQueryResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const executeComplexQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...complexQuery,
        select: complexQuery.select ? complexQuery.select.split(',').map(s => s.trim()) : null,
        where: complexQuery.where.filter(w => w.column && w.operator && w.value !== ''),
        aggregates: complexQuery.aggregates.filter(a => a.column && a.function)
      };
      const response = await api.post('/query/complex', payload);
      setQueryResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const addJoin = () => {
    setComplexQuery({
      ...complexQuery,
      joins: [...complexQuery.joins, { type: 'inner', table: '', on: '' }]
    });
  };

  const updateJoin = (index, field, value) => {
    const newJoins = [...complexQuery.joins];
    newJoins[index][field] = value;
    setComplexQuery({ ...complexQuery, joins: newJoins });
  };

  const removeJoin = (index) => {
    setComplexQuery({
      ...complexQuery,
      joins: complexQuery.joins.filter((_, i) => i !== index)
    });
  };

  const addWhereCondition = () => {
    setComplexQuery({
      ...complexQuery,
      where: [...complexQuery.where, { column: '', operator: '=', value: '' }]
    });
  };

  const updateWhereCondition = (index, field, value) => {
    const newWhere = [...complexQuery.where];
    newWhere[index][field] = value;
    setComplexQuery({ ...complexQuery, where: newWhere });
  };

  const removeWhereCondition = (index) => {
    setComplexQuery({
      ...complexQuery,
      where: complexQuery.where.filter((_, i) => i !== index)
    });
  };

  const addAggregate = () => {
    setComplexQuery({
      ...complexQuery,
      aggregates: [...complexQuery.aggregates, { column: '', function: 'COUNT' }]
    });
  };

  const updateAggregate = (index, field, value) => {
    const newAggregates = [...complexQuery.aggregates];
    newAggregates[index][field] = value;
    setComplexQuery({ ...complexQuery, aggregates: newAggregates });
  };

  const removeAggregate = (index) => {
    setComplexQuery({
      ...complexQuery,
      aggregates: complexQuery.aggregates.filter((_, i) => i !== index)
    });
  };

  const loadExample = (type, example) => {
    if (type === 'join') {
      setJoinQuery(example);
    } else {
      setComplexQuery(example);
    }
  };

  return (
    <div className="query-builder">
      <h2>Query Builder</h2>

      <div className="query-type-selector">
        <button
          className={queryType === 'join' ? 'active' : ''}
          onClick={() => setQueryType('join')}
        >
          Simple Join Query
        </button>
        <button
          className={queryType === 'complex' ? 'active' : ''}
          onClick={() => setQueryType('complex')}
        >
          Complex Query
        </button>
      </div>

      {queryType === 'join' && (
        <div className="join-query-form">
          <h3>Join Query</h3>

          <div className="form-row">
            <label>Join Type:</label>
            <select
              value={joinQuery.type}
              onChange={(e) => setJoinQuery({ ...joinQuery, type: e.target.value })}
            >
              <option value="inner">INNER JOIN</option>
              <option value="left">LEFT JOIN</option>
              <option value="right">RIGHT JOIN</option>
              <option value="full">FULL OUTER JOIN</option>
            </select>
          </div>

          <div className="form-row">
            <label>Left Table:</label>
            <select
              value={joinQuery.leftTable}
              onChange={(e) => setJoinQuery({ ...joinQuery, leftTable: e.target.value })}
            >
              <option value="">Select table</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Right Table:</label>
            <select
              value={joinQuery.rightTable}
              onChange={(e) => setJoinQuery({ ...joinQuery, rightTable: e.target.value })}
            >
              <option value="">Select table</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Left Column:</label>
            <input
              type="text"
              value={joinQuery.leftColumn}
              onChange={(e) => setJoinQuery({ ...joinQuery, leftColumn: e.target.value })}
              placeholder="Column to join on"
            />
          </div>

          <div className="form-row">
            <label>Right Column:</label>
            <input
              type="text"
              value={joinQuery.rightColumn}
              onChange={(e) => setJoinQuery({ ...joinQuery, rightColumn: e.target.value })}
              placeholder="Column to join on"
            />
          </div>

          <div className="form-row">
            <label>Select Columns (optional):</label>
            <input
              type="text"
              value={joinQuery.selectColumns}
              onChange={(e) => setJoinQuery({ ...joinQuery, selectColumns: e.target.value })}
              placeholder="col1, col2, col3 (leave empty for all)"
            />
          </div>

          <button onClick={executeJoinQuery} disabled={loading}>
            {loading ? 'Executing...' : 'Execute Join Query'}
          </button>
        </div>
      )}

      {queryType === 'complex' && (
        <div className="complex-query-form">
          <h3>Complex Query</h3>

          <div className="form-row">
            <label>FROM Table:</label>
            <select
              value={complexQuery.from}
              onChange={(e) => setComplexQuery({ ...complexQuery, from: e.target.value })}
            >
              <option value="">Select table</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          <div className="joins-section">
            <h4>JOINS</h4>
            {complexQuery.joins.map((join, index) => (
              <div key={index} className="join-item">
                <select
                  value={join.type}
                  onChange={(e) => updateJoin(index, 'type', e.target.value)}
                >
                  <option value="inner">INNER JOIN</option>
                  <option value="left">LEFT JOIN</option>
                  <option value="right">RIGHT JOIN</option>
                  <option value="full">FULL OUTER JOIN</option>
                </select>
                <input
                  type="text"
                  value={join.table}
                  onChange={(e) => updateJoin(index, 'table', e.target.value)}
                  placeholder="Table name"
                />
                <input
                  type="text"
                  value={join.on}
                  onChange={(e) => updateJoin(index, 'on', e.target.value)}
                  placeholder="column1 = table2.column2"
                />
                <button onClick={() => removeJoin(index)}>Remove</button>
              </div>
            ))}
            <button onClick={addJoin}>Add Join</button>
          </div>

          <div className="where-section">
            <h4>WHERE Conditions</h4>
            {complexQuery.where.map((condition, index) => (
              <div key={index} className="where-item">
                <input
                  type="text"
                  value={condition.column}
                  onChange={(e) => updateWhereCondition(index, 'column', e.target.value)}
                  placeholder="Column name"
                />
                <select
                  value={condition.operator}
                  onChange={(e) => updateWhereCondition(index, 'operator', e.target.value)}
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value=">">{`>`}</option>
                  <option value="<">{`<`}</option>
                  <option value=">=">{`>=`}</option>
                  <option value="<=">{`<=`}</option>
                  <option value="LIKE">LIKE</option>
                  <option value="IN">IN</option>
                </select>
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateWhereCondition(index, 'value', e.target.value)}
                  placeholder="Value"
                />
                <button onClick={() => removeWhereCondition(index)}>Remove</button>
              </div>
            ))}
            <button onClick={addWhereCondition}>Add Condition</button>
          </div>

          <div className="form-row">
            <label>SELECT Columns (optional):</label>
            <input
              type="text"
              value={complexQuery.select}
              onChange={(e) => setComplexQuery({ ...complexQuery, select: e.target.value })}
              placeholder="col1, col2, col3 (leave empty for all)"
            />
          </div>

          <div className="form-row">
            <label>ORDER BY Column:</label>
            <input
              type="text"
              value={complexQuery.orderBy.column}
              onChange={(e) => setComplexQuery({
                ...complexQuery,
                orderBy: { ...complexQuery.orderBy, column: e.target.value }
              })}
              placeholder="Column to sort by"
            />
            <select
              value={complexQuery.orderBy.order}
              onChange={(e) => setComplexQuery({
                ...complexQuery,
                orderBy: { ...complexQuery.orderBy, order: e.target.value }
              })}
            >
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
            </select>
          </div>

          <div className="form-row">
            <label>GROUP BY Column:</label>
            <input
              type="text"
              value={complexQuery.groupBy}
              onChange={(e) => setComplexQuery({ ...complexQuery, groupBy: e.target.value })}
              placeholder="Column to group by"
            />
          </div>

          <div className="aggregates-section">
            <h4>Aggregates</h4>
            {complexQuery.aggregates.map((aggregate, index) => (
              <div key={index} className="aggregate-item">
                <select
                  value={aggregate.function}
                  onChange={(e) => updateAggregate(index, 'function', e.target.value)}
                >
                  <option value="COUNT">COUNT</option>
                  <option value="SUM">SUM</option>
                  <option value="AVG">AVG</option>
                  <option value="MIN">MIN</option>
                  <option value="MAX">MAX</option>
                </select>
                <input
                  type="text"
                  value={aggregate.column}
                  onChange={(e) => updateAggregate(index, 'column', e.target.value)}
                  placeholder="Column name"
                />
                <button onClick={() => removeAggregate(index)}>Remove</button>
              </div>
            ))}
            <button onClick={addAggregate}>Add Aggregate</button>
          </div>

          <button onClick={executeComplexQuery} disabled={loading}>
            {loading ? 'Executing...' : 'Execute Complex Query'}
          </button>
        </div>
      )}

      {examples && (
        <div className="examples-section">
          <h3>Examples</h3>
          {queryType === 'join' && examples.joinExamples && (
            <div>
              {Object.entries(examples.joinExamples).map(([key, example]) => (
                <div key={key} className="example">
                  <h4>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</h4>
                  <p>{example.description}</p>
                  <button onClick={() => loadExample('join', example.example)}>
                    Load Example
                  </button>
                </div>
              ))}
            </div>
          )}
          {queryType === 'complex' && examples.complexQueryExamples && (
            <div>
              {Object.entries(examples.complexQueryExamples).map(([key, example]) => (
                <div key={key} className="example">
                  <h4>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</h4>
                  <p>{example.description}</p>
                  <button onClick={() => loadExample('complex', example.example)}>
                    Load Example
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {queryResult && (
        <div className="query-result">
          <h3>Query Result ({queryResult.count} rows)</h3>
          <div className="result-table-container">
            <table className="result-table">
              <thead>
                <tr>
                  {queryResult.result.length > 0 &&
                    Object.keys(queryResult.result[0]).map(key => (
                      <th key={key}>{key}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {queryResult.result.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryBuilder;