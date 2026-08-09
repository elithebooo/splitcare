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
		description: "Monthly prescription support",
		suggestedAmount: 18,
		icon: "pill",
	},
	{
		id: "home-care-visit",
		title: "Home care visit",
		description: "In-home care assistance",
		suggestedAmount: 45,
		icon: "home",
	},
	{
		id: "medical-transport",
		title: "Medical transport",
		description: "Ride to the clinic or hospital",
		suggestedAmount: 20,
		icon: "car",
	},
	{
		id: "monthly-care-plan",
		title: "Monthly care plan",
		description: "Shared monthly care support",
		suggestedAmount: 120,
		icon: "calendar",
	},
]

export const DEFAULT_MEMBER_NAMES = [
	"You",
	"Sibling",
	"Cousin",
	"Aunt",
	"Uncle",
	"Neighbour",
	"Friend",
	"Relative",
]

export function defaultMemberName(index: number): string {
	return DEFAULT_MEMBER_NAMES[index] ?? `Member ${index + 1}`
}
