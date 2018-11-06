// @flow
import React, { Component } from 'react'

import SelectInput from '../../../../Inputs/SelectInput'
import NumberInput from '../../../../Inputs/NumberInput'
import DisplayInput from '../../../DisplayInput'

import { toBigNumber } from '../../../../../core/math'
import { formatBalanceByDecimalScale } from '../../../../../core/formatters'

import TrashCanIcon from '../../../../../assets/icons/delete.svg'

import styles from '../SendRecipientList.scss'

type Props = {
  asset: string,
  amount: number,
  address: string,
  max: number,
  index: number,
  errors: Object,
  sendableAssets: Object,
  showConfirmSend: boolean,
  contacts: Object,
  numberOfRecipients: number,
  clearErrors: (index: number, field: string) => any,
  removeRow: (index: number) => any,
  updateRowField: (index: number, field: string, value: any) => any
}

class SendRecipientListItem extends Component<Props> {
  handleFieldChange = (value: string, type: 'asset' | 'amount' | 'address') => {
    const { index, updateRowField, contacts, clearErrors, max } = this.props

    let normalizedValue = value

    if (type === 'address') {
      const isContactString = Object.keys(contacts).find(
        contact => contact === value
      )
      if (isContactString) {
        normalizedValue = contacts[value]
      }
    } else if (type === 'amount' && value) {
      normalizedValue = toBigNumber(value).gt(toBigNumber(max))
        ? max.toString()
        : value
    }

    clearErrors(index, type)
    updateRowField(index, type, normalizedValue)
  }

  handleMaxClick = () => {
    const { index, updateRowField, max } = this.props
    updateRowField(index, 'amount', max.toString())
  }

  handleDeleteRow = () => {
    const { index, removeRow } = this.props
    removeRow(index)
  }

  clearErrorsOnFocus = (e: Object) => {
    const { name } = e.target
    const { clearErrors, index } = this.props
    clearErrors(index, name)
  }

  createAssetList = (): Array<string> => Object.keys(this.props.sendableAssets)

  createContactList = (): Array<string> => Object.keys(this.props.contacts)

  render() {
    const {
      index,
      address,
      amount,
      asset,
      errors,
      max,
      showConfirmSend,
      numberOfRecipients
    } = this.props

    const selectInput = showConfirmSend ? (
      <DisplayInput value={asset} />
    ) : (
      <SelectInput
        value={asset}
        name="asset"
        onChange={value => this.handleFieldChange(value, 'asset')}
        items={this.createAssetList()}
        onFocus={this.clearErrorsOnFocus}
        disabled
      />
    )

    const numberInput = showConfirmSend ? (
      <DisplayInput value={formatBalanceByDecimalScale(amount)} />
    ) : (
      <NumberInput
        value={amount || 0}
        max={max}
        name="amount"
        onChange={(e, value) => this.handleFieldChange(value, 'amount')}
        handleMaxClick={this.handleMaxClick}
        onFocus={this.clearErrorsOnFocus}
        error={errors && errors.amount}
        options={{ numeralDecimalScale: 8 }}
      />
    )

    const addressInput = showConfirmSend ? (
      <DisplayInput value={address} />
    ) : (
      <SelectInput
        placeholder="Add wallet or select contact"
        value={address || ''}
        name="address"
        onChange={value => this.handleFieldChange(value, 'address')}
        items={this.createContactList()}
        onFocus={this.clearErrorsOnFocus}
        error={errors && errors.address}
      />
    )

    const trashCanButton = showConfirmSend ? null : (
      <button
        type="button"
        className={styles.deleteButton}
        onClick={this.handleDeleteRow}
        disabled={showConfirmSend}
      >
        <TrashCanIcon />
      </button>
    )

    return (
      <li className={styles.sendRecipientListItem}>
        <div className={styles.rowNumber}>{`${`0${index + 1}`.slice(-2)}`}</div>
        <div className={styles.asset}>{selectInput}</div>
        <div className={styles.amount}>{numberInput}</div>
        <div className={styles.address}>{addressInput}</div>
        <div className={styles.delete}>
          {numberOfRecipients > 1 && trashCanButton}
        </div>
      </li>
    )
  }
}

export default SendRecipientListItem
