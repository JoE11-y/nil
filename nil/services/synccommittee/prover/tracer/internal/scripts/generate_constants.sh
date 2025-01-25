#!/usr/bin/env bash

# This script generates Go file with a single constant passed as agruments

if [[ $# -ne 3 ]]; then
    echo "usage: $0 constant_name constant_value output_file"
    exit 1
fi

name=$1
value=$2
output_file=$3

read -r -d '' TEMPLATE <<EOT
// Autogenerated code; DO NOT EDIT.

package constants

const (
    $name = "$value"
)
EOT

echo "$TEMPLATE" >$output_file
