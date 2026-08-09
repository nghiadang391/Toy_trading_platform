import { setSporeConfig, createSpore, transferSpore, predefinedSporeConfigs } from "@spore-sdk/core";
import { ccc } from "@ckb-ccc/core";

// Define Spore configuration for CKB Testnet (Aggron4) with public RPC URLs
const SPORE_CONFIG = {
  ...predefinedSporeConfigs.Aggron4,
  ckbNodeUrl: "https://testnet.ckb.dev/rpc",
  ckbIndexerUrl: "https://testnet.ckb.dev/indexer",
};
setSporeConfig(SPORE_CONFIG);

export interface ToyPassportData {
  name: string;
  condition: string;
  category: string;
  listedAt: string;
  region: string;
  imageHash: string;
}

/**
 * Prepares a Spore DOB mint transaction skeleton.
 * Returns the transaction skeleton to be signed off-chain by the client's wallet.
 */
export async function prepareMintToyPassport(
  sellerAddress: string,
  toyData: ToyPassportData
) {
  const content = new TextEncoder().encode(JSON.stringify(toyData));
  const client = new ccc.ClientPublicTestnet();
  
  const { txSkeleton, outputIndex } = await createSpore({
    data: {
      contentType: "application/json",
      content,
    },
    toLock: (await ccc.Address.fromString(sellerAddress, client)).script,
    fromInfos: [sellerAddress],
    config: SPORE_CONFIG,
  });

  return { txSkeleton, outputIndex };
}

/**
 * Prepares a Spore DOB transfer transaction skeleton to run atomically as part of trade settlement.
 */
export async function prepareTransferToyPassport(
  sporeId: string,
  fromAddress: string,
  toAddress: string
) {
  const client = new ccc.ClientPublicTestnet();
  
  const { txSkeleton } = await transferSpore({
    outPoint: {
      txHash: sporeId.split(":")[0]!,
      index: "0x" + parseInt(sporeId.split(":")[1] || "0").toString(16),
    },
    toLock: (await ccc.Address.fromString(toAddress, client)).script,
    fromInfos: [fromAddress],
    config: SPORE_CONFIG,
  });

  return txSkeleton;
}
