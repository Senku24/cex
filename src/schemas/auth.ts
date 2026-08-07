import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().min(3).max(30).trim(),

  password: z.string().min(8).max(100),
});

export type SignupInput = z.infer<typeof signupSchema>;