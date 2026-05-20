import { Router } from "express";
import { handlePostFinalizer } from "./handlers";

const router: Router = Router();

/**
 * Internal bridge for secure execution workers.
 * Node acts strictly as a data-access layer for Go engine outputs.
 */
router.post("/finalize-post", handlePostFinalizer);

export { router as internalRouter };
