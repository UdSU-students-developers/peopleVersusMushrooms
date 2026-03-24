import express, { Router as ExpressRouter } from 'express';
import { notFoundHandler } from './handlers';

interface RouterOptions {
    answer: any;
}

function Router({ answer }: RouterOptions): ExpressRouter {
    const router = express.Router();

    router.all('/*path', notFoundHandler);
    return router;
}

export default Router;