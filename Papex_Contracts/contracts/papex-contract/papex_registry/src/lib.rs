#![no_std]

use core::option::Option;
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Vec,
};

fn k_admin() -> soroban_sdk::Symbol { symbol_short!("adm") }
fn k_next_id() -> soroban_sdk::Symbol { symbol_short!("nid") }
fn k_papers() -> soroban_sdk::Symbol { symbol_short!("ppr") }
fn k_author_index() -> soroban_sdk::Symbol { symbol_short!("aix") }

#[derive(Clone, Copy, Eq, PartialEq, Debug)]
#[contracttype]
pub enum PaperStatus {
    Pending,
    Tokenized,
    Archived,
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct Paper {
    pub owner: Address,
    pub metadata_uri: String,
    pub doi: Option<String>,
    pub token: Option<Address>,
    pub status: PaperStatus,
    pub registered_at: u64,
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct PaperRecord {
    pub id: u32,
    pub data: Paper,
}

#[contract]
pub struct PapexRegistry;

#[contractimpl]
impl PapexRegistry {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&k_admin()) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&k_admin(), &admin);
        env.storage().instance().set(&k_next_id(), &0u32);
        env.storage().instance().set(&k_papers(), &Map::<u32, Paper>::new(&env));
        env.storage()
            .instance()
            .set(&k_author_index(), &Map::<Address, Vec<u32>>::new(&env));
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&k_admin()).unwrap()
    }

    pub fn next_id(env: Env) -> u32 {
        env.storage().instance().get(&k_next_id()).unwrap_or(0)
    }

    pub fn register_paper(
        env: Env,
        caller: Address,
        metadata_uri: String,
        doi: Option<String>,
    ) -> u32 {
        caller.require_auth();
        if metadata_uri.len() == 0 {
            panic!("metadata required");
        }

        let mut next = env.storage().instance().get(&k_next_id()).unwrap_or(0u32);
        let paper_id = next;
        next = next.checked_add(1).expect("id overflow");
        env.storage().instance().set(&k_next_id(), &next);

        let registered_at = env.ledger().timestamp();
        let paper = Paper {
            owner: caller.clone(),
            metadata_uri,
            doi,
            token: None,
            status: PaperStatus::Pending,
            registered_at,
        };

        let mut papers: Map<u32, Paper> = env
            .storage()
            .instance()
            .get(&k_papers())
            .unwrap_or(Map::new(&env));
        papers.set(paper_id, paper.clone());
        env.storage().instance().set(&k_papers(), &papers);

        let mut author_index: Map<Address, Vec<u32>> = env
            .storage()
            .instance()
            .get(&k_author_index())
            .unwrap_or(Map::new(&env));
        let mut authored = author_index
            .get(caller.clone())
            .unwrap_or(Vec::new(&env));
        authored.push_back(paper_id);
        author_index.set(caller.clone(), authored);
        env.storage().instance().set(&k_author_index(), &author_index);

        env.events()
            .publish((symbol_short!("reg"),), (caller, paper_id));

        paper_id
    }

    pub fn set_token(
        env: Env,
        caller: Address,
        paper_id: u32,
        token: Address,
    ) -> PaperRecord {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&k_admin()).unwrap();

        let mut papers: Map<u32, Paper> = env
            .storage()
            .instance()
            .get(&k_papers())
            .unwrap_or(Map::new(&env));

        let mut paper = papers
            .get(paper_id)
            .unwrap_or_else(|| panic!("paper not found"));

        if caller != admin && caller != paper.owner {
            panic!("not authorized");
        }

        paper.token = Option::Some(token.clone());
        paper.status = PaperStatus::Tokenized;
        papers.set(paper_id, paper.clone());
        env.storage().instance().set(&k_papers(), &papers);

        env.events()
            .publish((symbol_short!("token"),), (paper_id, token.clone()));

        PaperRecord { id: paper_id, data: paper }
    }

    pub fn update_status(
        env: Env,
        caller: Address,
        paper_id: u32,
        status: PaperStatus,
    ) -> PaperRecord {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&k_admin()).unwrap();
        if caller != admin {
            panic!("only admin");
        }

        let mut papers: Map<u32, Paper> = env
            .storage()
            .instance()
            .get(&k_papers())
            .unwrap_or(Map::new(&env));
        let mut paper = papers
            .get(paper_id)
            .unwrap_or_else(|| panic!("paper not found"));

        paper.status = status;
        papers.set(paper_id, paper.clone());
        env.storage().instance().set(&k_papers(), &papers);

        env.events()
            .publish((symbol_short!("pstat"),), (paper_id, status as u32));

        PaperRecord { id: paper_id, data: paper }
    }

    pub fn get_paper(env: Env, paper_id: u32) -> Option<PaperRecord> {
        let papers: Map<u32, Paper> = env
            .storage()
            .instance()
            .get(&k_papers())
            .unwrap_or(Map::new(&env));
        papers.get(paper_id).map(|data| PaperRecord {
            id: paper_id,
            data,
        })
    }

    pub fn papers_of(env: Env, owner: Address) -> Vec<u32> {
        let author_index: Map<Address, Vec<u32>> = env
            .storage()
            .instance()
            .get(&k_author_index())
            .unwrap_or(Map::new(&env));
        author_index.get(owner).unwrap_or(Vec::new(&env))
    }

    pub fn list_papers(env: Env, limit: u32) -> Vec<PaperRecord> {
        let papers: Map<u32, Paper> = env
            .storage()
            .instance()
            .get(&k_papers())
            .unwrap_or(Map::new(&env));
        let mut out = Vec::new(&env);
        let mut count = 0u32;
        for entry in papers.keys() {
            if limit != 0 && count >= limit {
                break;
            }
            let id = entry;
            if let Option::Some(data) = papers.get(id) {
                out.push_back(PaperRecord { id, data });
                count += 1;
            }
        }
        out
    }
}

#[cfg(test)]
mod test;
