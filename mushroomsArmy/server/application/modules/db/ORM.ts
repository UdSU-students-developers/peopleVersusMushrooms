import sqlite3 from 'sqlite3';

type TParamValue = string | number | boolean | null;

interface Params {
    [key: string]: TParamValue;
}

class ORM {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) { // НАСТОЯТЕЛЬНО рекомендуется подредактировать orm так, чтобы передавать нужно было не массив с колонками, а строку
        this.db = db; // Сейчас: orm.get("users", { id }, ["username", "token", "online"]);
    }                 // Должно быть: orm.get("users", { id }, "username, token, online");

    get<R extends Record<string, unknown>>(table: string, params: Params | null = null, columns: string = "*", operand: string = 'AND'): Promise<R | null> {
        const query: string[] = [];
        const values: TParamValue[] = [];
        let sql = `SELECT ${columns} FROM ${table}`;

        if (params) {
            for (let key in params) {
                query.push(`${key} = ?`);
                values.push(params[key]);
            }
            sql += ` WHERE ${query.join(` ${operand} `)}`;
        }
        return new Promise((resolve) => {
            this.db.get(sql, values, function(err, row) {
                if (err) resolve(null);
                else resolve(row as R ?? null);
            });
        });
    }

    all<R extends Record<string, unknown>>(table: string, params: Params | null = null, columns: string = "*", operand: string = 'AND'): Promise<R[]> {
        const query: string[] = [];
        const values: TParamValue[] = [];
        let sql = `SELECT ${columns} FROM ${table}`;

        if (params) {
            for (let key in params) {
                query.push(`${key} = ?`);
                values.push(params[key]);
            }
            sql += ` WHERE ${query.join(` ${operand} `)}`;
        }

        return new Promise((resolve, reject) => {
            this.db.all(
                sql,
                values,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows as R[]);
                }
            );
        });
    }

    insert(table: string, columns: string[], values: TParamValue[]): Promise<{ id: number; changes: number }> {
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        return new Promise((resolve, reject) => {
            this.db.run(
                sql,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, changes: this.changes });
                }
            );
        });
    }

    update(table: string, setColumns: string[], setValues: TParamValue[], params: Params, operand: string = 'AND'): Promise<{ changes: number }> {
        const setClauses = setColumns.map(col => `${col} = ?`);
        const whereClauses: string[] = [];
        const allValues: TParamValue[] = [...setValues];

        for (let key in params) {
            whereClauses.push(`${key} = ?`);
            allValues.push(params[key]);
        }

        const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(` ${operand} `)}`;

        return new Promise((resolve, reject) => {
            this.db.run(
                sql,
                allValues,
                function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                }
            );
        });
    }

    delete(table: string, params: Params, operand: string = 'AND'): Promise<{ changes: number }> {
        const whereClauses: string[] = [];
        const values: TParamValue[] = [];

        for (let key in params) {
            whereClauses.push(`${key} = ?`);
            values.push(params[key]);
        }

        const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(` ${operand} `)}`;

        return new Promise((resolve, reject) => {
            this.db.run(
                sql,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                }
            );
        });
    }
}

export default ORM;