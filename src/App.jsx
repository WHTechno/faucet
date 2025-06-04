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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">Snake Game with Lumera Testnet</h1>
      <WalletConnect
        setWalletAddress={setWalletAddress}
        setBalance={setBalance}
        setStatus={setStatus}
        score={score}
      />
      <p className="text-red-500 mb-4">{status}</p>
      <Game setScore={setScore} walletAddress={walletAddress} balance={balance} />
    </div>
  );
}

export default App;