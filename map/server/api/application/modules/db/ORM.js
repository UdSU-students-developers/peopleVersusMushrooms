class ORM {
    constructor(db) {
        this.db = db;
    }

    async get(table, condition, fields = '*', operand = 'AND') {
        try {
            let sql = `SELECT ${fields} FROM ${table}`;
            const conditions = [];
            const params = [];
            
            if (condition) {
                Object.keys(condition).forEach(key => {
                    conditions.push(`${key} = ?`);
                    params.push(condition[key]);
                });
                sql += ` WHERE ${conditions.join(` ${operand} `)}`;
            }
            
            return await this.db.query(sql, params);
        } catch (e) {
            return null;
        }
    }

    async all(table, condition = null, fields = '*', operand = 'AND', orderBy = '', desc = false, limit = '') {
        try {
            let sql = `SELECT ${fields} FROM ${table}`;
            const conditions = [];
            const params = [];
            
            if (condition) {
                Object.keys(condition).forEach(key => {
                    conditions.push(`${key} = ?`);
                    params.push(condition[key]);
                });
                sql += ` WHERE ${conditions.join(` ${operand} `)}`;
            }
            
            if (orderBy) {
                sql += ` ORDER BY ${orderBy}`;
                sql += desc ? ' DESC' : ' ASC';
            }
            
            if (limit) {
                sql += ` LIMIT ${limit}`;
            }
            
            return await this.db.queryAll(sql, params);
        } catch (e) {
            return null;
        }
    }

    async update(table, condition, field, operand = 'AND') {
        try {
            let sql = `UPDATE ${table}`;
            const fields = [];
            const conditions = [];
            const params = [];
            
            if (field) {
                Object.keys(field).forEach(key => {
                    fields.push(`${key} = ?`);
                    params.push(field[key]);
                });
                sql += ` SET ${fields.join(', ')}`;
            }
            
            if (condition) {
                Object.keys(condition).forEach(key => {
                    conditions.push(`${key} = ?`);
                    params.push(condition[key]);
                });
                sql += ` WHERE ${conditions.join(` ${operand} `)}`;
            }
            
            const result = await this.db.execute(sql, params);
            return result.changes > 0;
        } catch (e) {
            return null;
        }
    }

    async insert(table, field) {
        try {
            let sql = `INSERT INTO ${table}`;
            const fields = [];
            const placeholders = [];
            const params = [];
            
            if (field) {
                Object.keys(field).forEach(key => {
                    fields.push(key);
                    placeholders.push('?');
                    params.push(field[key]);
                });
                sql += ` (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            }
            
            const result = await this.db.execute(sql, params);
            return result.lastID;
        } catch (e) {
            return null;
        }
    }
    
    async delete(table, condition, operand = 'AND') {
        try {
            let sql = `DELETE FROM ${table}`;
            const conditions = [];
            const params = [];
            
            if (condition) {
                Object.keys(condition).forEach(key => {
                    conditions.push(`${key} = ?`);
                    params.push(condition[key]);
                });
                sql += ` WHERE ${conditions.join(` ${operand} `)}`;
            }
            
            const result = await this.db.execute(sql, params);
            return result.changes > 0;
        } catch (e) {
            return null;
        }
    }
}

module.exports = ORM;