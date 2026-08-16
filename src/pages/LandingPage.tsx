import { BrandMark, Bolt, Check, CreditCard, Layers, Shield, User } from "../components/Icons"

interface Props {
	onGetStarted: () => void
}

const FEATURES = [
	{
		icon: Layers,
		title: "Split the bill the way people actually agreed",
		text: "Start with an even split, then adjust any share. SplitCare keeps the total at 100% without turning it into spreadsheet work.",
	},
	{
		icon: CreditCard,
		title: "Send one share, not the whole bill",
		text: "Each person can pay their own part from Freighter. No one has to cover everything first and chase people later.",
	},
	{
		icon: Shield,
		title: "Real Testnet payments",
		text: "Payments run on Stellar Testnet, so you can test the full flow and still get a transaction hash you can check.",
	},
	{
		icon: User,
		title: "No sign-up, no records to upload",
		text: "This demo does not ask for medical details or an account. The split lives in your browser session.",
	},
]

const STEPS = [
	{
		number: "01",
		title: "Choose the expense",
		text: "Use a care preset or add a custom cost with a short note and amount.",
	},
	{
		number: "02",
		title: "Set the split",
		text: "Add the people involved, pick who is paying, and tune the percentages.",
	},
	{
		number: "03",
		title: "Pay your share",
		text: "Connect Freighter, confirm the payment, then keep the Testnet receipt hash.",
	},
]

export function LandingPage({ onGetStarted }: Props) {
	return (
		<div className="landing">
			<header className="landing-nav">
				<div className="landing-nav__inner">
					<span className="brand">
						<BrandMark size={22} />
						<span className="brand__name">SplitCare</span>
					</span>
					<nav className="landing-nav__links" aria-label="Sections">
						<a href="#features">Features</a>
						<a href="#how-it-works">How it works</a>
						<a href="#trust">Privacy</a>
					</nav>
					<button type="button" className="btn btn--primary btn--sm" onClick={onGetStarted}>
						Open demo
					</button>
				</div>
			</header>

			<main>
				<section className="hero-section">
					<div className="hero-section__inner">
						<span className="badge">
							<span className="badge__dot" />
							Stellar Testnet demo · Freighter wallet
						</span>
						<h1 className="hero-section__title">Split a care expense, then pay only your part.</h1>
						<p className="hero-section__lede">
							SplitCare is for those small but sensitive shared costs: a clinic visit, a refill, a ride, a monthly care plan. Set the percentages, connect Freighter, and send your share on Stellar Testnet.
						</p>
						<div className="hero-section__actions">
							<button type="button" className="btn btn--primary btn--lg" onClick={onGetStarted}>
								Try the payment flow
								<Bolt size={15} />
							</button>
							<a className="btn btn--secondary btn--lg" href="#how-it-works">
								See the steps
							</a>
						</div>
						<ul className="hero-section__trust">
							<li>
								<Check size={13} /> No SplitCare account
							</li>
							<li>
								<Check size={13} /> Testnet XLM only
							</li>
							<li>
								<Check size={13} /> Verifiable transaction hash
							</li>
						</ul>
					</div>

					<div className="hero-preview" aria-hidden="true">
						<div className="hero-preview__card">
							<div className="hero-preview__row">
								<span>Choose an expense</span>
								<span className="num">Enter total</span>
							</div>
							<div className="hero-preview__bar">
								<span style={{ width: "40%", background: "var(--seg-1)" }} />
								<span style={{ width: "35%", background: "var(--seg-2)" }} />
								<span style={{ width: "25%", background: "var(--seg-3)" }} />
							</div>
							<div className="hero-preview__list">
								<div className="hero-preview__item">
									<span className="hero-preview__swatch" style={{ background: "var(--seg-1)" }} />
									Add people<span className="num">Set shares</span>
								</div>
								<div className="hero-preview__item">
									<span className="hero-preview__swatch" style={{ background: "var(--seg-2)" }} />
									Pick payer<span className="num">Review amount</span>
								</div>
								<div className="hero-preview__item">
									<span className="hero-preview__swatch" style={{ background: "var(--seg-3)" }} />
									Confirm payment<span className="num">Get receipt</span>
								</div>
							</div>
							<button type="button" className="btn btn--primary btn--block" disabled>
								Open the demo to enter your own split
							</button>
						</div>
					</div>
				</section>

				<section className="logos-strip">
					<span>Built with</span>
					<span className="logos-strip__item">Stellar Testnet</span>
					<span className="logos-strip__item">Freighter</span>
					<span className="logos-strip__item">Horizon</span>
				</section>

				<section className="section" id="features">
					<div className="section__head">
						<span className="eyebrow">Why SplitCare</span>
						<h2 className="section__title">Simple enough for a demo, careful enough for the use case.</h2>
					</div>
					<div className="feature-grid">
						{FEATURES.map((feature) => {
							const Icon = feature.icon
							return (
								<div key={feature.title} className="feature-card">
									<span className="feature-card__icon">
										<Icon size={18} />
									</span>
									<h3>{feature.title}</h3>
									<p>{feature.text}</p>
								</div>
							)
						})}
					</div>
				</section>

				<section className="section section--muted" id="how-it-works">
					<div className="section__head">
						<span className="eyebrow">How it works</span>
						<h2 className="section__title">A clear split, a clear payment, a clear receipt.</h2>
					</div>
					<div className="steps-grid">
						{STEPS.map((step) => (
							<div key={step.number} className="step-card">
								<span className="step-card__number">{step.number}</span>
								<h3>{step.title}</h3>
								<p>{step.text}</p>
							</div>
						))}
					</div>
				</section>

				<section className="section" id="trust">
					<div className="trust-panel">
						<div className="trust-panel__icon">
							<Shield size={26} />
						</div>
						<div>
							<h2 className="section__title">No medical data. No custody. Just the split.</h2>
							<p className="trust-panel__text">
								SplitCare does not store accounts, private keys, or care records. It calculates the split in the browser, asks Freighter to sign, and sends the transaction to Stellar Testnet. The receipt hash is there so you can verify the result yourself.
							</p>
						</div>
					</div>
				</section>

				<section className="cta-section">
					<h2>Try a split from start to finish.</h2>
					<p>Use Testnet XLM, connect Freighter, and see the receipt flow without touching real funds.</p>
					<button type="button" className="btn btn--primary btn--lg" onClick={onGetStarted}>
						Open the demo
					</button>
				</section>
			</main>

			<footer className="footer">
				<div className="footer__inner">
					<span>SplitCare · Stellar Testnet demo. Test XLM only. Never real funds.</span>
					<span className="footer__links">
						<a href="https://laboratory.stellar.org/#account-creator?network=test" target="_blank" rel="noreferrer">
							Stellar Laboratory
						</a>
						<a href="https://www.freighter.app/" target="_blank" rel="noreferrer">
							Freighter
						</a>
						<a href="https://developers.stellar.org/docs" target="_blank" rel="noreferrer">
							Stellar docs
						</a>
					</span>
				</div>
			</footer>
		</div>
	)
}
