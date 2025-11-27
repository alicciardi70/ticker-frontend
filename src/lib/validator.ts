import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(128),
  confirm: z.string().min(8),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords must match",
  path: ["confirm"],
});

export type RegisterForm = z.infer<typeof registerSchema>;
