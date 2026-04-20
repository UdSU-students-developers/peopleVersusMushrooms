import { Request, Response } from 'express';

export const notFoundHandler = (_: Request, res: Response): void => {
    res.send('not found');
};