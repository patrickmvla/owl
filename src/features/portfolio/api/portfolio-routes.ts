import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { auth } from "@/features/auth/config/auth-server";
import { errors } from "@/lib/utils/errors";
import {
  CreatePortfolioSchema,
  CreateHoldingSchema,
  UpdateHoldingSchema,
  PortfolioParamsSchema,
  HoldingParamsSchema,
  PortfolioSchema,
  HoldingSchema,
} from "../schemas/portfolio-schemas";
import {
  createPortfolio,
  getPortfolios,
  getPortfolio,
  deletePortfolio,
  createHolding,
  getHoldings,
  updateHolding,
  deleteHolding,
} from "../services/portfolio-service";

/** Get authenticated userId or null */
async function getUserId(c: Context): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user.id ?? null;
}

export const portfolioRoutes = new OpenAPIHono()

  /** List user's portfolios */
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["Portfolio"],
      summary: "List portfolios",
      responses: {
        200: {
          content: { "application/json": { schema: z.array(PortfolioSchema) } },
          description: "User's portfolios",
        },
        401: { description: "Unauthorized" },
      },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);

      const portfolios = await getPortfolios(userId);
      return c.json(portfolios, 200);
    },
  )

  /** Create portfolio */
  .openapi(
    createRoute({
      method: "post",
      path: "/",
      tags: ["Portfolio"],
      summary: "Create portfolio",
      request: { body: { content: { "application/json": { schema: CreatePortfolioSchema } } } },
      responses: {
        201: {
          content: { "application/json": { schema: PortfolioSchema } },
          description: "Portfolio created",
        },
        401: { description: "Unauthorized" },
      },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);

      const { name } = c.req.valid("json");
      const result = await createPortfolio(userId, name);
      return c.json(result, 201);
    },
  )

  /** Delete portfolio */
  .openapi(
    createRoute({
      method: "delete",
      path: "/{id}",
      tags: ["Portfolio"],
      summary: "Delete portfolio",
      request: { params: PortfolioParamsSchema },
      responses: {
        200: {
          content: { "application/json": { schema: PortfolioSchema } },
          description: "Portfolio deleted",
        },
        401: { description: "Unauthorized" },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);

      const { id } = c.req.valid("param");
      const result = await deletePortfolio(userId, id);
      if (!result) return c.json(errors.notFound("Portfolio"), 404);
      return c.json(result, 200);
    },
  )

  /** List holdings in a portfolio */
  .openapi(
    createRoute({
      method: "get",
      path: "/{id}/holdings",
      tags: ["Portfolio"],
      summary: "List holdings",
      request: { params: PortfolioParamsSchema },
      responses: {
        200: {
          content: { "application/json": { schema: z.array(HoldingSchema) } },
          description: "Portfolio holdings",
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);

      const { id } = c.req.valid("param");
      const p = await getPortfolio(userId, id);
      if (!p) return c.json(errors.forbidden(), 403);

      const holdings = await getHoldings(id);
      return c.json(holdings, 200);
    },
  )

  /** Add holding to portfolio */
  .openapi(
    createRoute({
      method: "post",
      path: "/{id}/holdings",
      tags: ["Portfolio"],
      summary: "Add holding",
      request: {
        params: PortfolioParamsSchema,
        body: { content: { "application/json": { schema: CreateHoldingSchema } } },
      },
      responses: {
        201: {
          content: { "application/json": { schema: HoldingSchema } },
          description: "Holding added",
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);

      const { id } = c.req.valid("param");
      const p = await getPortfolio(userId, id);
      if (!p) return c.json(errors.forbidden(), 403);

      const body = c.req.valid("json");
      const result = await createHolding(id, body);
      return c.json(result, 201);
    },
  )

  /** Update holding */
  .openapi(
    createRoute({
      method: "patch",
      path: "/{id}/holdings/{holdingId}",
      tags: ["Portfolio"],
      summary: "Update holding",
      request: {
        params: HoldingParamsSchema,
        body: { content: { "application/json": { schema: UpdateHoldingSchema } } },
      },
      responses: {
        200: {
          content: { "application/json": { schema: HoldingSchema } },
          description: "Holding updated",
        },
        401: { description: "Unauthorized" },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);

      const { id, holdingId } = c.req.valid("param");
      const p = await getPortfolio(userId, id);
      if (!p) return c.json(errors.forbidden(), 403);

      const body = c.req.valid("json");
      const result = await updateHolding(holdingId, body);
      if (!result) return c.json(errors.notFound("Portfolio"), 404);
      return c.json(result, 200);
    },
  )

  /** Delete holding */
  .openapi(
    createRoute({
      method: "delete",
      path: "/{id}/holdings/{holdingId}",
      tags: ["Portfolio"],
      summary: "Delete holding",
      request: { params: HoldingParamsSchema },
      responses: {
        200: {
          content: { "application/json": { schema: HoldingSchema } },
          description: "Holding deleted",
        },
        401: { description: "Unauthorized" },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json(errors.unauthorized(), 401);

      const { id, holdingId } = c.req.valid("param");
      const p = await getPortfolio(userId, id);
      if (!p) return c.json(errors.forbidden(), 403);

      const result = await deleteHolding(holdingId);
      if (!result) return c.json(errors.notFound("Portfolio"), 404);
      return c.json(result, 200);
    },
  );
