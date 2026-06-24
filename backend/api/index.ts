// Vercel serverless entry point — re-exports the Express app as a handler.
// Vercel wraps this in a serverless function automatically.
import app from '../src/app';

export default app;
