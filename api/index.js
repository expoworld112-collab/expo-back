import serverless from 'serverless-http';
import app from '../index.js'; // path to your main Express app

export const handler = serverless(app);
