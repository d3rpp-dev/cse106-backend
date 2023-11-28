import * as z from 'zod';

export const AddTestSchema = z.object({
	result: z.number().lt(2).gte(0),
	test_type: z.string(),
});

export type AddTestRequest = z.infer<typeof AddTestSchema>;
