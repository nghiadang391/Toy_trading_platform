import { prepareMintToyPassport, prepareTransferToyPassport } from "../src/lib/ckb/spore";
import { ccc } from "@ckb-ccc/core";

describe("Toy Passport Spore DOB Transaction Builder Checks", () => {
  const dummySeller = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";
  const dummyBuyer = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz7";

  test("Should construct Spore mint skeleton successfully", async () => {
    const mockToy = {
      name: "LEGO Star Wars",
      condition: "NEW",
      category: "BUILDING_SETS",
      listedAt: new Date().toISOString(),
      region: "UK",
      imageHash: "0x123",
    };

    const { txSkeleton, outputIndex } = await prepareMintToyPassport(dummySeller, mockToy);
    
    expect(txSkeleton).toBeDefined();
    expect(outputIndex).toBe(0); // Spores are generated at index 0 of outputs
  });
});
