import * as z from 'zod';

export const createIssueSchema = z
	.object({
		subject: z.string().max(100),
		description: z.string().max(2000),
	})
	.strict();

export type CreateIssueRequest = z.infer<typeof createIssueSchema>;
