import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";
import {
  HttpTransport,
  PublicClient,
  generateSmartAccount,
  waitTillCompleted,
} from "@nilfoundation/niljs";
import type { Abi } from "viem";
import { CLONE_FACTORY_COMPILATION_COMMAND } from "./compilationCommands";
import { FAUCET_GLOBAL, RPC_GLOBAL } from "./globals";

const exec = util.promisify(require("node:child_process").exec);

const __dirname = path.dirname(__filename);

const RPC_ENDPOINT = RPC_GLOBAL;
const FAUCET_ENDPOINT = FAUCET_GLOBAL;

let FACTORY_MANAGER_BYTECODE: `0x${string}`;
let FACTORY_MANAGER_ABI: Abi;

let MASTER_CHILD_BYTECODE: `0x${string}`;
let MASTER_CHILD_ABI: Abi;

let CLONE_FACTORY_BYTECODE: `0x${string}`;
let CLONE_FACTORY_ABI: Abi;

beforeAll(async () => {
  await exec(CLONE_FACTORY_COMPILATION_COMMAND);
  const masterChildFile = await fs.readFile(
    path.resolve(__dirname, "./CloneFactory/MasterChild.bin"),
    "utf8",
  );
  const masterChildBytecode = `0x${masterChildFile}` as `0x${string}`;
  const masterChildAbiFile = await fs.readFile(
    path.resolve(__dirname, "./CloneFactory/MasterChild.abi"),
    "utf8",
  );
  const masterChildAbi = JSON.parse(masterChildAbiFile) as unknown as Abi;

  const cloneFactoryFile = await fs.readFile(
    path.resolve(__dirname, "./CloneFactory/CloneFactory.bin"),
    "utf8",
  );
  const cloneFactoryBytecode = `0x${cloneFactoryFile}` as `0x${string}`;
  const cloneFactoryAbiFile = await fs.readFile(
    path.resolve(__dirname, "./CloneFactory/CloneFactory.abi"),
    "utf8",
  );
  const cloneFactoryAbi = JSON.parse(cloneFactoryAbiFile) as unknown as Abi;

  const factoryManagerFile = await fs.readFile(
    path.resolve(__dirname, "./CloneFactory/FactoryManager.bin"),
    "utf8",
  );
  const factoryManagerBytecode = `0x${factoryManagerFile}` as `0x${string}`;
  const factoryManagerAbiFile = await fs.readFile(
    path.resolve(__dirname, "./CloneFactory/FactoryManager.abi"),
    "utf8",
  );
  const factoryManagerAbi = JSON.parse(factoryManagerAbiFile) as unknown as Abi;

  FACTORY_MANAGER_BYTECODE = factoryManagerBytecode;
  FACTORY_MANAGER_ABI = factoryManagerAbi;
  MASTER_CHILD_BYTECODE = masterChildBytecode;
  MASTER_CHILD_ABI = masterChildAbi;
  CLONE_FACTORY_BYTECODE = cloneFactoryBytecode;
  CLONE_FACTORY_ABI = cloneFactoryAbi;
});

describe.sequential("Nil.js can fully tests the CloneFactory", async () => {
  test("CloneFactory successfully creates a factory and a clone", async () => {
    const SALT = BigInt(Math.floor(Math.random() * 10000));

    const client = new PublicClient({
      transport: new HttpTransport({
        endpoint: RPC_ENDPOINT,
      }),
      shardId: 1,
    });

    const smartAccount = await generateSmartAccount({
      shardId: 1,
      rpcEndpoint: RPC_ENDPOINT,
      faucetEndpoint: FAUCET_ENDPOINT,
    });

    const gasPrice = await client.getGasPrice(1);

    const { address: factoryManagerAddress, hash: factoryManagerHash } =
      await smartAccount.deployContract({
        bytecode: FACTORY_MANAGER_BYTECODE,
        abi: FACTORY_MANAGER_ABI,
        args: [],
        feeCredit: 50_000_000n * gasPrice,
        salt: SALT,
        shardId: 1,
      });

    const factoryManagerReceipts = await waitTillCompleted(client, factoryManagerHash);

    expect(factoryManagerReceipts.some((receipt) => !receipt.success)).toBe(false);

    const createMasterChildHash = await smartAccount.sendTransaction({
      to: factoryManagerAddress,
      feeCredit: 10_000_000n * gasPrice,
      abi: FACTORY_MANAGER_ABI,
      functionName: "deployNewMasterChild",
      args: [2, SALT],
    });

    const createMasterChildReceipts = await waitTillCompleted(client, createMasterChildHash);

    const masterChildAddress = createMasterChildReceipts[2].contractAddress as `0x${string}`;

    console.log(masterChildAddress);

    expect(createMasterChildReceipts.some((receipt) => !receipt.success)).toBe(false);

    const createFactoryHash = await smartAccount.sendTransaction({
      to: factoryManagerAddress,
      feeCredit: 10_000_000n * gasPrice,
      abi: FACTORY_MANAGER_ABI,
      functionName: "deployNewFactory",
      args: [2, SALT],
    });

    const createFactoryReceipts = await waitTillCompleted(client, createFactoryHash);

    const factoryAddress = createFactoryReceipts[2].contractAddress as `0x${string}`;

    console.log(factoryAddress);

    expect(createFactoryReceipts.some((receipt) => !receipt.success)).toBe(false);

    const createCloneHash = await smartAccount.sendTransaction({
      to: factoryAddress,
      feeCredit: 5_000_000n * gasPrice,
      abi: CLONE_FACTORY_ABI,
      functionName: "createCounterClone",
      args: [SALT],
    });

    const createCloneReceipts = await waitTillCompleted(client, createCloneHash);

    const cloneAddress = createCloneReceipts[2].contractAddress as `0x${string}`;

    expect(createCloneReceipts.some((receipt) => !receipt.success)).toBe(false);

    const incrementHash = await smartAccount.sendTransaction({
      to: cloneAddress as `0x${string}`,
      abi: MASTER_CHILD_ABI,
      functionName: "increment",
      args: [],
      feeCredit: 3_000_000n,
    });

    console.log(cloneAddress);

    const incrementReceipts = await waitTillCompleted(client, incrementHash);

    expect(incrementReceipts.some((receipt) => !receipt.success)).toBe(false);

    const result = await client.call(
      {
        to: cloneAddress,
        functionName: "getValue",
        abi: MASTER_CHILD_ABI,
        feeCredit: 1_000_000n,
      },
      "latest",
    );

    console.log(result);

    expect(result.decodedData).toBe(1n);
  }, 80000);
});
