import { z } from "zod";

const dateStringSchema = z.string().date("Invalid Date Format, Expected YYYY-MM-DD.");

export const dashboardQuerySchema = z
  .object({
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
  })
  .refine(
    (data) => {
      if (!data.from || !data.to) {
        return true;
      }
      return data.from <= data.to;
    },
    {
      message: "'from' date must be before or equal to 'to' date.",
      path: ["from"],
    },
  )
  .refine(
    (data) => {
      if (!data.from || !data.to) {
        return true;
      }
      const from = new Date(`${data.from}T00:00:00.000Z`);
      const to = new Date(`${data.to}T00:00:00.000Z`);

      const differenceInDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);

      return differenceInDays <= 365;
    },
    {
      message: "Dashboard date range cannot exceed 365 days.",
      path: ["to"],
    },
  );

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
