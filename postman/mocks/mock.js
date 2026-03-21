const http = require('http');

// Mock data generators
const mockDatasetWithSchema = (tableSchema = 'public', tableName = 'users') => ({
  url: `https://data.example.com/${tableSchema}/${tableName}`,
  tableName: tableName,
  tableSchema: tableSchema,
  tableDisplayName: tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_/g, ' '),
  tableDescription: `This is the ${tableName} table containing important business data`,
  application: 'connect',
  processType: 'batch',
  schedule: '0 0 * * *',
  owners: [{ id: 'owner-123', name: 'John Smith', ownershipType: 'primary' }],
  isDeprecated: false,
  domain_id: 'domain-456',
  domain: 'analytics',
  isVerified: true,
  isTestConnection: false,
  schema: [
    { column_name: 'id', column_desc: 'Primary identifier', lens_data_type: 'integer', column_display_name: 'ID', is_key: true },
    { column_name: 'name', column_desc: 'Name field', lens_data_type: 'string', column_display_name: 'Name', is_key: false },
    { column_name: 'created_at', column_desc: 'Creation timestamp', lens_data_type: 'timestamp', column_display_name: 'Created At', is_key: false }
  ]
});

const mockGetLineage = (tableSchema = 'public', tableName = 'users') => ({
  url: `https://data.example.com/${tableSchema}/${tableName}`,
  tableName: tableName,
  tableDisplayName: tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_/g, ' '),
  tableDescription: `Lineage information for ${tableName}`,
  owners: [{ id: 'owner-123', name: 'John Smith', ownershipType: 'primary' }],
  fineGrainedLineages: [
    {
      upstreams: [{ tableName: 'source_table', column: 'source_column' }],
      downstream: { tableName: tableName, column: 'id' }
    }
  ],
  upstreams: [
    {
      url: `https://data.example.com/${tableSchema}/source_table`,
      tableName: 'source_table',
      owners: [{ id: 'owner-456', name: 'Jane Doe', ownershipType: 'secondary' }],
      fineGrainedLineages: [],
      upstreams: [],
      downstreams: []
    }
  ],
  downstreams: [
    {
      url: `https://data.example.com/${tableSchema}/downstream_table`,
      tableName: 'downstream_table',
      owners: [{ id: 'owner-789', name: 'Bob Wilson', ownershipType: 'primary' }],
      fineGrainedLineages: [],
      upstreams: [],
      downstreams: []
    }
  ]
});

const mockOfferedDisplayName = (columnName) => ({
  displayName: columnName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  isAccurate: true
});

const server = http.createServer((req, res) => {
  const { method, url } = req;
  const [pathPart] = url.split('?');
  const parts = pathPart.split('/').filter(Boolean);

  // @endpoint GET /api/catalog/datasets
  if (method === 'GET' && parts.length === 3 && parts[0] === 'api' && parts[1] === 'catalog' && parts[2] === 'datasets') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      mockDatasetWithSchema('public', 'users'),
      mockDatasetWithSchema('analytics', 'events'),
      mockDatasetWithSchema('sales', 'orders')
    ]));
    return;
  }

  // @endpoint POST /api/catalog/datasets
  if (method === 'POST' && parts.length === 3 && parts[0] === 'api' && parts[1] === 'catalog' && parts[2] === 'datasets') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let tables = [];
      try {
        const parsed = JSON.parse(body);
        tables = parsed.tables || [];
      } catch (e) {
        tables = [{ tableSchema: 'public', tableName: 'default_table' }];
      }
      const datasets = tables.map(t => mockDatasetWithSchema(t.tableSchema || 'public', t.tableName || 'unknown'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(datasets.length > 0 ? datasets : [mockDatasetWithSchema()]));
    });
    return;
  }

  // @endpoint GET /api/catalog/users/:userId/datasets/:tableSchema/:tableName
  if (method === 'GET' && parts.length === 7 && parts[0] === 'api' && parts[1] === 'catalog' && parts[2] === 'users' && parts[4] === 'datasets') {
    const userId = decodeURIComponent(parts[3]);
    const tableSchema = decodeURIComponent(parts[5]);
    const tableName = decodeURIComponent(parts[6]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockDatasetWithSchema(tableSchema, tableName)));
    return;
  }

  // @endpoint GET /api/catalog/users/:userId/datasets
  if (method === 'GET' && parts.length === 5 && parts[0] === 'api' && parts[1] === 'catalog' && parts[2] === 'users' && parts[4] === 'datasets') {
    const userId = decodeURIComponent(parts[3]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      mockDatasetWithSchema('public', 'user_profiles'),
      mockDatasetWithSchema('analytics', 'user_activity')
    ]));
    return;
  }

  // @endpoint GET /api/catalog/datasets/:tableSchema/:tableName
  if (method === 'GET' && parts.length === 5 && parts[0] === 'api' && parts[1] === 'catalog' && parts[2] === 'datasets') {
    const tableSchema = decodeURIComponent(parts[3]);
    const tableName = decodeURIComponent(parts[4]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockDatasetWithSchema(tableSchema, tableName)));
    return;
  }

  // @endpoint GET /api/catalog/lineage/:tableSchema/:tableName
  if (method === 'GET' && parts.length === 5 && parts[0] === 'api' && parts[1] === 'catalog' && parts[2] === 'lineage') {
    const tableSchema = decodeURIComponent(parts[3]);
    const tableName = decodeURIComponent(parts[4]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockGetLineage(tableSchema, tableName)));
    return;
  }

  // @endpoint GET /api/catalog/schema/display-names/:columnName
  if (method === 'GET' && parts.length === 5 && parts[0] === 'api' && parts[1] === 'catalog' && parts[2] === 'schema' && parts[3] === 'display-names') {
    const columnName = decodeURIComponent(parts[4]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockOfferedDisplayName(columnName)));
    return;
  }

  // @endpoint POST /api/catalog/schema/display-names
  if (method === 'POST' && parts.length === 4 && parts[0] === 'api' && parts[1] === 'catalog' && parts[2] === 'schema' && parts[3] === 'display-names') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let columnNames = [];
      try {
        columnNames = JSON.parse(body);
      } catch (e) {
        columnNames = ['default_column'];
      }
      const result = {};
      if (Array.isArray(columnNames)) {
        columnNames.forEach(col => {
          result[col.toLowerCase()] = mockOfferedDisplayName(col);
        });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }

  // Fallback for unmocked routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Mock route not defined', method, url }));
});

const PORT = process.env.PORT || 4500;
server.listen(PORT, () => console.log('Mock server running on port ' + PORT));
