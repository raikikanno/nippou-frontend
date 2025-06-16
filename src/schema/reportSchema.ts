import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const reportSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string().optional(),
    userName: z.string().optional(),
    team: z.string().optional(),
    date: z.string().optional(),
    tags: z.array(z.object({ name: z.string() })).default([]),
    content: z.string().min(1, "内容を入力してください"),
  })
  .passthrough();

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/reports",
    alias: "getReports",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/reports",
    alias: "createReport",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `新しい日報`,
        type: "Body",
        schema: reportSchema,
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/reports/:id",
    alias: "updateReport",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: reportSchema,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "delete",
    path: "/api/reports/:id",
    alias: "deleteReport",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
