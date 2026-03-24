import sqlite3 from 'sqlite3';
interface Params {
    [key: string]: any;
}
declare class ORM {
    private db;
    constructor(db: sqlite3.Database);
    get(table: string, params?: Params | null, columns?: string, operand?: string): Promise<any>;
    all(table: string, params?: Params | null, columns?: string, operand?: string): Promise<any[]>;
    insert(table: string, columns: string[], values: any[]): Promise<{
        id: number;
        changes: number;
    }>;
    update(table: string, setColumns: string[], setValues: any[], params: Params, operand?: string): Promise<{
        changes: number;
    }>;
    delete(table: string, params: Params, operand?: string): Promise<{
        changes: number;
    }>;
}
export default ORM;
