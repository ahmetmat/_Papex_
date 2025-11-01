#![no_std]

use core::option::Option;
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Symbol, Vec,
};

fn k_cfg() -> Symbol { symbol_short!("cfg") }
fn k_listings() -> Symbol { symbol_short!("lst") }
fn k_listing_ids() -> Symbol { symbol_short!("ids") }
fn k_trades() -> Symbol { symbol_short!("trd") }

#[derive(Clone)]
#[contracttype]
pub struct MarketplaceConfig {
    pub admin: Address,
    pub registry: Option<Address>,
    pub max_trade_history: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct Listing {
    pub paper_id: u32,
    pub token: Address,
    pub metadata_uri: String,
    pub owner: Address,
    pub is_active: bool,
    pub created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct ListingRecord {
    pub id: u32,
    pub data: Listing,
}

#[derive(Clone)]
#[contracttype]
pub struct Trade {
    pub trader: Address,
    pub amount: i128,
    pub cost: i128,
    pub is_buy: bool,
    pub timestamp: u64,
}

#[contract]
pub struct PapexMarketplace;

impl PapexMarketplace {
    fn read_cfg(env: &Env) -> MarketplaceConfig {
        env.storage()
            .instance()
            .get(&k_cfg())
            .unwrap_or_else(|| panic!("marketplace not initialized"))
    }

    fn write_cfg(env: &Env, cfg: &MarketplaceConfig) {
        env.storage().instance().set(&k_cfg(), cfg);
    }

    fn listings(env: &Env) -> Map<u32, Listing> {
        env.storage()
            .instance()
            .get(&k_listings())
            .unwrap_or(Map::new(env))
    }

    fn write_listings(env: &Env, listings: &Map<u32, Listing>) {
        env.storage().instance().set(&k_listings(), listings);
    }

    fn listing_ids(env: &Env) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&k_listing_ids())
            .unwrap_or(Vec::new(env))
    }

    fn write_listing_ids(env: &Env, ids: &Vec<u32>) {
        env.storage().instance().set(&k_listing_ids(), ids);
    }

    fn trades(env: &Env) -> Map<u32, Vec<Trade>> {
        env.storage()
            .instance()
            .get(&k_trades())
            .unwrap_or(Map::new(env))
    }

    fn write_trades(env: &Env, trades: &Map<u32, Vec<Trade>>) {
        env.storage().instance().set(&k_trades(), trades);
    }
}

#[contractimpl]
impl PapexMarketplace {
    pub fn init(env: Env, admin: Address, registry: Option<Address>, max_trade_history: u32) {
        if env.storage().instance().has(&k_cfg()) {
            panic!("already initialized");
        }
        admin.require_auth();

        let cfg = MarketplaceConfig {
            admin: admin.clone(),
            registry,
            max_trade_history: if max_trade_history == 0 { 50 } else { max_trade_history },
        };
        env.storage().instance().set(&k_cfg(), &cfg);
        env.storage()
            .instance()
            .set(&k_listings(), &Map::<u32, Listing>::new(&env));
        env.storage()
            .instance()
            .set(&k_listing_ids(), &Vec::<u32>::new(&env));
        env.storage()
            .instance()
            .set(&k_trades(), &Map::<u32, Vec<Trade>>::new(&env));

        env.events()
            .publish((symbol_short!("init"),), (admin, cfg.max_trade_history));
    }

    pub fn config(env: Env) -> MarketplaceConfig {
        Self::read_cfg(&env)
    }

    pub fn set_registry(env: Env, caller: Address, registry: Option<Address>) {
        let mut cfg = Self::read_cfg(&env);
        caller.require_auth();
        if caller != cfg.admin {
            panic!("only admin");
        }
        cfg.registry = registry;
        Self::write_cfg(&env, &cfg);
    }

    pub fn register_listing(
        env: Env,
        caller: Address,
        paper_id: u32,
        token: Address,
        metadata_uri: String,
    ) -> ListingRecord {
        caller.require_auth();

        let mut listings = Self::listings(&env);
        if listings.contains_key(paper_id) {
            panic!("listing exists");
        }

        let listing = Listing {
            paper_id,
            token: token.clone(),
            metadata_uri,
            owner: caller.clone(),
            is_active: true,
            created_at: env.ledger().timestamp(),
        };
        listings.set(paper_id, listing.clone());
        Self::write_listings(&env, &listings);

        let mut ids = Self::listing_ids(&env);
        ids.push_back(paper_id);
        Self::write_listing_ids(&env, &ids);

        env.events().publish(
            (symbol_short!("list"),),
            (paper_id, caller, token, listing.is_active),
        );

        ListingRecord {
            id: paper_id,
            data: listing,
        }
    }

