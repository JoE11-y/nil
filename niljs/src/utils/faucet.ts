import { FaucetClient, PublicClient } from "../clients/index.js";
import { HttpTransport } from "../transport/index.js";
import type { Hex } from "../types/index.js";
import { getShardIdFromAddress } from "./address.js";

export async function topUp({
  address,
  faucetEndpoint,
  rpcEndpoint,
  token = "NIL",
  amount = 1e18,
}: {
  address: Hex;
  faucetEndpoint: string;
  rpcEndpoint: string;
  token?: string;
  amount?: number;
}): Promise<void> {
  const shardId = getShardIdFromAddress(address);

  const client = new PublicClient({
    transport: new HttpTransport({
      endpoint: rpcEndpoint,
    }),
    shardId: shardId,
  });

  const faucetClient = new FaucetClient({
    transport: new HttpTransport({
      endpoint: faucetEndpoint,
    }),
  });

  const faucets = await faucetClient.getAllFaucets();
  const faucet = faucets[token];

  await faucetClient.topUpAndWaitUntilCompletion(
    {
      faucetAddress: faucet,
      smartAccountAddress: address,
      amount: amount,
    },
    client,
  );
}
