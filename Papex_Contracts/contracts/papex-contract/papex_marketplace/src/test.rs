#![cfg(test)]

use super::*;
use core::option::Option;
use soroban_sdk::{
    testutils::{Address as _},
    Address, Env, String,
};

#[test]
fn listing_and_trade_management() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let author = Address::generate(&env);
    let token = Address::generate(&env);
    let new_owner = Address::generate(&env);

    let contract_id = env.register_contract(None, PapexMarketplace);
    let client = PapexMarketplaceClient::new(&env, &contract_id);

    client.init(&admin, &Option::None, &20);
    assert_eq!(client.config().admin, admin);

    let listing = client.register_listing(
        &author,
        &7,
        &token,
        &String::from_str(&env, "ipfs://paper/7"),
    );
    assert!(listing.data.is_active);
    assert_eq!(listing.data.owner, author);

    let fetched = client.get_listing(&7).unwrap();
    assert_eq!(fetched.id, 7);

    let updated = client.update_listing_status(&author, &7, &false);
    assert!(!updated.data.is_active);

    let reassigned = client.reassign_listing_owner(&admin, &7, &new_owner);
    assert_eq!(reassigned.data.owner, new_owner);

    let visible = client.list_listings(&10, &false);
    assert_eq!(visible.len(), 1);

    let trade = client.record_trade(&new_owner, &7, &500, &2_000, &true);
    assert_eq!(trade.amount, 500);
    assert!(trade.is_buy);

    let trades = client.get_trades(&7);
    assert_eq!(trades.len(), 1);
    let first_trade = trades.get(0).unwrap();
    assert_eq!(first_trade.amount, 500);
}
