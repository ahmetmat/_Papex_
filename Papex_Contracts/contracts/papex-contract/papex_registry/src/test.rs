#![cfg(test)]

use super::*;
use core::option::Option;
use soroban_sdk::{
    testutils::{Address as _},
    Address, Env, String,
};

#[test]
fn register_and_tokenize_paper() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let author = Address::generate(&env);
    let token_contract = Address::generate(&env);

    let contract_id = env.register_contract(None, PapexRegistry);
    let client = PapexRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    assert_eq!(client.admin(), admin);
    assert_eq!(client.next_id(), 0);

    let metadata = String::from_str(&env, "ipfs://paper/123");
    let doi = Option::Some(String::from_str(&env, "10.1234/example"));
    let paper_id = client.register_paper(&author, &metadata, &doi);

    assert_eq!(paper_id, 0);
    assert_eq!(client.next_id(), 1);

    let papers_for_author = client.papers_of(&author);
    assert_eq!(papers_for_author.len(), 1);
    assert_eq!(papers_for_author.get(0), Option::Some(paper_id));

    let stored = client.get_paper(&paper_id).unwrap();
    assert_eq!(stored.id, paper_id);
    assert_eq!(stored.data.owner, author);
    assert_eq!(stored.data.metadata_uri, metadata);
    assert_eq!(stored.data.doi, doi);
    assert_eq!(stored.data.status, PaperStatus::Pending);
    assert!(stored.data.token.is_none());

    let updated = client.set_token(&admin, &paper_id, &token_contract);
    assert_eq!(updated.data.token, Option::Some(token_contract.clone()));
    assert_eq!(updated.data.status, PaperStatus::Tokenized);

    let fetched = client.get_paper(&paper_id).unwrap();
    assert_eq!(fetched.data.status, PaperStatus::Tokenized);

    let archived = client.update_status(&admin, &paper_id, &PaperStatus::Archived);
    assert_eq!(archived.data.status, PaperStatus::Archived);
}
