import express, { Router as ExpressRouter } from 'express';
import { notFoundHandler } from './handlers';
import Answer from '../Answer';

interface RouterOptions {
    answer: Answer;
}

function Router({ answer }: RouterOptions): ExpressRouter {
    const router = express.Router();

    router.all('/*path', notFoundHandler);
    return router;
}

export default Router;