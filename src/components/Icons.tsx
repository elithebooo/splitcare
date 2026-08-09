import type { CSSProperties, ReactNode } from "react"

import type { ExpenseIconKey } from "../types"

interface IconProps {
	size?: number
	style?: CSSProperties
}

function Icon({
	size = 18,
	children,
	style,
}: IconProps & { children: ReactNode }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			style={style}
		>
			{children}
		</svg>
	)
}

export function BrandMark({ size = 22 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
			<rect width="22" height="22" rx="6" fill="var(--accent)" />
			<circle
				cx="11"
				cy="11"
				r="6.4"
				fill="none"
				stroke="var(--accent-contrast)"
				strokeWidth="1.4"
				opacity="0.45"
			/>
			<path
				d="M11 4.6a6.4 6.4 0 0 1 5.54 9.6L11 11V4.6Z"
				fill="var(--accent-contrast)"
			/>
			<circle cx="11" cy="11" r="1.35" fill="var(--accent)" />
		</svg>
	)
}

export function Stethoscope(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M5 3v5.5a3.5 3.5 0 0 0 7 0V3" />
			<path d="M8.5 12.5v1.75a4.25 4.25 0 0 0 8.5 0V11" />
			<circle cx="17" cy="9.25" r="1.5" />
			<path d="M3.5 3h3M9.5 3h3" />
		</Icon>
	)
}

export function Pill(props: IconProps) {
	return (
		<Icon {...props}>
			<rect x="3" y="9" width="14" height="7" rx="3.5" transform="rotate(-35 10 12.5)" />
			<path d="M9 8.5l4 5.5" />
		</Icon>
	)
}

export function HomeIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M3.5 9.5 10 4l6.5 5.5" />
			<path d="M5.5 8.5V16a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8.5" />
			<path d="M8 17v-4h4v4" />
		</Icon>
	)
}

export function Car(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M4 13v-2.2a1 1 0 0 1 .3-.7l1.9-2a1 1 0 0 1 .7-.3h6.2a1 1 0 0 1 .7.3l1.9 2a1 1 0 0 1 .3.7V13" />
			<rect x="3" y="13" width="14" height="3" rx="1" />
			<circle cx="6.5" cy="16" r="1.1" />
			<circle cx="13.5" cy="16" r="1.1" />
		</Icon>
	)
}

export function CalendarIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<rect x="3.5" y="4.5" width="13" height="12" rx="1.5" />
			<path d="M3.5 8h13M7 3v3M13 3v3" />
		</Icon>
	)
}

export function Lab(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M8 3.5h4M8.5 3.5v4.8L4.9 14.6a1.6 1.6 0 0 0 1.4 2.4h7.4a1.6 1.6 0 0 0 1.4-2.4L11.5 8.3V3.5" />
			<path d="M6.7 12.5h6.6" />
		</Icon>
	)
}

export function Basket(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M4 8h12l-1.2 7.2a1.5 1.5 0 0 1-1.5 1.3H6.7a1.5 1.5 0 0 1-1.5-1.3L4 8Z" />
			<path d="M7 8 8.5 3.5M13 8l-1.5-4.5M8 11v3M12 11v3" />
		</Icon>
	)
}

export function Heart(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M10 16.3s-6-3.7-6-8.1a3.7 3.7 0 0 1 6-2.9 3.7 3.7 0 0 1 6 2.9c0 4.4-6 8.1-6 8.1Z" />
		</Icon>
	)
}

export function Check(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M4 10.5l3.5 3.5L16 5.5" />
		</Icon>
	)
}

export function CheckCircle(props: IconProps) {
	return (
		<Icon {...props}>
			<circle cx="10" cy="10" r="6.75" />
			<path d="M7 10.2l2.1 2.1L13.3 8" />
		</Icon>
	)
}

export function Plus(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M10 4.5v11M4.5 10h11" />
		</Icon>
	)
}

export function Minus(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M4.5 10h11" />
		</Icon>
	)
}

export function X(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M5 5l10 10M15 5 5 15" />
		</Icon>
	)
}

export function Lock(props: IconProps) {
	return (
		<Icon {...props}>
			<rect x="4.5" y="9" width="11" height="7.5" rx="1.5" />
			<path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
		</Icon>
	)
}

export function Unlock(props: IconProps) {
	return (
		<Icon {...props}>
			<rect x="4.5" y="9" width="11" height="7.5" rx="1.5" />
			<path d="M6.5 9V6.5a3.5 3.5 0 0 1 6.6-1.6" />
		</Icon>
	)
}

export function Copy(props: IconProps) {
	return (
		<Icon {...props}>
			<rect x="7.5" y="7.5" width="9" height="9" rx="1.5" />
			<path d="M12.5 7.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v6A1.5 1.5 0 0 0 5 12.5h2.5" />
		</Icon>
	)
}

