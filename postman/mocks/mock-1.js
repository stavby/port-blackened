const http = require('http');

// Mock data generators
const mockOpaTablePermission = (tableSchema = 'public', tableName = 'users') => ({
  catalog_name: 'datalake',
  table_schema: tableSchema,
  table_name: tableName,
  columns: ['id', 'name', 'email', 'created_at']
});

const mockOpaTableLivePermission = (tableSchema = 'public', tableName = 'users', permissionSource = 'group:analysts') => ({
  catalog_name: 'datalake',
  table_schema: tableSchema,
  table_name: tableName,
  columns: ['id', 'name', 'email', 'created_at'],
  permission_source: permissionSource
});

const mockColumnNames = (tableSchema = 'public', tableName = 'users') => [
  'id',
  'name',
  'email',
  'created_at'
];

const parseBody = (req) =>
  new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const [pathPart] = url.split('?');
  const parts = pathPart.split('/').filter(Boolean);

  // @endpoint POST /v1/data/policies/return_permissions
  if (method === 'POST' && parts.length === 4 && parts[0] === 'v1' && parts[1] === 'data' && parts[2] === 'policies' && parts[3] === 'return_permissions') {
    const body = await parseBody(req);
    const userId = body.input && body.input.context && body.input.context.identity
      ? body.input.context.identity.user
      : 'unknown';
    const result = [
      mockOpaTablePermission('public', 'users'),
      mockOpaTablePermission('analytics', 'events'),
      mockOpaTablePermission('sales', 'orders')
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
    return;
  }

  // @endpoint POST /v1/data/policies/return_table_permissions
  if (method === 'POST' && parts.length === 4 && parts[0] === 'v1' && parts[1] === 'data' && parts[2] === 'policies' && parts[3] === 'return_table_permissions') {
    const body = await parseBody(req);
    const resource = body.input && body.input.action && body.input.action.resource
      ? body.input.action.resource
      : {};
    const tableSchema = resource.table_schema || 'public';
    const tableName = resource.table_name || 'users';
    const result = mockColumnNames(tableSchema, tableName);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
    return;
  }

  // @endpoint POST /v1/data/policies/return_batch_table_permissions
  if (method === 'POST' && parts.length === 4 && parts[0] === 'v1' && parts[1] === 'data' && parts[2] === 'policies' && parts[3] === 'return_batch_table_permissions') {
    const body = await parseBody(req);
    const resources = body.input && body.input.action && Array.isArray(body.input.action.resources)
      ? body.input.action.resources
      : [{ table_schema: 'public', table_name: 'users' }];
    const result = resources.map(r =>
      mockOpaTablePermission(r.table_schema || 'public', r.table_name || 'unknown')
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
    return;
  }

  // @endpoint POST /v1/data/policies/return_live_permissions
  if (method === 'POST' && parts.length === 4 && parts[0] === 'v1' && parts[1] === 'data' && parts[2] === 'policies' && parts[3] === 'return_live_permissions') {
    const body = await parseBody(req);
    const userAttributes = body.input && body.input.context && body.input.context.identity
      ? body.input.context.identity.user_attributes
      : {};
    const result = [
      mockOpaTableLivePermission('public', 'users', 'group:analysts'),
      mockOpaTableLivePermission('analytics', 'events', 'group:data_engineers'),
      mockOpaTableLivePermission('sales', 'orders', 'user:direct')
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
    return;
  }

  // @endpoint POST /v1/data/policies/return_live_table_permissions
  if (method === 'POST' && parts.length === 4 && parts[0] === 'v1' && parts[1] === 'data' && parts[2] === 'policies' && parts[3] === 'return_live_table_permissions') {
    const body = await parseBody(req);
    const resource = body.input && body.input.action && body.input.action.resource
      ? body.input.action.resource
      : {};
    const tableSchema = resource.table_schema || 'public';
    const tableName = resource.table_name || 'users';
    const result = mockColumnNames(tableSchema, tableName);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
    return;
  }

  // Fallback for unmocked routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Mock route not defined', method, url }));
});

const PORT = process.env.PORT || 4501;
server.listen(PORT, () => console.log('OPA API Mock server running on port ' + PORT));
