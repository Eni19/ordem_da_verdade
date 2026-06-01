import app from "../server/app.js";

// Vercel serverless function — export the Express app.
// O runtime Node.js do Vercel detecta o Express app e faz o wrap automático.
export default app;
