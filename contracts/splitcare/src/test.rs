#![cfg(test)]

use super::*;
use soroban_sdk::{
	testutils::{Address as _, Events as _},
	vec, IntoVal, Val,
};

fn setup() -> (Env, SplitCareClient<'static>, Address) {
	let env = Env::default();
	env.mock_all_auths();
	let contract_id = env.register_contract(None, SplitCare);
	let client = SplitCareClient::new(&env, &contract_id);
	(env, client, Address::generate(&env))
}

fn sample_members(env: &Env) -> Vec<(String, i128)> {
	vec![
		&env,
		(String::from_str(env, "You"), 150_000_000i128),
		(String::from_str(env, "Bob"), 150_000_000i128),
	]
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
	client.create_expense(
		&creator,
		&id,
		&String::from_str(&env, "Medication refill"),
		&sample_members(&env),
	);

	let payer = Address::generate(&env);
	let updated = client.record_payment(&id, &1u32, &payer, &String::from_str(&env, "abc123payhash"));

	let bob = updated.members.get(1).unwrap();
	assert!(bob.paid);
	assert_eq!(bob.paid_by, Some(payer.clone()));
	assert_eq!(bob.tx_hash, Some(String::from_str(&env, "abc123payhash")));
	assert!(!updated.members.get(0).unwrap().paid);

	// The latest event must be the "paid" event on the "splitcare" topic.
	let all = env.events().all();
	let (_, topics, _) = all.last().unwrap();
	let expected_topic: Val = symbol_short!("paid").into_val(&env);
	assert_eq!(topics.get(1).unwrap(), expected_topic);
}

#[test]
#[should_panic(expected = "member share already paid")]
fn double_payment_is_rejected() {
	let (env, client, creator) = setup();
	let id = String::from_str(&env, "expense-3");
	client.create_expense(&creator, &id, &String::from_str(&env, "Home care"), &sample_members(&env));

	let payer = Address::generate(&env);
	client.record_payment(&id, &0u32, &payer, &String::from_str(&env, "hash-a"));
	client.record_payment(&id, &0u32, &payer, &String::from_str(&env, "hash-b"));
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
