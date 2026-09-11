#![cfg(test)]

use super::*;
use soroban_sdk::{
	testutils::{Address as _, Events as _},
	vec, Symbol, TryFromVal,
};

fn setup() -> (Env, SplitCareClient<'static>, Address) {
	let env = Env::default();
	env.mock_all_auths();
	let contract_id = env.register_contract(None, SplitCare);
	let client = SplitCareClient::new(&env, &contract_id);
	// Bind the generated address before moving `env` into the return tuple —
	// `(env, client, Address::generate(&env))` would move `env` first and then
	// borrow it (E0382 borrow of moved value).
	let admin = Address::generate(&env);
	(env, client, admin)
}

fn member(env: &Env, name: &str, amount: i128) -> (String, Address, i128) {
	(String::from_str(env, name), Address::generate(env), amount)
}

fn sample_members(env: &Env) -> Vec<(String, Address, i128)> {
	vec![&env, member(env, "You", 150_000_000), member(env, "Bob", 150_000_000)]
}

#[test]
fn create_and_read_expense() {
	let (env, client, creator) = setup();
	let id = String::from_str(&env, "expense-1");

	let expense = client.create_expense(
		&creator,
		&id,
		&String::from_str(&env, "Doctor visit"),
		&sample_members(&env),
	);

	assert_eq!(expense.total, 300_000_000i128);
	assert_eq!(expense.members.len(), 2);
	assert_eq!(expense.creator, creator);

	let loaded = client.get_expense(&id);
	assert_eq!(loaded.title, String::from_str(&env, "Doctor visit"));
	assert!(!loaded.members.get(0).unwrap().paid);

	assert_eq!(client.recent_ids(), vec![&env, id.clone()]);
}

#[test]
fn record_payment_marks_member_and_emits_event() {
	let (env, client, creator) = setup();
	let id = String::from_str(&env, "expense-2");
	let members = sample_members(&env);
	let bob_address = members.get(1).unwrap().1;

	client.create_expense(
		&creator,
		&id,
		&String::from_str(&env, "Medication refill"),
		&members,
	);

	let updated = client.record_payment(&id, &1u32, &bob_address, &String::from_str(&env, "abc123payhash"));

	let bob = updated.members.get(1).unwrap();
	assert!(bob.paid);
	assert_eq!(bob.paid_by, Some(bob_address.clone()));
	assert_eq!(bob.tx_hash, Some(String::from_str(&env, "abc123payhash")));
	assert!(!updated.members.get(0).unwrap().paid);

	// The latest event must be the "paid" event on the "splitcare" topic.
	// Note: soroban_sdk::Val has no PartialEq, so convert the topic to a Symbol
	// before comparing instead of using == on the raw Val.
	let all = env.events().all();
	let last = all.last().expect("expected at least one event");
	let topics = last.1.clone();
	let topic_val = topics.get(1).expect("expected a kind topic");
	let topic_sym = Symbol::try_from_val(&env, &topic_val).expect("topic should be a symbol");
	assert_eq!(topic_sym, symbol_short!("paid"));
}

#[test]
#[should_panic(expected = "member share already paid")]
fn double_payment_is_rejected() {
	let (env, client, creator) = setup();
	let id = String::from_str(&env, "expense-3");
	let members = sample_members(&env);
	let you_address = members.get(0).unwrap().1;
	client.create_expense(&creator, &id, &String::from_str(&env, "Home care"), &members);

	client.record_payment(&id, &0u32, &you_address, &String::from_str(&env, "hash-a"));
	client.record_payment(&id, &0u32, &you_address, &String::from_str(&env, "hash-b"));
}

#[test]
#[should_panic(expected = "expense id already exists")]
fn duplicate_expense_id_is_rejected() {
	let (env, client, creator) = setup();
	let id = String::from_str(&env, "expense-4");
	client.create_expense(&creator, &id, &String::from_str(&env, "One"), &sample_members(&env));
	client.create_expense(&creator, &id, &String::from_str(&env, "Two"), &sample_members(&env));
}

#[test]
#[should_panic(expected = "expense not found")]
fn reading_unknown_expense_fails() {
	let (env, client, _) = setup();
	client.get_expense(&String::from_str(&env, "missing"));
}

#[test]
fn recent_list_is_newest_first() {
	let (env, client, creator) = setup();
	for suffix in ["a", "b", "c"] {
		client.create_expense(
			&creator,
			&String::from_str(&env, suffix),
			&String::from_str(&env, "Title"),
			&sample_members(&env),
		);
	}

	let recent = client.recent_ids();
	assert_eq!(recent.len(), 3);
	assert_eq!(recent.get(0).unwrap(), String::from_str(&env, "c"));
	assert_eq!(recent.get(2).unwrap(), String::from_str(&env, "a"));
}

#[test]
#[should_panic(expected = "payer does not match the member address")]
fn payment_from_wrong_wallet_is_rejected() {
	let (env, client, creator) = setup();
	let id = String::from_str(&env, "expense-5");
	let members = sample_members(&env);
	client.create_expense(&creator, &id, &String::from_str(&env, "Physio"), &members);

	let stranger = Address::generate(&env);
	client.record_payment(&id, &0u32, &stranger, &String::from_str(&env, "hash-stranger"));
}

#[test]
#[should_panic(expected = "payment hash already used")]
fn payment_hash_cannot_be_reused_for_two_shares() {
	let (env, client, creator) = setup();
	let id = String::from_str(&env, "expense-6");
	let members = sample_members(&env);
	let you_address = members.get(0).unwrap().1;
	let bob_address = members.get(1).unwrap().1;
	client.create_expense(&creator, &id, &String::from_str(&env, "Lab work"), &members);

	let hash = String::from_str(&env, "same-hash");
	client.record_payment(&id, &0u32, &you_address, &hash);
	client.record_payment(&id, &1u32, &bob_address, &hash);
}

#[test]
fn identical_record_is_idempotent() {
	let (env, client, creator) = setup();
	let id = String::from_str(&env, "expense-7");
	let members = sample_members(&env);
	let you_address = members.get(0).unwrap().1;
	client.create_expense(&creator, &id, &String::from_str(&env, "Dentist"), &members);

	let hash = String::from_str(&env, "hash-retry");
	let first = client.record_payment(&id, &0u32, &you_address, &hash);
	let second = client.record_payment(&id, &0u32, &you_address, &hash);
	assert_eq!(first, second);
	assert!(second.members.get(0).unwrap().paid);
}
