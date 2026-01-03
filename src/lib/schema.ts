import { z } from "zod";

export const loginSchema = z.object({
  userName: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const orderSchema = z.object({
  discount: z.number().optional(),
  paid: z.number().optional(),
  products: z
    .array(
      z.object({
        id: z.number(),
        quantity: z.number().optional(),
        notes: z.string().optional(),
        price: z.number().optional(),
      })
    )
    .optional(),
});

export type OrderSchemaType = z.infer<typeof orderSchema>;
