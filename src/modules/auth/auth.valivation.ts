import * as z from "zod";

export const signInSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(4),
  }),
};

export const signUpSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(4),
  }),
};

export type ISignInType = z.infer<typeof signInSchema.body>;
export type ISignUpType = z.infer<typeof signUpSchema.body>;

