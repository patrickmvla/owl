import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { auth } from "@/features/auth/config/auth-server";
import { errors } from "@/lib/utils/errors";
import {
  WatchlistParamsSchema,
  ItemParamsSchema,
  CreateWatchlistSchema,
  AddItemSchema,
} from "../schemas/watchlist-schemas";
import {
  getWatchlists,
  getWatchlist,
  createWatchlist,
  deleteWatchlist,
  getWatchlistItems,
  addWatchlistItem,
  removeWatchlistItem,
} from "../services/watchlist-service";

async function getUserId(c: Context): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user.id ?? null;
}

export const watchlistRoutes = new OpenAPIHono()

  .openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["Watchlist"],
      summary: "List watchlists",
      responses: { 200: { description: "User's watchlists", content: { "application/json": { schema: z.array(z.any()) } } }, 401: { description: "Unauthorized" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);
      const result = await getWatchlists(userId);
      return c.json(result, 200);
    },
  )

  .openapi(
    createRoute({
      method: "post",
      path: "/",
      tags: ["Watchlist"],
      summary: "Create watchlist",
      request: { body: { content: { "application/json": { schema: CreateWatchlistSchema } } } },
      responses: { 201: { description: "Watchlist created", content: { "application/json": { schema: z.any() } } }, 401: { description: "Unauthorized" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);
      const { name } = c.req.valid("json");
      const result = await createWatchlist(userId, name);
      return c.json(result, 201);
    },
  )

  .openapi(
    createRoute({
      method: "delete",
      path: "/{id}",
      tags: ["Watchlist"],
      summary: "Delete watchlist",
      request: { params: WatchlistParamsSchema },
      responses: { 200: { description: "Deleted" }, 401: { description: "Unauthorized" }, 404: { description: "Not found" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);
      const { id } = c.req.valid("param");
      const result = await deleteWatchlist(userId, id);
      if (!result) return c.json(errors.notFound(), 404);
      return c.json(result, 200);
    },
  )

  .openapi(
    createRoute({
      method: "get",
      path: "/{id}/items",
      tags: ["Watchlist"],
      summary: "List watchlist items",
      request: { params: WatchlistParamsSchema },
      responses: { 200: { description: "Items", content: { "application/json": { schema: z.array(z.any()) } } }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);
      const { id } = c.req.valid("param");
      const w = await getWatchlist(userId, id);
      if (!w) return c.json(errors.forbidden(), 403);
      const items = await getWatchlistItems(id);
      return c.json(items, 200);
    },
  )

  .openapi(
    createRoute({
      method: "post",
      path: "/{id}/items",
      tags: ["Watchlist"],
      summary: "Add item to watchlist",
      request: { params: WatchlistParamsSchema, body: { content: { "application/json": { schema: AddItemSchema } } } },
      responses: { 201: { description: "Item added", content: { "application/json": { schema: z.any() } } }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);
      const { id } = c.req.valid("param");
      const w = await getWatchlist(userId, id);
      if (!w) return c.json(errors.forbidden(), 403);
      const body = c.req.valid("json");
      const result = await addWatchlistItem(id, body);
      return c.json(result, 201);
    },
  )

  .openapi(
    createRoute({
      method: "delete",
      path: "/{id}/items/{itemId}",
      tags: ["Watchlist"],
      summary: "Remove item from watchlist",
      request: { params: ItemParamsSchema },
      responses: { 200: { description: "Item removed" }, 401: { description: "Unauthorized" }, 404: { description: "Not found" } },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);
      const { id, itemId } = c.req.valid("param");
      const w = await getWatchlist(userId, id);
      if (!w) return c.json(errors.forbidden(), 403);
      const result = await removeWatchlistItem(itemId);
      if (!result) return c.json(errors.notFound(), 404);
      return c.json(result, 200);
    },
  );