export function Info(props: IconProps) {
	return (
		<Icon {...props}>
			<circle cx="10" cy="10" r="6.75" />
			<path d="M10 9v4.2" />
			<circle cx="10" cy="6.7" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
		</Icon>
	)
}

export function Alert(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M10 3.6 17 15.6H3L10 3.6Z" />
			<path d="M10 8.4v3.2" />
			<circle cx="10" cy="13.4" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
		</Icon>
	)
}

export function Refresh(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M16 6.5A6.4 6.4 0 0 0 4.4 8.5M4 3.5v5h5" />
			<path d="M4 13.5A6.4 6.4 0 0 0 15.6 11.5M16 16.5v-5h-5" />
		</Icon>
	)
}

export function ArrowUpRight(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M6 14 14 6M7.5 6H14v6.5" />
		</Icon>
	)
}

export function Power(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M10 3.5v6" />
			<path d="M6 5.6a6 6 0 1 0 8 0" />
		</Icon>
	)
}

export function User(props: IconProps) {
	return (
		<Icon {...props}>
			<circle cx="10" cy="7" r="3" />
			<path d="M4 16.5a6 6 0 0 1 12 0" />
		</Icon>
	)
}

export function CreditCard(props: IconProps) {
	return (
		<Icon {...props}>
			<rect x="2.5" y="5" width="15" height="10" rx="1.8" />
			<path d="M2.5 8.5h15" />
			<path d="M5.5 12h3" />
		</Icon>
	)
}

export function Gear(props: IconProps) {
	return (
		<Icon {...props}>
			<circle cx="10" cy="10" r="2.6" />
			<path d="M10 3.7v1.7M10 14.6v1.7M16.3 10h-1.7M5.4 10H3.7M14.5 5.5l-1.2 1.2M6.7 13.3l-1.2 1.2M14.5 14.5l-1.2-1.2M6.7 6.7 5.5 5.5" />
		</Icon>
	)
}

export function Sun(props: IconProps) {
	return (
		<Icon {...props}>
			<circle cx="10" cy="10" r="3.4" />
			<path d="M10 3v1.6M10 15.4V17M17 10h-1.6M4.6 10H3M14.8 5.2l-1.1 1.1M6.3 13.7l-1.1 1.1M14.8 14.8l-1.1-1.1M6.3 6.3 5.2 5.2" />
		</Icon>
	)
}

export function Moon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M16 12.3A6.6 6.6 0 1 1 7.7 4a5.2 5.2 0 0 0 8.3 8.3Z" />
		</Icon>
	)
}

export function Laptop(props: IconProps) {
	return (
		<Icon {...props}>
			<rect x="4" y="4.5" width="12" height="8" rx="1.2" />
			<path d="M2.5 15.5h15" />
		</Icon>
	)
}

export function ChevronRight(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M7.5 4.5 13 10l-5.5 5.5" />
		</Icon>
	)
}

export function Shield(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M10 3 16 5.3v4.6c0 4-2.6 6.4-6 7.6-3.4-1.2-6-3.6-6-7.6V5.3L10 3Z" />
			<path d="M7.3 9.8l1.9 1.9 3.5-3.9" />
		</Icon>
	)
}

export function Menu(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
		</Icon>
	)
}

export function LogOut(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M8.5 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h3.5" />
			<path d="M12.5 13.5 16.5 10l-4-3.5M16.5 10h-9" />
		</Icon>
	)
}

export function Wallet(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5v.3H4.5A1.5 1.5 0 0 0 3 8.3v7.2A1.5 1.5 0 0 0 4.5 17h10A1.5 1.5 0 0 0 16 15.5V9" />
			<rect x="3" y="6.8" width="13" height="9.7" rx="1.5" />
			<circle cx="13" cy="11.6" r="1" />
		</Icon>
	)
}

export function Bolt(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M11 3 5 11.5h4L9 17l6-8.5h-4L11 3Z" />
		</Icon>
	)
}

export function Layers(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M10 3.5 3 7.5l7 4 7-4-7-4Z" />
			<path d="M3 11.5l7 4 7-4M3 9.5l7 4 7-4" opacity="0" />
			<path d="M3.5 10.7 10 14.5l6.5-3.8" />
		</Icon>
	)
}

export const EXPENSE_ICONS: Record<ExpenseIconKey, (props: IconProps) => JSX.Element> = {
	stethoscope: Stethoscope,
	pill: Pill,
	home: HomeIcon,
	car: Car,
	calendar: CalendarIcon,
	lab: Lab,
	basket: Basket,
	heart: Heart,
}

export const EXPENSE_ICON_KEYS = Object.keys(EXPENSE_ICONS) as ExpenseIconKey[]

export function ExpenseIcon({ name, size }: { name: ExpenseIconKey; size?: number }) {
	const Component = EXPENSE_ICONS[name] ?? Heart
	return <Component size={size} />
}
