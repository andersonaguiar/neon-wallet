// @flow
import { createActions } from 'spunky'
import Neon from '@cityofzion/neon-js'
import { isEmpty } from 'lodash-es'

import { toBigNumber } from '../core/math'
import { getStorage, setStorage } from '../core/storage'
import { getNode, getRPCEndpoint } from './nodeStorageActions'
import {
  findAndReturnTokenInfo,
  getImageBySymbol,
} from '../util/findAndReturnTokenInfo'

export const ID = 'pendingTransactions'
const STORAGE_KEY = 'pendingTransactions'
const MINIMUM_CONFIRMATIONS = 10
const INVALID_TX_ERROR_MESSAGE = 'Unknown transaction'

export const parseContractTransaction = async (
  transaction: PendingTransaction,
  net: string,
): Promise<Array<ParsedPendingTransaction>> => {
  const parsedData = []
  // eslint-disable-next-line camelcase
  const { confirmations, txid, net_fee, blocktime = 0 } = transaction
  transaction.vout.pop()
  // eslint-disable-next-line
  for (const send of transaction.vout) {
    parsedData.push({
      confirmations,
      txid: txid.substring(2),
      net_fee,
      blocktime,
      amount: toBigNumber(send.value).toString(),
      to: send.address,
      // eslint-disable-next-line no-await-in-loop
      asset: await findAndReturnTokenInfo(send.asset, net),
    })
  }
  return parsedData
}

export const parseInvocationTransaction = (
  transaction: PendingTransaction,
): Array<ParsedPendingTransaction> => {
  const {
    confirmations,
    txid,
    // eslint-disable-next-line camelcase
    net_fee,
    blocktime = 0,
    sendEntries,
  } = transaction

  // things get tricky during invocation transactions as there is no vout array
  // and it is not straight forward parsing the produced script. Instead we
  // use the original send entries array.
  return sendEntries.map(send => ({
    confirmations,
    txid: txid.substring(2),
    net_fee,
    blocktime,
    amount: toBigNumber(send.amount).toString(),
    to: send.address,
    asset: {
      symbol: send.symbol,
      image: getImageBySymbol(send.symbol),
    },
  }))
}

export const parseTransactionInfo = async (
  pendingTransactionsInfo: Array<PendingTransaction>,
  net: string,
) => {
  const parsedData: Array<ParsedPendingTransaction> = []
  // eslint-disable-next-line
  for (const transaction of pendingTransactionsInfo) {
    if (transaction) {
      if (transaction.type === 'InvocationTransaction') {
        parsedData.push(...parseInvocationTransaction(transaction))
      } else {
        // eslint-disable-next-line no-await-in-loop
        parsedData.push(...(await parseContractTransaction(transaction, net)))
      }
    }
  }
  const sortedByBlockTime = (
    a: ParsedPendingTransaction,
    b: ParsedPendingTransaction,
  ) => b.blocktime - a.blocktime
  const sorted: Array<ParsedPendingTransaction> = parsedData.sort(
    sortedByBlockTime,
  )
  return sorted
}

const getPendingTransactions = async (): Promise<PendingTransactions> =>
  getStorage(STORAGE_KEY)

const setPendingTransactions = async (
  pendingTransactions: PendingTransactions,
): Promise<any> => setStorage(STORAGE_KEY, pendingTransactions)

export const pruneConfirmedOrStaleTransaction = async (
  address: string,
  txId: string,
) => {
  const storage = await getPendingTransactions()
  if (Array.isArray(storage[address])) {
    storage[address] = storage[address].filter(
      // use includes here to be indifferent to 0x prefix
      transaction => transaction.hash && !transaction.hash.includes(txId),
    )
  }
  await setPendingTransactions(storage)
}

export const fetchTransactionInfo = async (
  transactions: PendingTransactions,
  address: string,
  net: string,
) => {
  if (Array.isArray(transactions[address]) && transactions[address].length) {
    let url = await getNode(net)
    if (isEmpty(url)) {
      url = await getRPCEndpoint(net)
    }
    const client = Neon.create.rpcClient(url)
    const pendingTransactionInfo = []

    // eslint-disable-next-line
    for (const transaction of transactions[address]) {
      if (transaction) {
        // eslint-disable-next-line
        const result = await client
          .getRawTransaction(transaction.hash, 1)
          .catch(async e => {
            console.error(
              e,
              `Error performing getRawTransaction for txid: ${
                transaction.hash
              }`,
            )
            if (e.message === INVALID_TX_ERROR_MESSAGE) {
              await pruneConfirmedOrStaleTransaction(address, transaction.hash)
            }
          })

        if (result) {
          if (result.confirmations >= MINIMUM_CONFIRMATIONS) {
            // eslint-disable-next-line
            await pruneConfirmedOrStaleTransaction(address, transaction.hash)
          } else {
            pendingTransactionInfo.push({ ...result, ...transaction })
          }
        }
      }
    }

    return parseTransactionInfo(pendingTransactionInfo, net)
  }
  return []
}

export const getPendingTransactionsFromStorage = createActions(
  ID,
  () => async () => {
    const pendingTransactions = await getPendingTransactions()
    return pendingTransactions
  },
)

export const addPendingTransaction = createActions(
  ID,
  ({ address, tx, net }) => async (): Promise<
    Array<ParsedPendingTransaction>,
  > => {
    const transactions = await getPendingTransactions()

    if (Array.isArray(transactions[address])) {
      transactions[address].push(tx)
    } else {
      transactions[address] = [tx]
    }
    await setPendingTransactions(transactions)
    return fetchTransactionInfo(transactions, address, net)
  },
)

export const getPendingTransactionInfo = createActions(
  ID,
  ({ address, net }) => async (): Promise<Array<Object>> => {
    const transactions = await getPendingTransactions()
    return fetchTransactionInfo(transactions, address, net)
  },
)
