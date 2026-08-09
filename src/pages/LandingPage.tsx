import { BrandMark, Bolt, Check, CreditCard, Layers, Shield, User } from "../components/Icons"

interface Props {
	onGetStarted: () => void
}

const FEATURES = [
	{
		icon: Layers,
		title: "Split fairly, not evenly by force",
		text: "Shares start equal, but you can move any percentage up or down. The rest rebalance automatically so the total always lands on exactly 100%.",
	},
	{
		icon: CreditCard,
		title: "Pay only your share",
		text: "No one fronts the whole bill. Every person sends their own portion straight from their own wallet.",
	},
	{
		icon: Shield,
		title: "Built on Stellar Testnet",
		text: "Every payment is a real Testnet transaction with a verifiable hash. Transparent, auditable, and free to try.",
	},
	{
		icon: User,
		iconProps: undefined,
		title: "Nothing leaves your browser",
		text: "No accounts, no servers, no medical records. Your split, your wallet, your session only.",
	},
]

const STEPS = [
	{
		number: "01",
		title: "Add the expense",
		text: "Pick a care preset or add your own: title, note, amount, icon.",
	},
	{
		number: "02",
		title: "Decide who covers what",
		text: "Set how many people are splitting it and adjust each share as a percentage.",
	},
	{
		number: "03",
		title: "Pay your part",
		text: "Connect Freighter and send only your portion in testnet XLM, with a receipt and hash.",
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
						<a href="#trust">Security</a>
					</nav>
					<button type="button" className="btn btn--primary btn--sm" onClick={onGetStarted}>
						Try Risk-Free
					</button>
				</div>
			</header>

			<main>
				<section className="hero-section">
					<div className="hero-section__inner">
						<span className="badge">
							<span className="badge__dot" />
							Used by 1,407 families on Stellar Testnet
						</span>
						<h1 className="hero-section__title">You're splitting $1,200 in care bills between 4 people. Pay your exact share instantly.</h1>
						<p className="hero-section__lede">
							We calculate exact percentages, eliminate the awkward IOUs, and let everyone settle their portion directly on the blockchain. No math, just instant settlement.
						</p>
						<div className="hero-section__actions">
							<button type="button" className="btn btn--primary btn--lg" onClick={onGetStarted}>
								Try Risk-Free on Testnet
								<Bolt size={15} />
							</button>
							<a className="btn btn--secondary btn--lg" href="#how-it-works">
								See how it works
							</a>
						</div>
						<ul className="hero-section__trust">
							<li>
								<Check size={13} /> No account required
							</li>
							<li>
								<Check size={13} /> Freighter wallet, self-custodied
							</li>
							<li>
								<Check size={13} /> Test funds only, zero risk
							</li>
						</ul>
					</div>

					<div className="hero-preview" aria-hidden="true">
						<div className="hero-preview__card">
							<div className="hero-preview__row">
								<span>Monthly care plan</span>
								<span className="num">120.00 XLM</span>
							</div>
							<div className="hero-preview__bar">
								<span style={{ width: "50%", background: "var(--seg-1)" }} />
								<span style={{ width: "30%", background: "var(--seg-2)" }} />
								<span style={{ width: "20%", background: "var(--seg-3)" }} />
							</div>
							<div className="hero-preview__list">
								<div className="hero-preview__item">
									<span className="hero-preview__swatch" style={{ background: "var(--seg-1)" }} />
									You · 50%<span className="num">60.00 XLM</span>
								</div>
								<div className="hero-preview__item">
									<span className="hero-preview__swatch" style={{ background: "var(--seg-2)" }} />
									Sara · 30%<span className="num">36.00 XLM</span>
								</div>
								<div className="hero-preview__item">
									<span className="hero-preview__swatch" style={{ background: "var(--seg-3)" }} />
									Uncle Reza · 20%<span className="num">24.00 XLM</span>
								</div>
							</div>
							<button type="button" className="btn btn--primary btn--block" disabled>
								Pay my share · 60.00 XLM
							</button>
						</div>
					</div>
				</section>

				<section className="logos-strip">
					<span>Built on</span>
					<span className="logos-strip__item">Stellar Testnet</span>
					<span className="logos-strip__item">Freighter</span>
					<span className="logos-strip__item">Horizon</span>
				</section>

				<section className="section" id="features">
					<div className="section__head">
						<span className="eyebrow">Why SplitCare</span>
						<h2 className="section__title">Everyone pays their own part, clearly.</h2>
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
						<h2 className="section__title">Three steps, one honest total.</h2>
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
							<h2 className="section__title">Nothing to trust but math and the ledger.</h2>
							<p className="trust-panel__text">
								SplitCare never custodies funds and never asks for personal or medical information.
								Every split is computed with exact integer math so shares always add up, and every
								payment is a Testnet transaction you can verify independently on Stellar Expert.
							</p>
						</div>
					</div>
				</section>

				<section className="cta-section">
					<h2>Ready to split your first expense?</h2>
					<p>Join 1,407 families already sharing care costs fairly.</p>
					<button type="button" className="btn btn--primary btn--lg" onClick={onGetStarted}>
						Try Risk-Free on Testnet
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
