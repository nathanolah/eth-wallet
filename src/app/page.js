"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { Contract, JsonRpcProvider, Wallet } from "ethers"; 
import { formatWeiAmount } from "./utils";
import blockchain from "./blockchain.json"
import Logo from "./components/Logo";
import Transfer from "./components/Transfer";

const initialChain = blockchain.chains[0];
const initialNativeAsset = blockchain.assets.find(asset => asset.id === initialChain.nativeAssetId);
const initialTokenAssets = blockchain.assets.filter(asset => (
  asset.chainId === initialNativeAsset.chainId
  && asset.id !== initialNativeAsset.id
));
const initialTransfer = {
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  amount: "1",
  asset: initialNativeAsset
}

export default function Home() {
  const [provider, setProvider] = useState(undefined);
  const [wallet, setWallet] = useState(undefined);
  const [chain, setChain] = useState(initialChain);
  const [nativeAsset, setNativeAsset] = useState(initialNativeAsset);
  const [tokenAssets, setTokenAssets] = useState(initialTokenAssets);
  const [transfer, setTransfer] = useState(initialTransfer);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  const [showAlert, setShowAlert] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!wallet) {
      const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_LOCAL_RPC_URL);
      const wallet = Wallet.fromPhrase(process.env.NEXT_PUBLIC_MNEMONIC, provider);
      setProvider(provider);
      setWallet(wallet);
      setShowAlert(true);  // Show alert when wallet is loaded

      // Start fade-out after 3 seconds
      const fadeTimeout = setTimeout(() => setFadeOut(true), 3000);

      // Remove alert from DOM after fade-out completes
      const removeAlertTimeout = setTimeout(() => setShowAlert(false), 3500);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(removeAlertTimeout);
      };
    }
  }, []);
  
  // Fetch the wallet balance and token balances
  useEffect(() => {
    const init = async () => {
      // get token asset balance calls
      const calls = tokenAssets.map(token => {
        const tokenContract = new Contract(token.address, blockchain.abis.erc20, wallet);
        return tokenContract.balanceOf(wallet.address);
      });
      
      // get native asset balance call
      calls.push(provider.getBalance(wallet.address));

      const results = await Promise.all(calls);
      const nativeBalance = results.pop();

      // for each token object add the balance to it.
      const newTokenAssets = tokenAssets.map((token, i) => ({...token, balance: results[i]}));
      
      setNativeAsset(nativeAsset => ({...nativeAsset, balance: nativeBalance}));
      setTokenAssets(newTokenAssets);
    };

    if (wallet && provider) init();
  }, [wallet, provider]);

  const handleInputChange = e => {
    let { name, value } = e.target;
    if (name === "asset") {
      const ticker = value
      value = [nativeAsset, ...tokenAssets].find(asset => asset.ticker === ticker)
      value = value || { ticker };
    } 

    if (name === "amount") {
      value = value.replaceAll(",", "")
    }

    setTransfer({
      ...transfer,
      [name]: value
    });
  }

  const formatTransferAmount = (amount) => {
    if (Number(amount) <= 1 || (amount.indexOf(".") !== -1 && !["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(amount.slice(-1)))) return amount;
    return new Intl.NumberFormat(
      "en-US",
      {maximumFractionDigits: transfer.asset.decimals}
    ).format(amount);
  }

  const updateBalances = async () => {
    if (!wallet || !provider) return;

    // Fetch the updated native asset balance
    const nativeBalance = await provider.getBalance(wallet.address);

    // Fetch the updated token balances
    const tokenBalancePromises = tokenAssets.map(token => {
        const tokenContract = new Contract(token.address, blockchain.abis.erc20, wallet);
        return tokenContract.balanceOf(wallet.address);
    });

    const tokenBalances = await Promise.all(tokenBalancePromises);

    // Update state with the new balances
    setNativeAsset({
        ...nativeAsset,
        balance: nativeBalance,
    });

    setTokenAssets(tokenAssets.map((token, i) => ({
        ...token,
        balance: tokenBalances[i],
    })));
  }

  return (
    <div className={`container mt-5 ${styles.container}`}>
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8 col-sm-10">
          <div className="card shadow-lg p-4 text-center">
            <h1 className="card-title fw-bold mb-4">Crypto Wallet</h1>
            <p className="card-subtitle mb-4 fw-bold text-muted">Manage your crypto</p>
            {wallet ? (
              <>
                {/* Native asset details */}
                <div>
                  {showAlert && (
                    <p className={`alert alert-success ${fadeOut ? "fade-out" : ""}`}>
                      Wallet loaded successfully
                    </p>
                  )}
                  <div className="mb-2">
                    <Logo asset={nativeAsset} />
                    {nativeAsset.name}
                  </div>
                  <p>{wallet.address}</p>
                  <p>
                    Balance: {nativeAsset.balance ? `${formatWeiAmount(nativeAsset.balance.toString(), 18)} ETH` : "Fetching balance..."}
                  </p>
                </div>

                {/* Display tokens and details */}
                <div className="mt-3">
                  <h5 className="fw-bold">Tokens</h5>
                  {tokenAssets.length > 0 ? (
                    <div className="list-group">
                      {tokenAssets.map(token => (
                        <div key={token.id} className="list-group-item d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <Logo asset={token} />
                            <div className="ms-3">
                              <div className="fw-bold">{token.name}</div>
                            </div>
                          </div>
                          <div>
                            {token.balance && formatWeiAmount(token.balance, token.decimals)} {token.ticker}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="alert alert-warning">No tokens found.</p>
                  )}
                </div>

                {/* Transfer div */}
                <div>
                  <div className="form-group mb-3">
                    <label>Transfer Asset</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ETH..."
                      name="asset"
                      value={transfer.asset.ticker} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Transfer To</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0x..."
                      name="to"
                      value={transfer.to} 
                      onChange={handleInputChange}
                      disabled={!transfer.asset.id}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Transfer Amount</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="1..."
                      name="amount"
                      value={formatTransferAmount(transfer.amount)} 
                      onChange={handleInputChange}
                      disabled={!transfer.asset.id}
                    />
                  </div>
                  <button
                    className="btn btn-primary mt-4"
                    onClick={() => setShowTransferModal(true)}
                    disabled={!transfer.asset.id || showTransferModal || !transfer.to || !transfer.amount}
                  >
                    Send
                  </button>
                  {showTransferModal && (
                    <Transfer 
                      provider={provider}
                      wallet={wallet}
                      chain={chain}
                      nativeAsset={nativeAsset}
                      transfer={transfer}
                      setShowTransferModal={setShowTransferModal}
                      updateBalances={updateBalances}
                    />
                  )}
                </div>
              </>
            ) : (
              <p className="alert alert-info">Loading...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}