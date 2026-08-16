import type { CareExpense } from "../types"

export const DEFAULT_EXPENSES: CareExpense[] = [
	{
		id: "doctor-visit",
		title: "Doctor visit",
		description: "Routine appointment or checkup",
		suggestedAmount: 30,
		icon: "stethoscope",
	},
	{
		id: "medication-refill",
		title: "Medication refill",
		description: "Prescription or pharmacy cost",
		suggestedAmount: 18,
		icon: "pill",
	},
	{
		id: "home-care-visit",
		title: "Home care visit",
		description: "In-home care support",
		suggestedAmount: 45,
		icon: "home",
	},
	{
		id: "medical-transport",
		title: "Medical transport",
		description: "Ride to a clinic or hospital",
		suggestedAmount: 20,
		icon: "car",
	},
	{
		id: "monthly-care-plan",
		title: "Care plan",
		description: "Shared care-related cost",
		suggestedAmount: 120,
		icon: "calendar",
	},
]

export function defaultMemberName(index: number): string {
	return index === 0 ? "You" : `Person ${index + 1}`
}
