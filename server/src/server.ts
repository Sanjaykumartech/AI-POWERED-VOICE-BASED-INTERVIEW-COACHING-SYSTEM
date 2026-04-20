import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const start = async () => {
  await connectDatabase();

  app.listen(env.API_PORT, () => {
    console.log(`API server running on port ${env.API_PORT}`);
  });
};

void start();

