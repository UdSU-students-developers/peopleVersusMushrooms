import { Router as ExpressRouter } from 'express';
interface RouterOptions {
    answer: any;
}
declare function Router({ answer }: RouterOptions): ExpressRouter;
export default Router;
