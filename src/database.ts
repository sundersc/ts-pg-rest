// database.ts
import { Pool } from 'pg';
import { TableMetadata, ColumnMetadata } from './types';

export class DatabaseService {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async getTableMetadata(): Promise<TableMetadata[]> {
    const query = `
      SELECT
        t.table_name,
        json_agg(
          json_build_object(
            'name', c.column_name,
            'dataType', c.data_type,
            'isNullable', c.is_nullable = 'YES'
          )
        ) as columns,
          json_agg(
            CASE
              WHEN tc.constraint_type = 'PRIMARY KEY'
              THEN c.column_name
              ELSE NULL
            END
          ) FILTER (WHERE tc.constraint_type = 'PRIMARY KEY') as primary_keys
      FROM information_schema.tables t
      JOIN information_schema.columns c
        ON t.table_name = c.table_name
        AND t.table_schema = c.table_schema
      LEFT JOIN information_schema.key_column_usage kcu
        ON c.table_name = kcu.table_name
        AND c.column_name = kcu.column_name
        AND c.table_schema = kcu.table_schema
      LEFT JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
        AND kcu.table_schema = tc.table_schema
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name;
    `;

    try {
      const { rows } = await this.pool.query(query);
      
      return rows.map(row => ({
        tableName: row.table_name,
        columns: row.columns as ColumnMetadata[],
        primaryKey: Array.isArray(row.primary_keys) 
          ? row.primary_keys.filter((key: string | null) => key !== null)
          : []
      }));
    } catch (error) {
      console.error('Error fetching table metadata:', error);
      throw error;
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    return this.pool.query(query, params);
  }
}
