import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";

/**
 * Builds a standard REST router (list/get/create/update/delete) around a
 * set of CRUD handlers from crudFactory, with auth + tenant resolution
 * already applied. Keeps every simple-resource route file to ~3 lines.
 */
export function buildCrudRouter(handlers: {
  list: any;
  getOne: any;
  create: any;
  update: any;
  remove: any;
}) {
  const router = Router();
  router.use(requireAuth, resolveTenant);
  router.get("/", handlers.list);
  router.get("/:id", handlers.getOne);
  router.post("/", handlers.create);
  router.patch("/:id", handlers.update);
  router.delete("/:id", handlers.remove);
  return router;
}
