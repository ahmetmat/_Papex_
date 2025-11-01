#![no_std]

use core::option::Option;
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Symbol,
};
use soroban_sdk::token;

fn k_cfg() -> Symbol { symbol_short!("cfg") }
fn k_bal() -> Symbol { symbol_short!("bal") }
fn k_tot() -> Symbol { symbol_short!("tot") }
fn k_lq() -> Symbol { symbol_short!("lqd") }

#[derive(Clone)]
#[contracttype]
pub struct Config {
    pub name: String,
    pub symbol: String,
    pub owner: Address,
    pub max_supply: i128,
    pub base_price: i128,
    pub slope: i128,
    pub payment_token: Option<Address>,
    pub trading: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct TokenSummary {
    pub name: String,
    pub symbol: String,
    pub owner: Address,
    pub max_supply: i128,
    pub total_supply: i128,
    pub base_price: i128,
    pub slope: i128,
    pub liquidity: i128,
    pub trading: bool,
    pub payment_token: Option<Address>,
}

#[derive(Clone)]
#[contracttype]
pub struct Quote {
    pub cost: i128,
    pub price_before: i128,
    pub price_after: i128,
}

#[contract]
pub struct PapexToken;

impl PapexToken {
    fn read_cfg(env: &Env) -> Config {
        env.storage()
            .instance()
            .get(&k_cfg())
            .unwrap_or_else(|| panic!("token not initialized"))
    }

    fn write_cfg(env: &Env, cfg: &Config) {
        env.storage().instance().set(&k_cfg(), cfg);
    }

    fn read_balances(env: &Env) -> Map<Address, i128> {
        env.storage()
            .instance()
            .get(&k_bal())
            .unwrap_or(Map::new(env))
    }

    fn write_balances(env: &Env, balances: &Map<Address, i128>) {
        env.storage().instance().set(&k_bal(), balances);
    }

    fn read_total_supply(env: &Env) -> i128 {
        env.storage().instance().get(&k_tot()).unwrap_or(0)
    }

    fn write_total_supply(env: &Env, amount: i128) {
        env.storage().instance().set(&k_tot(), &amount);
    }

    fn read_liquidity(env: &Env) -> i128 {
        env.storage().instance().get(&k_lq()).unwrap_or(0)
    }

    fn write_liquidity(env: &Env, amount: i128) {
        env.storage().instance().set(&k_lq(), &amount);
    }

    fn ensure_amount(amount: i128) {
        if amount <= 0 {
            panic!("amount must be positive");
        }
    }

    fn bonding_quote(base: i128, slope: i128, supply: i128, amount: i128, is_buy: bool) -> Quote {
        let start_supply = if is_buy { supply } else { supply - amount };
        if start_supply < 0 {
            panic!("insufficient supply");
        }
        let end_supply = if is_buy { supply + amount } else { supply };
        let price_before = base + slope * start_supply;
        let price_after = base + slope * end_supply;
        let avg_price = (price_before + price_after) / 2;
        Quote {
            cost: avg_price * amount,
            price_before,
            price_after,
        }
    }

