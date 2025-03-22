import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { DatabaseService } from './database';
import { generateOpenAPISpec } from './swagger';
import { TableMetadata, OpenAPISpec } from './types';

export class AutoRestServer {
  private app = express();
  private db: DatabaseService;
  private tables: TableMetadata[] = [];

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.db = new DatabaseService(dbUrl);
    this.app.use(express.json());
  }

  async initialize() {
    try {
      this.tables = await this.db.getTableMetadata();
      
      // Generate and serve Swagger documentation
      const swaggerSpec: OpenAPISpec = generateOpenAPISpec(this.tables);
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      
      this.generateRoutes();
    } catch (error) {
      console.error('Failed to initialize:', error);
      throw error;
    }
  }

  private generateRoutes() {
    this.tables.forEach(table => {
      // GET all records
      this.app.get(`/${table.tableName}`, async (req, res) => {
        try {
          const { rows } = await this.db.executeQuery(
            `SELECT * FROM ${table.tableName}`
          );
          res.json(rows);
        } catch (error) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      // GET single record by primary key
      if (table.primaryKey.length > 0) {
        this.app.get(`/${table.tableName}/:id`, async (req, res) => {
          try {
            const whereClause = table.primaryKey
              .map((key, idx) => `${key} = $${idx + 1}`)
              .join(' AND ');
            
            const { rows } = await this.db.executeQuery(
              `SELECT * FROM ${table.tableName} WHERE ${whereClause} LIMIT 1`,
              [req.params.id]
            );
            
            if (rows.length === 0) {
              res.status(404).json({ error: 'Record not found' });
            } else {
              res.json(rows[0]);
            }
          } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
          }
        });
      }

      // POST new record
      this.app.post(`/${table.tableName}`, async (req, res) => {
        try {
          const columns = Object.keys(req.body);
          const values = Object.values(req.body);
          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');

          const { rows } = await this.db.executeQuery(
            `INSERT INTO ${table.tableName} (${columns.join(', ')}) 
             VALUES (${placeholders}) 
             RETURNING *`,
            values
          );

          res.status(201).json(rows[0]);
        } catch (error) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      // PUT update record
      if (table.primaryKey.length > 0) {
        this.app.put(`/${table.tableName}/:id`, async (req, res) => {
          try {
            const updates = Object.entries(req.body)
              .map(([key, _], idx) => `${key} = $${idx + 1}`)
              .join(', ');

            const whereClause = table.primaryKey
              .map((key, idx) => `${key} = $${Object.keys(req.body).length + idx + 1}`)
              .join(' AND ');

            const { rows } = await this.db.executeQuery(
              `UPDATE ${table.tableName} 
               SET ${updates} 
               WHERE ${whereClause} 
               RETURNING *`,
              [...Object.values(req.body), req.params.id]
            );

            if (rows.length === 0) {
              res.status(404).json({ error: 'Record not found' });
            } else {
              res.json(rows[0]);
            }
          } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
          }
        });
      }

      // DELETE record
      if (table.primaryKey.length > 0) {
        this.app.delete(`/${table.tableName}/:id`, async (req, res) => {
          try {
            const whereClause = table.primaryKey
              .map((key, idx) => `${key} = $${idx + 1}`)
              .join(' AND ');

            const { rowCount } = await this.db.executeQuery(
              `DELETE FROM ${table.tableName} WHERE ${whereClause}`,
              [req.params.id]
            );

            if (rowCount === 0) {
              res.status(404).json({ error: 'Record not found' });
            } else {
              res.status(204).send();
            }
          } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
          }
        });
      }
    });
  }

  start(port: number = 3000) {
    this.app.listen(port, () => {
      console.log(`Auto REST API server running on port ${port}`);
    });
  }
}