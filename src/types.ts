// types.ts
export interface DatabaseConfig {
  connectionString: string;
}

export interface TableMetadata {
  tableName: string;
  columns: ColumnMetadata[];
  primaryKey: string[];
}

export interface ColumnMetadata {
  name: string;
  dataType: string;
  isNullable: boolean;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  paths: {
    [path: string]: PathItemObject;  // Changed this line
  };
  components: {
    schemas: {
      [name: string]: OpenAPISchema;
    };
  };
}

export interface PathItemObject {
  get?: OpenAPIPath;
  post?: OpenAPIPath;
  put?: OpenAPIPath;
  delete?: OpenAPIPath;
  [method: string]: OpenAPIPath | undefined;
}

export interface OpenAPIPath {
  tags?: string[];
  summary: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required: boolean;
    content: {
      'application/json': {
        schema: OpenAPISchemaRef | OpenAPISchema;
      };
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        'application/json': {
          schema: OpenAPISchemaRef | OpenAPISchema | OpenAPIArraySchema;
        };
      };
    };
  };
}

export interface OpenAPIPath {
  tags?: string[];  // Add this line
  summary: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required: boolean;
    content: {
      'application/json': {
        schema: OpenAPISchemaRef | OpenAPISchema;
      };
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        'application/json': {
          schema: OpenAPISchemaRef | OpenAPISchema | OpenAPIArraySchema;
        };
      };
    };
  };
}

export interface OpenAPIParameter {
  name: string;
  in: string;
  required: boolean;
  schema: {
    type: string;
  };
  description?: string;
}

export interface OpenAPISchemaRef {
  $ref: string;
}

export interface OpenAPIArraySchema {
  type: 'array';
  items: OpenAPISchemaRef | OpenAPISchema;
}

export interface OpenAPISchema {
  type: string;
  properties: {
    [name: string]: {
      type: string;
      format?: string;
      nullable?: boolean;
    };
  };
  required?: string[];
}