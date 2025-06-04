import { useState } from 'react';
import { StargateClient, SigningStargateClient } from '@cosmjs/stargate';

export default function WalletConnect({ setWalletAddress, setBalance, setStatus, score }) {
  const [client, setClient] = useState(null);
  const [localBalance, setLocalBalance] = useState(null);
  const [walletAddressLocal, setWalletAddressLocal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const RPC_ENDPOINTS = [
    'https://lumera-testnet.rpc.kjnodes.com/',
    'https://rpc.testnet.lumera.io',
  ];

  const connectWallet = async () => {
    if (!window.keplr) {
      setStatus('Please install the Keplr wallet extension.');
      return;
    }

    try {
      await window.keplr.enable('lumera-testnet-1');

      let connectedClient = null;
      for (const endpoint of RPC_ENDPOINTS) {
        try {
          connectedClient = await StargateClient.connect(endpoint);
          console.log(`Connected to RPC: ${endpoint}`);
          break;
        } catch (err) {
          console.warn(`Failed to connect to ${endpoint}:`, err.message);
        }
      }

      if (!connectedClient) {
        throw new Error('Failed to connect to all RPC endpoints.');
      }

      setClient(connectedClient);

      const account = await window.keplr.getKey('lumera-testnet-1');
      const address = account.bech32Address;
      setWalletAddress(address);
      setWalletAddressLocal(address);

      const allBalances = await connectedClient.getAllBalances(address);
      console.log('All balances:', allBalances);

      const lumeraBalanceObj = allBalances.find(b => b.denom === 'ulumera');
      const balance = lumeraBalanceObj
        ? parseInt(lumeraBalanceObj.amount, 10) / 1_000_000
        : 0;

      setLocalBalance(balance);
      setBalance(balance);
      setStatus(`✅ Connected: ${address} | Balance: ${balance} LUMERA-TESTNET-1`);
    } catch (error) {
      console.error('Wallet connection error:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const disconnectWallet = () => {
    setClient(null);
    setWalletAddressLocal(null);
    setLocalBalance(null);
    setWalletAddress(null);
    setBalance(null);
    setStatus('Disconnected');
  };

  const submitScore = async () => {
    if (!window.keplr || !walletAddressLocal) {
      setStatus('Please connect wallet first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const signer = window.getOfflineSigner('lumera-testnet-1');
      const signingClient = await SigningStargateClient.connectWithSigner(
        RPC_ENDPOINTS[0],
        signer
      );

      const msg = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: walletAddressLocal,
          toAddress: walletAddressLocal,
          amount: [{ denom: 'ulumera', amount: '1' }],
        },
      };

      const fee = {
        amount: [{ denom: 'ulumera', amount: '5000' }],
        gas: '200000',
      };

      const result = await signingClient.signAndBroadcast(
        walletAddressLocal,
        [msg],
        fee,
        `Score: ${score}`
      );

      if (result.code === 0) {
        setStatus(`✅ Score submitted! Tx Hash: ${result.transactionHash}`);
      } else {
        setStatus(`❌ Failed to submit score. Error code: ${result.code}`);
      }
    } catch (error) {
      console.error('Score submission error:', error);
      setStatus(`Error submitting score: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!walletAddressLocal ? (
        <button
          onClick={connectWallet}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Connect Keplr Wallet
        </button>
      ) : (
        <>
          <button
            onClick={disconnectWallet}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Disconnect Wallet
          </button>

          <button
            onClick={submitScore}
            className={`px-4 py-2 rounded ${
              localBalance && localBalance >= 0.01 && !isSubmitting
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-400 cursor-not-allowed'
            } text-white`}
            disabled={!localBalance || localBalance < 0.01 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </button>

          <a
            href="https://www.stake-hub.xyz/services/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Get Testnet LUMERA (Faucet)
          </a>

          <div>
            <p>Wallet Address: {walletAddressLocal}</p>
            <p>Balance: {localBalance ?? 0} LUMERA</p>
          </div>
        </>
      )}
    </div>
  );
}
