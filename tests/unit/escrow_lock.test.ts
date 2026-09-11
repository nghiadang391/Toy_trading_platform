import { Resource, Verifier } from "ckb-testtool";
import { hexFrom, Hex, Transaction } from "@ckb-ccc/core";
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

/**
 * UT-ESC Suite: On-Chain Escrow Lock Unit Verification
 * Traceability:
 * - Spec: SPEC-ESC-005 (Lock script args & dual execution verification)
 * - Architecture: ARCH-ESC-003 (CKB on-chain dual lock)
 * - Requirements: REQ-ESC-001, REQ-ESC-004, REQ-ESC-005, REQ-ESC-006
 */
describe("Escrow Lock On-Chain Unit Tests (UT-ESC)", () => {
  const dummyArgsBuyer = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const dummyArgsSeller = "0x2222222222222222222222222222222222222222222222222222222222222222";
  const tradeId = "0x9999999999999999999999999999999999999999999999999999999999999999";
  const timeout = 1000n;

  test("[UT-ESC-001] Dual Confirmation: Both buyer and seller locks signed and executed", async () => {
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

  test("[UT-ESC-002] Timeout Reclaim: Timeout expired and buyer lock executed", async () => {
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

  test("[UT-ESC-003] Premature Refund Rejection: Buyer signs but timeout has not expired", async () => {
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

  test("[UT-ESC-004] Unauthorized Unlock Rejection: Seller signs without buyer before timeout", async () => {
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
});
