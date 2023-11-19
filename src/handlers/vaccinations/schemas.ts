import * as z from 'zod';

export const AddVaccineSchema = z.object({
	brand: z.string(),
	location: z.string(),
	user: z.string(),
});

export type AddVaccineRequest = z.infer<typeof AddVaccineSchema>;
