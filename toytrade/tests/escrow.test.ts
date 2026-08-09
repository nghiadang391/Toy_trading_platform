import { Resource, Verifier } from "ckb-testtool";
import { hexFrom, Hex, Transaction, ccc } from "@ckb-ccc/core";
import { readFileSync } from "fs";

const SCRIPT_ALWAYS_SUCCESS = readFileSync(
  "node_modules/ckb-testtool/src/unittest/defaultScript/alwaysSuccess"
);

const SCRIPT_ESCROW = readFileSync("target/riscv64imac-unknown-none-elf/release/escrow-lock");

function deployScript(resource: Resource, tx: any, scriptBin: Hex, args: Hex) {
  const cell = resource.deployCell(scriptBin, tx, false);
  cell.hashType = "data2";
  cell.args = args;
  return cell;
}

describe("Escrow Lock On-Chain Validation Tests", () => {
  // Let's compute actual hashes of Always Success scripts so they match what check_lock_hash_signed loads!
  // SCRIPT_ALWAYS_SUCCESS deployed with custom args has a unique hash.
  // We need buyerHash and sellerHash to match the lock.hash() of the buyer and seller cells!
  const dummyArgsBuyer = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const dummyArgsSeller = "0x2222222222222222222222222222222222222222222222222222222222222222";
  const tradeId = "0x9999999999999999999999999999999999999999999999999999999999999999";
  const timeout = 1000n;

  test("Success path 1: Dual Confirmation (Both buyer and seller locks executed)", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    // 1. Create the dummy buyer and seller lock scripts
    const buyerScript = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), dummyArgsBuyer);
    const sellerScript = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), dummyArgsSeller);

    // 2. Compute their actual lock script hashes (what check_lock_hash_signed will receive on-chain)
    const buyerLockHash = buyerScript.hash();
    const sellerLockHash = sellerScript.hash();

    // 3. Assemble args for Escrow Lock using the correct hashes
    const timeoutBuffer = new Uint8Array(8);
    let temp = timeout;
    for (let i = 0; i < 8; i++) {
      timeoutBuffer[i] = Number(temp & 0xffn);
      temp >>= 8n;
    }
    const timeoutHex = Array.from(timeoutBuffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const escrowArgs = `${buyerLockHash}${sellerLockHash.substring(2)}${timeoutHex}${tradeId.substring(2)}` as Hex;

    // 4. Deploy Escrow script with the correct hashes in args
    const escrowScript = deployScript(resource, tx, hexFrom(SCRIPT_ESCROW), escrowArgs);
    const escrowInputCell = resource.mockCell(escrowScript, undefined, "0x");
    tx.inputs.push(Resource.createCellInput(escrowInputCell));

    // 5. Add buyer and seller cells to input so check_lock_hash_signed detects them as signed
    const buyerInputCell = resource.mockCell(buyerScript, undefined, "0x");
    const sellerInputCell = resource.mockCell(sellerScript, undefined, "0x");

    tx.inputs.push(Resource.createCellInput(buyerInputCell));
    tx.inputs.push(Resource.createCellInput(sellerInputCell));

    const successReceiver = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), "0x00");
    tx.outputs.push(Resource.createCellOutput(successReceiver));
    tx.outputsData.push("0x");

    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifySuccess(true);
  });

  test("Success path 2: Timeout Reclaim (Timeout expired, buyer lock executed)", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const buyerScript = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), dummyArgsBuyer);
    const sellerScript = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), dummyArgsSeller);

    const buyerLockHash = buyerScript.hash();
    const sellerLockHash = sellerScript.hash();

    const timeoutBuffer = new Uint8Array(8);
    let temp = timeout;
    for (let i = 0; i < 8; i++) {
      timeoutBuffer[i] = Number(temp & 0xffn);
      temp >>= 8n;
    }
    const timeoutHex = Array.from(timeoutBuffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const escrowArgs = `${buyerLockHash}${sellerLockHash.substring(2)}${timeoutHex}${tradeId.substring(2)}` as Hex;

    const escrowScript = deployScript(resource, tx, hexFrom(SCRIPT_ESCROW), escrowArgs);
    const escrowInputCell = resource.mockCell(escrowScript, undefined, "0x");
    tx.inputs.push(Resource.createCellInput(escrowInputCell));

    const buyerInputCell = resource.mockCell(buyerScript, undefined, "0x");
    tx.inputs.push(Resource.createCellInput(buyerInputCell));

    const sinceValue = 0x4000000000000000n + 1001n;
    tx.inputs[0]!.since = sinceValue;

    const successReceiver = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), "0x00");
    tx.outputs.push(Resource.createCellOutput(successReceiver));
    tx.outputsData.push("0x");

    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifySuccess(true);
  });

  test("Failure path 1: Seller signs but buyer doesn't before timeout", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const buyerScript = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), dummyArgsBuyer);
    const sellerScript = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), dummyArgsSeller);

    const buyerLockHash = buyerScript.hash();
    const sellerLockHash = sellerScript.hash();

    const timeoutBuffer = new Uint8Array(8);
    let temp = timeout;
    for (let i = 0; i < 8; i++) {
      timeoutBuffer[i] = Number(temp & 0xffn);
      temp >>= 8n;
    }
    const timeoutHex = Array.from(timeoutBuffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const escrowArgs = `${buyerLockHash}${sellerLockHash.substring(2)}${timeoutHex}${tradeId.substring(2)}` as Hex;

    const escrowScript = deployScript(resource, tx, hexFrom(SCRIPT_ESCROW), escrowArgs);
    const escrowInputCell = resource.mockCell(escrowScript, undefined, "0x");
    tx.inputs.push(Resource.createCellInput(escrowInputCell));

    const sellerInputCell = resource.mockCell(sellerScript, undefined, "0x");
    tx.inputs.push(Resource.createCellInput(sellerInputCell));

    const successReceiver = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), "0x00");
    tx.outputs.push(Resource.createCellOutput(successReceiver));
    tx.outputsData.push("0x");

    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifyFailure();
  });

  test("Failure path 2: Buyer signs but timeout has not expired", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const buyerScript = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), dummyArgsBuyer);
    const sellerScript = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), dummyArgsSeller);

    const buyerLockHash = buyerScript.hash();
    const sellerLockHash = sellerScript.hash();

    const timeoutBuffer = new Uint8Array(8);
    let temp = timeout;
    for (let i = 0; i < 8; i++) {
      timeoutBuffer[i] = Number(temp & 0xffn);
      temp >>= 8n;
    }
    const timeoutHex = Array.from(timeoutBuffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const escrowArgs = `${buyerLockHash}${sellerLockHash.substring(2)}${timeoutHex}${tradeId.substring(2)}` as Hex;

    const escrowScript = deployScript(resource, tx, hexFrom(SCRIPT_ESCROW), escrowArgs);
    const escrowInputCell = resource.mockCell(escrowScript, undefined, "0x");
    tx.inputs.push(Resource.createCellInput(escrowInputCell));

    const buyerInputCell = resource.mockCell(buyerScript, undefined, "0x");
    tx.inputs.push(Resource.createCellInput(buyerInputCell));

    const sinceValue = 0x4000000000000000n + 999n;
    tx.inputs[0]!.since = sinceValue;

    const successReceiver = deployScript(resource, tx, hexFrom(SCRIPT_ALWAYS_SUCCESS), "0x00");
    tx.outputs.push(Resource.createCellOutput(successReceiver));
    tx.outputsData.push("0x");

    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifyFailure();
  });
});
