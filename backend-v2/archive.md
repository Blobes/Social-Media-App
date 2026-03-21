// app.get("/healthz", (\_req: Request, res: Response) => {
// res.status(200).send("OK");
// });

ts-node: "^10.9.2"
nodemon: "^3.1.10"

services:

# --- API Gateway (The "Front Door") ---

- type: web
  name: funstakes-gateway
  env: node
  plan: free
  rootDir: backend-v2
  buildCommand: corepack enable && pnpm install && pnpm --filter @repo/gateway build
  startCommand: pnpm --filter @repo/gateway start
  domains:
  - api.funstakes.net
    envVars:
  - key: NODE_VERSION
    value: "22"
  - key: PORT
    value: "8000"
  - fromGroup: funstakes-common-secrets
  # --- Automatic Internal Service Discovery ---
  - key: AUTH_SERVICE_URL
    fromService:
    type: web
    name: funstakes-auth
    property: hostport
    # envVarKey: RENDER_DISCOVERY_SERVICE
  - key: POST_SERVICE_URL
    fromService:
    name: funstakes-post
    type: web
    property: hostport
  - key: USER_SERVICE_URL
    fromService:
    name: funstakes-user
    type: web
    property: hostport
  - key: WORKER_SERVICE_URL
    fromService:
    name: funstakes-worker
    type: web
    property: hostport
  - key: ADMIN_SERVICE_URL
    fromService:
    name: funstakes-admin
    type: web
    property: hostport
