#![no_std]

//! SplitCare Soroban contract.
//!
//! The frontend pays shares with regular Stellar XLM payments first, then
//! records the result on-chain here. The contract keeps a public, verifiable
//! ledger of expenses and which member shares have been paid, and emits
//! events so clients can sync in near real-time.

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

#[cfg(test)]
mod test;

/// How many expense ids are kept in the global "recent" list.
const RECENT_CAP: u32 = 25;

/// Storage TTL management (in ledgers, ~5s each on testnet).
const TTL_THRESHOLD: u32 = 60_000; // ~3.4 days
const TTL_EXTEND_TO: u32 = 535_680; // ~30 days

/// One member's share of an expense.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberShare {
	pub name: String,
	/// Owed share in stroops (1 XLM = 10_000_000 stroops).
	pub amount: i128,
	pub paid: bool,
	/// Wallet that authorized the payment record.
	pub paid_by: Option<Address>,
	/// Hash of the underlying XLM payment transaction.
	pub tx_hash: Option<String>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Expense {
	pub id: String,
	pub creator: Address,
	pub title: String,
	/// Sum of all member shares, in stroops.
	pub total: i128,
	pub members: Vec<MemberShare>,
	pub created_ledger: u32,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
	Expense(String),
	/// Newest-first list of expense ids, capped at RECENT_CAP.
	Recent,
}

fn bump_ttl(env: &Env, key: &DataKey) {
	env.storage()
		.persistent()
		.extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

#[contract]
pub struct SplitCare;

#[contractimpl]
impl SplitCare {
	/// Publishes a new expense with its member shares.
	/// The creator authorizes the call. Emits `splitcare/created`.
	pub fn create_expense(
		env: Env,
		creator: Address,
		id: String,
		title: String,
		members: Vec<(String, i128)>,
	) -> Expense {
		creator.require_auth();

		assert!(!members.is_empty(), "expense needs at least one member");
		assert!(members.len() <= 12, "too many members");

		let key = DataKey::Expense(id.clone());
		assert!(
			!env.storage().persistent().has(&key),
			"expense id already exists"
		);

		let mut total: i128 = 0;
		let mut shares: Vec<MemberShare> = Vec::new(&env);
		for entry in members.iter() {
			let (name, amount) = entry;
			assert!(amount > 0, "share amounts must be positive");
			total += amount;
			shares.push_back(MemberShare {
				name,
				amount,
				paid: false,
				paid_by: None,
				tx_hash: None,
			});
		}

		let expense = Expense {
			id: id.clone(),
			creator: creator.clone(),
			title: title.clone(),
			total,
			members: shares,
			created_ledger: env.ledger().sequence(),
		};
		env.storage().persistent().set(&key, &expense);
		bump_ttl(&env, &key);

		let recent_key = DataKey::Recent;
		let mut recent: Vec<String> = env
			.storage()
			.persistent()
			.get(&recent_key)
			.unwrap_or(Vec::new(&env));
		recent.push_front(id.clone());
		while recent.len() > RECENT_CAP {
			recent.pop_back();
		}
		env.storage().persistent().set(&recent_key, &recent);
		bump_ttl(&env, &recent_key);

		env.events().publish(
			(symbol_short!("splitcare"), symbol_short!("created")),
			(id, creator, title, total, expense.members.clone()),
		);

		expense
	}

	/// Marks one member's share as paid. The payer authorizes the call and
	/// provides the hash of the underlying XLM payment. Emits `splitcare/paid`.
	pub fn record_payment(
		env: Env,
		id: String,
		member_index: u32,
		payer: Address,
		tx_hash: String,
	) -> Expense {
		payer.require_auth();

		let key = DataKey::Expense(id.clone());
		let mut expense: Expense = env
			.storage()
			.persistent()
			.get(&key)
			.expect("expense not found");

		assert!(
			(member_index as usize) < expense.members.len() as usize,
			"member index out of range"
		);

		let mut member = expense.members.get(member_index).expect("member not found");
		assert!(!member.paid, "member share already paid");

		member.paid = true;
		member.paid_by = Some(payer.clone());
		member.tx_hash = Some(tx_hash.clone());
		let amount = member.amount;
		expense.members.set(member_index, member);

		env.storage().persistent().set(&key, &expense);
		bump_ttl(&env, &key);

		env.events().publish(
			(symbol_short!("splitcare"), symbol_short!("paid")),
			(id, member_index, payer, amount, tx_hash),
		);

		expense
	}

	/// Reads one expense by id.
	pub fn get_expense(env: Env, id: String) -> Expense {
		env.storage()
			.persistent()
			.get(&DataKey::Expense(id))
			.expect("expense not found")
	}

	/// Newest-first list of recent expense ids.
	pub fn recent_ids(env: Env) -> Vec<String> {
		env.storage()
			.persistent()
			.get(&DataKey::Recent)
			.unwrap_or(Vec::new(&env))
	}
}