    fn token_client<'a>(env: &'a Env, address: &'a Address) -> token::Client<'a> {
        token::Client::new(env, address)
    }
}

#[contractimpl]
impl PapexToken {
    #[allow(clippy::too_many_arguments)]
    pub fn init(
        env: Env,
        owner: Address,
        name: String,
        symbol: String,
        max_supply: i128,
        base_price: i128,
        slope: i128,
        payment_token: Option<Address>,
        initial_supply_to_owner: i128,
        initial_liquidity: i128,
    ) {
        if env.storage().instance().has(&k_cfg()) {
            panic!("already initialized");
        }
        owner.require_auth();
        if max_supply <= 0 || base_price <= 0 || slope < 0 {
            panic!("invalid config");
        }
        if initial_supply_to_owner < 0 || initial_liquidity < 0 {
            panic!("invalid init values");
        }
        if initial_supply_to_owner > max_supply {
            panic!("init supply exceeds max");
        }

        let cfg = Config {
            name: name.clone(),
            symbol: symbol.clone(),
            owner: owner.clone(),
            max_supply,
            base_price,
            slope,
            payment_token: payment_token.clone(),
            trading: false,
        };

        env.storage().instance().set(&k_cfg(), &cfg);
        Self::write_total_supply(&env, initial_supply_to_owner);

        let mut balances = Map::<Address, i128>::new(&env);
        if initial_supply_to_owner > 0 {
            balances.set(owner.clone(), initial_supply_to_owner);
        }
        Self::write_balances(&env, &balances);

        Self::write_liquidity(&env, initial_liquidity);

        if initial_liquidity > 0 {
            if let Option::Some(token) = payment_token {
                let client = Self::token_client(&env, &token);
                client.transfer_from(
                    &owner,
                    &owner,
                    &env.current_contract_address(),
                    &initial_liquidity,
                );
            }
        }

        env.events().publish(
            (symbol_short!("init"),),
            (owner, name, symbol, max_supply, initial_liquidity),
        );
    }

    pub fn config(env: Env) -> Config {
        Self::read_cfg(&env)
    }

    pub fn summary(env: Env) -> TokenSummary {
        let cfg = Self::read_cfg(&env);
        TokenSummary {
            name: cfg.name.clone(),
            symbol: cfg.symbol.clone(),
            owner: cfg.owner.clone(),
            max_supply: cfg.max_supply,
            total_supply: Self::read_total_supply(&env),
            base_price: cfg.base_price,
            slope: cfg.slope,
            liquidity: Self::read_liquidity(&env),
            trading: cfg.trading,
            payment_token: cfg.payment_token.clone(),
        }
    }

    pub fn set_trading(env: Env, caller: Address, is_on: bool) {
        let mut cfg = Self::read_cfg(&env);
        if caller != cfg.owner {
            panic!("only owner");
        }
        cfg.trading = is_on;
        Self::write_cfg(&env, &cfg);
        env.events().publish((symbol_short!("trade"),), (is_on,));
    }

    pub fn total_supply(env: Env) -> i128 {
        Self::read_total_supply(&env)
    }

    pub fn balance_of(env: Env, who: Address) -> i128 {
        let balances = Self::read_balances(&env);
        balances.get(who).unwrap_or(0)
    }

    pub fn current_price(env: Env) -> i128 {
        let cfg = Self::read_cfg(&env);
        let supply = Self::read_total_supply(&env);
        cfg.base_price + cfg.slope * supply
    }

    pub fn quote_buy(env: Env, amount: i128) -> Quote {
        Self::ensure_amount(amount);
        let cfg = Self::read_cfg(&env);
        let supply = Self::read_total_supply(&env);
        Self::bonding_quote(cfg.base_price, cfg.slope, supply, amount, true)
    }

    pub fn quote_sell(env: Env, amount: i128) -> Quote {
        Self::ensure_amount(amount);
        let cfg = Self::read_cfg(&env);
        let supply = Self::read_total_supply(&env);
        Self::bonding_quote(cfg.base_price, cfg.slope, supply, amount, false)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        Self::ensure_amount(amount);
        from.require_auth();

        let mut balances = Self::read_balances(&env);
        let from_balance = balances.get(from.clone()).unwrap_or(0);
        if from_balance < amount {
            panic!("insufficient balance");
        }
        balances.set(from.clone(), from_balance - amount);

        let to_balance = balances.get(to.clone()).unwrap_or(0);
        balances.set(to.clone(), to_balance + amount);

        Self::write_balances(&env, &balances);
        env.events().publish((symbol_short!("transfer"),), (from, to, amount));
    }

