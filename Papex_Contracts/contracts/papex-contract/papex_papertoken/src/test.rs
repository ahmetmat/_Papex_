#![cfg(test)]

use super::*;
use core::option::Option;
use soroban_sdk::{
    testutils::{Address as _},
    Address, Env, String,
};

#[test]
fn bonding_curve_flow_without_payment_token() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let buyer = Address::generate(&env);

    let contract_id = env.register_contract(None, PapexToken);
    let client = PapexTokenClient::new(&env, &contract_id);

    client.init(
        &owner,
        &String::from_str(&env, "Paper Token"),
        &String::from_str(&env, "PAPER"),
        &1_000,
        &100,   // base price
        &2,     // slope
        &Option::None,
        &100,   // initial supply to owner
        &10_000 // initial liquidity (virtual)
    );

    let summary = client.summary();
    assert_eq!(summary.total_supply, 100);
    assert_eq!(summary.liquidity, 10_000);
    assert_eq!(summary.trading, false);

    client.set_trading(&owner, &true);

    // Owner balance before trade
    assert_eq!(client.balance_of(&owner), 100);

    // Buyer purchases 10 tokens
    let quote_buy = client.buy(&buyer, &10, &10_000);
    assert_eq!(quote_buy.cost, 3100); // ((300 + 320)/2) * 10
    assert_eq!(client.balance_of(&buyer), 10);
    assert_eq!(client.total_supply(), 110);
    assert_eq!(client.summary().liquidity, 13_100);

    // Buyer sells 4 tokens back
    let quote_sell = client.sell(&buyer, &4, &1_200);
    assert_eq!(quote_sell.cost, 1_264); // ((312 + 320)/2) * 4
    assert_eq!(client.balance_of(&buyer), 6);
    assert_eq!(client.total_supply(), 106);
    assert_eq!(client.summary().liquidity, 11_836);
}