    pub fn update_listing_status(
        env: Env,
        caller: Address,
        paper_id: u32,
        is_active: bool,
    ) -> ListingRecord {
        caller.require_auth();
        let cfg = Self::read_cfg(&env);
        let mut listings = Self::listings(&env);
        let mut listing = listings
            .get(paper_id)
            .unwrap_or_else(|| panic!("listing not found"));

        if caller != cfg.admin && caller != listing.owner {
            panic!("not authorized");
        }

        listing.is_active = is_active;
        listings.set(paper_id, listing.clone());
        Self::write_listings(&env, &listings);

        env.events().publish(
            (symbol_short!("lstat"),),
            (paper_id, is_active),
        );

        ListingRecord {
            id: paper_id,
            data: listing,
        }
    }

    pub fn reassign_listing_owner(
        env: Env,
        caller: Address,
        paper_id: u32,
        new_owner: Address,
    ) -> ListingRecord {
        caller.require_auth();
        let cfg = Self::read_cfg(&env);
        if caller != cfg.admin {
            panic!("only admin");
        }

        let mut listings = Self::listings(&env);
        let mut listing = listings
            .get(paper_id)
            .unwrap_or_else(|| panic!("listing not found"));
        listing.owner = new_owner.clone();
        listings.set(paper_id, listing.clone());
        Self::write_listings(&env, &listings);

        env.events().publish(
            (symbol_short!("lown"),),
            (paper_id, new_owner),
        );

        ListingRecord {
            id: paper_id,
            data: listing,
        }
    }

    pub fn get_listing(env: Env, paper_id: u32) -> Option<ListingRecord> {
        let listings = Self::listings(&env);
        listings.get(paper_id).map(|data| ListingRecord {
            id: paper_id,
            data,
        })
    }

    pub fn list_listings(env: Env, limit: u32, only_active: bool) -> Vec<ListingRecord> {
        let listings = Self::listings(&env);
        let ids = Self::listing_ids(&env);
        let mut out = Vec::new(&env);
        let mut count = 0u32;
        for id in ids.into_iter() {
            if limit != 0 && count >= limit {
                break;
            }
            if let Option::Some(data) = listings.get(id) {
                if !only_active || data.is_active {
                    out.push_back(ListingRecord { id, data });
                    count += 1;
                }
            }
        }
        out
    }

    pub fn record_trade(
        env: Env,
        caller: Address,
        paper_id: u32,
        amount: i128,
        cost: i128,
        is_buy: bool,
    ) -> Trade {
        if amount <= 0 || cost <= 0 {
            panic!("invalid trade");
        }
        caller.require_auth();
        let cfg = Self::read_cfg(&env);

        let listings = Self::listings(&env);
        let listing = listings
            .get(paper_id)
            .unwrap_or_else(|| panic!("listing not found"));

        if caller != cfg.admin && caller != listing.owner {
            panic!("not authorized");
        }

        let trade = Trade {
            trader: caller.clone(),
            amount,
            cost,
            is_buy,
            timestamp: env.ledger().timestamp(),
        };

        let mut trades = Self::trades(&env);
        let mut history = trades.get(paper_id).unwrap_or(Vec::new(&env));
        history.push_back(trade.clone());

        if history.len() > cfg.max_trade_history {
            let mut trimmed = Vec::new(&env);
            let keep_start = history.len() - cfg.max_trade_history;
            let mut index = 0u32;
            for entry in history.into_iter() {
                if index >= keep_start {
                    trimmed.push_back(entry);
                }
                index += 1;
            }
            history = trimmed;
        }

        trades.set(paper_id, history);
        Self::write_trades(&env, &trades);

        env.events().publish(
            (symbol_short!("trade"),),
            (paper_id, amount, cost, is_buy),
        );

        trade
    }

    pub fn get_trades(env: Env, paper_id: u32) -> Vec<Trade> {
        let trades = Self::trades(&env);
        trades.get(paper_id).unwrap_or(Vec::new(&env))
    }
}

#[cfg(test)]
mod test;