    pub fn deposit_liquidity(env: Env, caller: Address, amount: i128) {
        Self::ensure_amount(amount);
        let cfg = Self::read_cfg(&env);
        caller.require_auth();

        if let Option::Some(token) = cfg.payment_token.clone() {
            let client = Self::token_client(&env, &token);
            client.transfer_from(
                &caller,
                &caller,
                &env.current_contract_address(),
                &amount,
            );
        }

        let liquidity = Self::read_liquidity(&env) + amount;
        Self::write_liquidity(&env, liquidity);
        env.events()
            .publish((symbol_short!("lqin"),), (caller, amount, liquidity));
    }

    pub fn withdraw_liquidity(env: Env, caller: Address, amount: i128, to: Address) {
        Self::ensure_amount(amount);
        let cfg = Self::read_cfg(&env);
        caller.require_auth();
        if caller != cfg.owner {
            panic!("only owner");
        }

        let liquidity = Self::read_liquidity(&env);
        if liquidity < amount {
            panic!("insufficient liquidity");
        }
        let new_liquidity = liquidity - amount;
        Self::write_liquidity(&env, new_liquidity);

        if let Option::Some(token) = cfg.payment_token.clone() {
            let client = Self::token_client(&env, &token);
            client.transfer(&env.current_contract_address(), &to, &amount);
        }

        env.events().publish(
            (symbol_short!("lqout"),),
            (caller, to, amount, new_liquidity),
        );
    }

    pub fn buy(env: Env, buyer: Address, amount: i128, max_payment: i128) -> Quote {
        Self::ensure_amount(amount);
        buyer.require_auth();

        let cfg = Self::read_cfg(&env);
        if !cfg.trading {
            panic!("trading disabled");
        }

        let mut supply = Self::read_total_supply(&env);
        if supply + amount > cfg.max_supply {
            panic!("exceeds max supply");
        }

        let quote = Self::bonding_quote(cfg.base_price, cfg.slope, supply, amount, true);
        if max_payment < quote.cost {
            panic!("insufficient payment");
        }

        if let Option::Some(token) = cfg.payment_token.clone() {
            let client = Self::token_client(&env, &token);
            client.transfer_from(
                &buyer,
                &buyer,
                &env.current_contract_address(),
                &quote.cost,
            );
        }

        supply += amount;
        Self::write_total_supply(&env, supply);

        let mut balances = Self::read_balances(&env);
        let current = balances.get(buyer.clone()).unwrap_or(0);
        balances.set(buyer.clone(), current + amount);
        Self::write_balances(&env, &balances);

        let liquidity = Self::read_liquidity(&env) + quote.cost;
        Self::write_liquidity(&env, liquidity);

        env.events().publish(
            (symbol_short!("buy"),),
            (buyer.clone(), amount, quote.cost, liquidity),
        );

        quote
    }

    pub fn sell(env: Env, seller: Address, amount: i128, min_payment: i128) -> Quote {
        Self::ensure_amount(amount);
        seller.require_auth();

        let cfg = Self::read_cfg(&env);
        if !cfg.trading {
            panic!("trading disabled");
        }

        let mut balances = Self::read_balances(&env);
        let current = balances.get(seller.clone()).unwrap_or(0);
        if current < amount {
            panic!("insufficient balance");
        }

        let supply = Self::read_total_supply(&env);
        let quote = Self::bonding_quote(cfg.base_price, cfg.slope, supply, amount, false);
        if quote.cost < min_payment {
            panic!("slippage");
        }

        let liquidity = Self::read_liquidity(&env);
        if liquidity < quote.cost {
            panic!("insufficient liquidity");
        }
        let new_liquidity = liquidity - quote.cost;
        Self::write_liquidity(&env, new_liquidity);

        balances.set(seller.clone(), current - amount);
        Self::write_balances(&env, &balances);

        let new_supply = supply - amount;
        Self::write_total_supply(&env, new_supply);

        if let Option::Some(token) = cfg.payment_token.clone() {
            let client = Self::token_client(&env, &token);
            client.transfer(&env.current_contract_address(), &seller, &quote.cost);
        }

        env.events().publish(
            (symbol_short!("sell"),),
            (seller.clone(), amount, quote.cost, new_liquidity),
        );

        quote
    }
}

#[cfg(test)]
mod test;
