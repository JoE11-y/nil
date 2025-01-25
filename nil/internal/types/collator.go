package types

// Neighbor describes collator's current position in a neighbor shard.
type Neighbor struct {
	ShardId ShardId `json:"shardId"`

	// next block and transaction to read
	BlockNumber      BlockNumber
	TransactionIndex TransactionIndex
}

type CollatorState struct {
	Neighbors []Neighbor `json:"neighbors" ssz-max:"10000"`
}
