import { client } from "../services/clickhouse";
import type { TransactionStat, TransactionStatPeriod } from "../validations/TransactionStat";

type RawTransactionStat = {
  time: string;
  value: string;
  earliest_block: string;
};

const mapToTransactionStat = (data: RawTransactionStat): TransactionStat => ({
  time: Number.parseInt(data.time),
  value: Number.parseInt(data.value),
  earliest_block: Number.parseInt(data.earliest_block),
});

const createQuery = (aggregateBlock: number) => `
    SELECT
    ceil(transactions.block_id/${aggregateBlock}) as time,
    min(transactions.block_id) as earliest_block,
    count() as value
    FROM transactions
    GROUP BY time
    ORDER BY time DESC
    LIMIT 30
`;

const BLOCKS_PER_MINUTE = 29;

export const getTransactionStat = async (period: TransactionStatPeriod) => {
  let query = "";

  switch (period) {
    case "1d": {
      query = createQuery(BLOCKS_PER_MINUTE * 60 * 24);
      break;
    }
    case "1m": {
      query = createQuery(BLOCKS_PER_MINUTE);
      break;
    }
    case "15m": {
      query = createQuery(BLOCKS_PER_MINUTE * 15);
      break;
    }
    case "30m": {
      query = createQuery(BLOCKS_PER_MINUTE * 30);
      break;
    }
    default: {
      throw new Error("Invalid period");
    }
  }

  const queryRes = await client.query({ query, format: "JSON" });

  try {
    const res = await queryRes.json<RawTransactionStat>();
    return res.data.map(mapToTransactionStat);
  } finally {
    queryRes.close();
  }
};
