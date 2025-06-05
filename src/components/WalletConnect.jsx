import { useState } from 'react';

export default function WalletConnect({ setWalletAddress, setBalance, setStatus, score }) {
  const [walletAddressLocal, setWalletAddressLocal] = useState(null);
  const [localBalance, setLocalBalance] = useState(null);
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

      const offlineSigner = window.getOfflineSigner('lumera-testnet-1');
      const accounts = await offlineSigner.getAccounts();
      const address = accounts[0].address;

      setWalletAddress(address);
      setWalletAddressLocal(address);

      // Connect to RPC to get balance
      const response = await fetch(`${RPC_ENDPOINTS[0]}/cosmos/bank/v1beta1/balances/${address}`);
      const data = await response.json();

      const coin = data.balances.find((c) => c.denom === 'ulmn') || { amount: '0' };
      const bal = (parseInt(coin.amount) / 1_000_000).toFixed(6);

      setBalance(bal);
      setLocalBalance(bal);
      setStatus(`Connected: ${address}, Balance: ${bal} LUMN`);
    } catch (error) {
      setStatus('Failed to connect wallet.');
      console.error(error);
    }
  };

  // Submit score only by signing message (no blockchain tx)
  const submitScore = async () => {
    if (!window.keplr || !walletAddressLocal) {
      setStatus('Please connect wallet first.');
      return;
    }

    if (score <= 0) {
      setStatus('Score must be greater than 0 to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const signMessage = {
        score,
        timestamp: Date.now(),
        address: walletAddressLocal,
      };
      const signMessageString = JSON.stringify(signMessage);

      if (window.keplr && window.keplr.signArbitrary) {
        const signature = await window.keplr.signArbitrary(
          'lumera-testnet-1',
          walletAddressLocal,
          signMessageString
        );

        setStatus(`✅ Score signed! Signature:\n${signature.signature}`);

        // TODO: Kirim signature dan message ke backend verifikasi di sini
        console.log('Signed message:', signMessageString);
        console.log('Signature:', signature.signature);
      } else {
        setStatus('Keplr does not support signArbitrary for this chain.');
        console.warn('Keplr signArbitrary not supported on this chain.');
      }
    } catch (error) {
      console.error('Score signing error:', error);
      setStatus(`Error signing score: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={connectWallet}
        className="px-4 py-2 mr-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        Connect Wallet
      </button>

      <button
        onClick={submitScore}
        disabled={!walletAddressLocal || isSubmitting || score <= 0}
        className={`px-4 py-2 rounded ${
          walletAddressLocal && !isSubmitting && score > 0
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-gray-400 cursor-not-allowed'
        } text-white`}
      >
        {isSubmitting ? 'Signing...' : 'Submit Score'}
      </button>

      <div className="mt-2 text-sm break-all">
        {walletAddressLocal && <p>Wallet: {walletAddressLocal}</p>}
        {localBalance !== null && <p>Balance: {localBalance} LUMN</p>}
      </div>
    </div>
  );
}
