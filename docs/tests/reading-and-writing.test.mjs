import TestHelper from "./TestHelper";
import { COUNTER_COMPILATION_COMMAND } from "./compilationCommands";
import { NIL_GLOBAL } from "./globals";
import { HASH_PATTERN, PREV_BLOCK_PATTERN } from "./patterns";

const CONFIG_FILE_NAME = "./tests/tempReadingAndWriting.ini";

const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);

const SALT = BigInt(Math.floor(Math.random() * 10000));

const CONFIG_FLAG = `--config ${CONFIG_FILE_NAME}`;

let TEST_COMMANDS;

beforeAll(async () => {
  const testHelper = new TestHelper({ configFileName: CONFIG_FILE_NAME });
  TEST_COMMANDS = testHelper.createCLICommandsMap(SALT);
  await testHelper.prepareTestCLI();
});

afterAll(async () => {
  await exec(`rm -rf ${CONFIG_FILE_NAME}`);
});

describe.sequential("CLI tests", async () => {
  test.sequential("the CLI correctly retrieves the latest block", async () => {
    const { stdout, stderr } = await exec(TEST_COMMANDS.RETRIEVE_LATEST_BLOCK_COMMAND);
    expect(stdout).toBeDefined;
    expect(stdout).toMatch(PREV_BLOCK_PATTERN);
  });

  test.sequential("the CLI can read transactions and receipts", async () => {
    await exec(COUNTER_COMPILATION_COMMAND);
    let { stdout, stderr } = await exec(TEST_COMMANDS.COUNTER_DEPLOYMENT_COMMAND);
    expect(stdout).toBeDefined;
    const HASH = stdout.match(HASH_PATTERN)[0];
    //startTransactionRead
    const READ_TRANSACTION_COMMAND = `${NIL_GLOBAL} transaction ${HASH} ${CONFIG_FLAG}`;
    //endTransactionRead
    ({ stdout, stderr } = await exec(READ_TRANSACTION_COMMAND));
    expect(stdout).toBeDefined;
    //startReceiptRead
    const READ_RECEIPT_COMMAND = `${NIL_GLOBAL} receipt ${HASH} ${CONFIG_FLAG}`;
    //endReceiptRead
    ({ stdout, stderr } = await exec(READ_RECEIPT_COMMAND));
    expect(stdout).toBeDefined;
  });
});
