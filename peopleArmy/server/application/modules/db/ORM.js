class ORM {
    /**
     * Создаёт экземпляр ORM.
     * @param {object} db — подключение к БД 
     */
    constructor(db) { 
        this.db = db; 
    }                

    /**
     * Выбирает одну строку из таблицы (SELECT ... LIMIT 1).
     * @param {string} table — имя таблицы.
     * @param {object|null} params — условия WHERE в виде { колонка: значение } (например { id: 1 }).
     * @param {string|string[]} columns — колонки для выборки: "*" или массив имён колонок.
     * @param {string} operand — связка условий: "AND" или "OR".
     * @returns {Promise<object|null>} — одна запись или null при ошибке.
     */
    get(table, params = null, columns = "*", operand = 'AND') {
        const query = [];
        const values = [];
        let sql = `SELECT ${columns} FROM ${table}`

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
                else resolve(row);
            });
        });
    }

    /**
     * Выбирает все подходящие строки из таблицы (SELECT).
     * @param {string} table — имя таблицы.
     * @param {object|null} params — условия WHERE в виде { колонка: значение }.
     * @param {string|string[]} columns — колонки для выборки: "*" или массив имён колонок.
     * @param {string} operand — связка условий: "AND" или "OR".
     * @returns {Promise<object[]>} — массив записей; при ошибке Promise отклоняется.
     */
    all(table, params = null, columns = "*", operand = 'AND') {
        const query = [];
        const values = [];
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
                    else resolve(rows);
                }
            );
        });
    }

    /**
     * Вставляет новую строку в таблицу (INSERT).
     * @param {string} table — имя таблицы.
     * @param {string[]} columns — массив имён колонок (например ["username", "email"]).
     * @param {any[]} values — массив значений в том же порядке, что и columns.
     * @returns {Promise<{id: number, changes: number}>} — lastID и количество изменённых строк; при ошибке Promise отклоняется.
     */
    insert(table, columns, values) {
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

    /**
     * Обновляет строки в таблице (UPDATE).
     * @param {string} table — имя таблицы.
     * @param {string[]} setColumns — колонки, которые нужно обновить.
     * @param {any[]} setValues — новые значения для setColumns в том же порядке.
     * @param {object} params — условия WHERE в виде { колонка: значение }.
     * @param {string} operand — связка условий WHERE: "AND" или "OR".
     * @returns {Promise<{changes: number}>} — количество обновлённых строк; при ошибке Promise отклоняется.
     */
    update(table, setColumns, setValues, params, operand = 'AND') {
        const setClauses = setColumns.map(col => `${col} = ?`);
        const whereClauses = [];
        const allValues = [...setValues];
        
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

    /**
     * Удаляет строки из таблицы (DELETE).
     * @param {string} table — имя таблицы.
     * @param {object} params — условия WHERE в виде { колонка: значение }.
     * @param {string} operand — связка условий: "AND" или "OR".
     * @returns {Promise<{changes: number}>} — количество удалённых строк; при ошибке Promise отклоняется.
     */
    delete(table, params, operand = 'AND') {
        const whereClauses = [];
        const values = [];
        
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

module.exports = ORM;