import { z } from 'zod';

export const userProfileSchema = z.object({
  name: z.string().min(2),
  age: z.number().min(10).max(120),
  weight: z.number().positive(),
  height: z.number().positive(),
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;
