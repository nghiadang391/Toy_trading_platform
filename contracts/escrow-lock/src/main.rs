#![cfg_attr(not(any(feature = "library", test)), no_std)]
#![cfg_attr(not(test), no_main)]

#[cfg(any(feature = "library", test))]
extern crate alloc;

#[cfg(not(any(feature = "library", test)))]
ckb_std::entry!(program_entry);

#[cfg(not(any(feature = "library", test)))]
ckb_std::default_alloc!(16384, 1258306, 64);

use core::result::Result;

#[cfg(any(feature = "library", test))]
use alloc::vec::Vec;

use ckb_std::{
    ckb_constants::Source,
    ckb_types::{bytes::Bytes, prelude::*},
    error::SysError,
    high_level::{load_script, load_cell_lock_hash, QueryIter, load_transaction},
};

/// Escrow lock script arguments.
/// For learning, we expect lock arguments layout:
/// - buyer_lock_hash: [u8; 32]
/// - seller_lock_hash: [u8; 32]
/// - timeout: u64 (Unix timestamp)
/// - trade_id: [u8; 32]
/// Total arguments length: 32 + 32 + 8 + 32 = 104 bytes
const ESCROW_ARGS_LEN: usize = 104;

pub fn program_entry() -> i8 {
    let script = match load_script() {
        Ok(s) => s,
        Err(err) => return Error::from(err) as i8,
    };
    let args: Bytes = script.args().unpack();

    if args.len() != ESCROW_ARGS_LEN {
        return Error::InvalidArgumentLength as i8;
    }

    // Extract lock parameters
    let mut buyer_lock_hash = [0u8; 32];
    buyer_lock_hash.copy_from_slice(&args[0..32]);

    let mut seller_lock_hash = [0u8; 32];
    seller_lock_hash.copy_from_slice(&args[32..64]);

    let mut timeout_bytes = [0u8; 8];
    timeout_bytes.copy_from_slice(&args[64..72]);
    let timeout = u64::from_le_bytes(timeout_bytes);

    // Try path 1: Dual Confirmation (Buyer and Seller both signed the transaction)
    let has_buyer_sig = check_lock_hash_signed(&buyer_lock_hash);
    let has_seller_sig = check_lock_hash_signed(&seller_lock_hash);

    if has_buyer_sig && has_seller_sig {
        return 0;
    }

    // Try path 2: Timeout Refund (Timeout expired, buyer can reclaim)
    if has_buyer_sig {
        match verify_timeout(timeout) {
            Ok(_) => return 0,
            Err(e) => return e as i8,
        }
    }

    Error::UnauthorizedOperation as i8
}

/// Check if a given lock hash is executed as part of the input cell locks
fn check_lock_hash_signed(lock_hash: &[u8; 32]) -> bool {
    QueryIter::new(load_cell_lock_hash, Source::Input)
        .any(|input_lock_hash| &input_lock_hash[..] == &lock_hash[..])
}

/// Verify that the transaction enforces the required timeout lock on-chain
fn verify_timeout(timeout_timestamp: u64) -> Result<(), Error> {
    let tx = load_transaction().map_err(Error::from)?;
    let mut timeout_enforced = false;
    for input in tx.raw().inputs().into_iter() {
        let since: u64 = input.since().unpack();
        if (since & 0x4000_0000_0000_0000) != 0 {
            let timestamp = since & 0x00ff_ffff_ffff_ffff;
            if timestamp >= timeout_timestamp {
                timeout_enforced = true;
                break;
            }
        }
    }

    if timeout_enforced {
        Ok(())
    } else {
        Err(Error::TimeoutNotReached)
    }
}

/// Error codes matching SysError mappings and custom validation issues
#[repr(i8)]
pub enum Error {
    IndexOutOfBound = 1,
    ItemMissing,
    LengthNotEnough,
    WaitFailure,
    InvalidFd,
    OtherEndClosed,
    MaxVmsSpawned,
    MaxFdsCreated,
    // Custom error codes
    InvalidArgumentLength = 12,
    UnauthorizedOperation = 13,
    TimeoutNotReached = 14,
}

impl From<SysError> for Error {
    fn from(err: SysError) -> Self {
        use SysError::*;
        match err {
            IndexOutOfBound => Self::IndexOutOfBound,
            ItemMissing => Self::ItemMissing,
            LengthNotEnough(_) => Self::LengthNotEnough,
            WaitFailure => Self::WaitFailure,
            InvalidFd => Self::InvalidFd,
            OtherEndClosed => Self::OtherEndClosed,
            MaxVmsSpawned => Self::MaxVmsSpawned,
            MaxFdsCreated => Self::MaxFdsCreated,
            Encoding => Self::InvalidArgumentLength,
            Unknown(err_code) => panic!("unexpected sys error {}", err_code),
            #[allow(unreachable_patterns)]
            _ => panic!("Unknown SysError"),
        }
    }
}
