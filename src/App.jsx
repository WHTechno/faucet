// src/App.jsx
import { useState } from 'react';
import Game from './components/Game';
import WalletConnect from './components/WalletConnect';
import './App.css';

function App() {
  const [score, setScore] = useState(0);
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center p-4
                    bg-gradient-to-r from-purple-700 via-purple-800 to-green-600
                    text-white">
      <h1 className="text-3xl font-bold mb-4">Snake Game with Lumera WHTech</h1>

      <WalletConnect
        setWalletAddress={setWalletAddress}
        setBalance={setBalance}
        setStatus={setStatus}
        score={score}
      />

      {status && (
        <p className="text-red-400 mb-4">{status}</p>
      )}

      {walletAddress && (
        <p className="mb-2">
          Wallet: <span className="font-mono">{walletAddress}</span>
        </p>
      )}

      {balance !== null && (
        <p className="mb-4">
          Balance: <span className="font-semibold">{balance} TEA</span>
        </p>
      )}

      <Game setScore={setScore} walletAddress={walletAddress} />

      <p className="mt-4 font-semibold text-lg">Current Score: {score}</p>
    </div>
  );
}

export default App;
