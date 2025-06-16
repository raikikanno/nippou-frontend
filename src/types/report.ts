import { reportSchema } from "@/schema/reportSchema";
import { z } from "zod";

export type ReportInput = z.infer<typeof reportSchema>;
