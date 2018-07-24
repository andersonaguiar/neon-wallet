// @flow

import React from 'react'
import { ROUTES } from '../../core/constants'

import PasswordInput from '../../components/Inputs/PasswordInput'
import TextInput from '../../components/Inputs/TextInput'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'
import ConfirmIcon from '../../assets/icons/confirm-2.svg'
import AddIcon from '../../assets/icons/add.svg'
import ViewLayout from '../../components/ViewLayout'
import styles from './CreateWallet.scss'

type Option = 'CREATE' | 'IMPORT'

type Props = {
  generateNewWalletAccount: Function,
  history: Object,
  option: Option
}

type State = {
  passphrase: string,
  passphrase2: string,
  wif: string,
  walletName: string
}

export default class CreateWallet extends React.Component<Props, State> {
  state = {
    passphrase: '',
    passphrase2: '',
    wif: '',
    walletName: ''
  }

  createWalletAccount = (e: SyntheticMouseEvent<*>) => {
    e.preventDefault()
    const { history, option } = this.props
    const { passphrase, passphrase2, wif, walletName } = this.state
    const { generateNewWalletAccount } = this.props
    generateNewWalletAccount(
      passphrase,
      passphrase2,
      option === 'IMPORT' ? wif : null,
      history,
      walletName
    )
  }

  render = () => {
    const { passphrase, passphrase2, wif, walletName } = this.state
    const { option } = this.props

    return (
      <ViewLayout
        headerText={option === 'CREATE' ? 'Create New Wallet' : 'Import Wallet'}
        renderHeaderIcon={() =>
          option === 'IMPORT' ? <ConfirmIcon /> : <AddIcon />
        }
        headerTextUnderline
        renderBackButton={() => <BackButton routeTo={ROUTES.HOME} />}
      >
        <div className={styles.inputContainer}>
          <div id="createWallet" className={styles.flexContainer}>
            <form onSubmit={this.createWalletAccount}>
              {option === 'IMPORT' && (
                <div className={styles.inputMargin}>
                  <PasswordInput
                    value={wif}
                    label="Private Key"
                    onChange={e => this.setState({ wif: e.target.value })}
                    placeholder="Private Key"
                    autoFocus
                  />
                </div>
              )}
              <div className={styles.inputMargin}>
                <TextInput
                  value={walletName}
                  label="Wallet Name"
                  onChange={e => this.setState({ walletName: e.target.value })}
                  placeholder="Wallet Name"
                  autoFocus
                />
              </div>
              <div className={styles.inputMargin}>
                <PasswordInput
                  label="Passphrase"
                  value={passphrase}
                  onChange={e => this.setState({ passphrase: e.target.value })}
                  placeholder="Password"
                />
              </div>
              <div className={styles.inputMargin}>
                <PasswordInput
                  label="Confirm Passphrase"
                  value={passphrase2}
                  onChange={e => this.setState({ passphrase2: e.target.value })}
                  placeholder="Confirm Password"
                />
              </div>
              <div className={styles.loginButtonMargin}>
                <Button
                  renderIcon={option === 'IMPORT' ? ConfirmIcon : AddIcon}
                  type="submit"
                  primary
                  disabled={this.isDisabled()}
                >
                  {option === 'IMPORT' ? 'Import Wallet' : 'Create Wallet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </ViewLayout>
    )
  }

  isDisabled = () => {
    const { passphrase, passphrase2, wif, walletName } = this.state
    const { option } = this.props
    const validPassphrase = passphrase === passphrase2 && passphrase.length >= 4
    if (option === 'CREATE') {
      return !(validPassphrase && !!walletName)
    }
    return !(validPassphrase && !!walletName && !!wif)
  }
}
