import { openLocalDatabase } from "../../../packages/database/src/index";
import { AccountStore } from "../../../packages/database/src/accounts";
import { createHandler } from "./handler";
const db = openLocalDatabase();
const server = Bun.serve({ hostname: "127.0.0.1", port: 4190, maxRequestBodySize: 16 * 1024, fetch: createHandler(new AccountStore(db)) });
console.log(`N19 local API: ${server.url}`);
