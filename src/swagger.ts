import { TableMetadata, OpenAPISpec, OpenAPISchema, PathItemObject } from './types';

export function generateOpenAPISpec(tables: TableMetadata[]): OpenAPISpec {
  const spec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'Auto-generated REST API',
      version: '1.0.0',
      description: 'Automatically generated REST API from PostgreSQL database schema'
    },
    paths: {},
    components: {
      schemas: {}
    }
  };

  tables.forEach(table => {
    const tableName = table.tableName;
    const schemaName = `${tableName}Schema`;

    // Generate schema
    // spec.components.schemas[schemaName] = generateTableSchema(table);

    // Base path /{table}
    spec.paths[`/${tableName}`] = {
      get: {
        tags: [tableName],
        summary: `List all ${tableName}`,
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: `#/components/schemas/${schemaName}`
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: [tableName],
        summary: `Create a new ${tableName}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${schemaName}`
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Successfully created',
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${schemaName}`
                }
              }
            }
          }
        }
      }
    };

    // Individual record path /{table}/{id}
    if (table.primaryKey.length > 0) {
      const idParam = {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        },
        description: `ID of the ${tableName}`
      };

      spec.paths[`/${tableName}/{id}`] = {
        get: {
          tags: [tableName],
          summary: `Get a single ${tableName}`,
          parameters: [idParam],
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${schemaName}`
                  }
                }
              }
            },
            '404': {
              description: 'Record not found'
            }
          }
        },
        put: {
          tags: [tableName],
          summary: `Update a ${tableName}`,
          parameters: [idParam],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${schemaName}`
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${schemaName}`
                  }
                }
              }
            },
            '404': {
              description: 'Record not found'
            }
          }
        },
        delete: {
          tags: [tableName],
          summary: `Delete a ${tableName}`,
          parameters: [idParam],
          responses: {
            '204': {
              description: 'Successfully deleted'
            },
            '404': {
              description: 'Record not found'
            }
          }
        }
      } as PathItemObject;  // Add type assertion here
    }
  });

  return spec;
}

function generateTableSchema(table: TableMetadata): OpenAPISchema {
  const properties: { [key: string]: any } = {};
  const required: string[] = [];

  table.columns.forEach(column => {
    const openApiType = mapPostgreSQLTypeToOpenAPI(column.dataType);
    
    properties[column.name] = {
      type: openApiType.type,
      ...(openApiType.format && { format: openApiType.format }),
      nullable: column.isNullable
    };

    if (!column.isNullable) {
      required.push(column.name);
    }
  });

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined
  };
}

interface OpenAPIDataType {
  type: string;
  format?: string;
}

function mapPostgreSQLTypeToOpenAPI(pgType: string): OpenAPIDataType {
  const typeMap: { [key: string]: OpenAPIDataType } = {
    'integer': { type: 'integer', format: 'int32' },
    'bigint': { type: 'integer', format: 'int64' },
    'numeric': { type: 'number', format: 'double' },
    'decimal': { type: 'number', format: 'double' },
    'real': { type: 'number', format: 'float' },
    'double precision': { type: 'number', format: 'double' },
    'smallint': { type: 'integer', format: 'int32' },
    'character varying': { type: 'string' },
    'character': { type: 'string' },
    'text': { type: 'string' },
    'boolean': { type: 'boolean' },
    'timestamp': { type: 'string', format: 'date-time' },
    'timestamp with time zone': { type: 'string', format: 'date-time' },
    'timestamp without time zone': { type: 'string', format: 'date-time' },
    'date': { type: 'string', format: 'date' },
    'time': { type: 'string', format: 'time' },
    'json': { type: 'object' },
    'jsonb': { type: 'object' },
    'uuid': { type: 'string', format: 'uuid' },
    'bytea': { type: 'string', format: 'binary' },
    'inet': { type: 'string', format: 'ipv4' },
    'cidr': { type: 'string', format: 'ipv4' },
    'macaddr': { type: 'string' },
    'point': { type: 'object' },
    'line': { type: 'object' },
    'lseg': { type: 'object' },
    'box': { type: 'object' },
    'path': { type: 'object' },
    'polygon': { type: 'object' },
    'circle': { type: 'object' },
    'interval': { type: 'string' }
  };

  return typeMap[pgType.toLowerCase()] || { type: 'string' };
}