import * as z from 'zod';

export const LoginSchema = z
	.object({
		email: z.string().email(),
		password: z.string(),
	})
	.strict();

export type LoginRequest = z.infer<typeof LoginSchema>;

export const SignUpSchema = z
	.object({
		email: z.string().email(),
		password: z.string(),

		given_name: z.string(),
		family_name: z.string(),

		nhi_number: z.string(),
		dob_ts: z.number(),
	})
	.strict();

export type SignUpRequest = z.infer<typeof SignUpSchema>;
