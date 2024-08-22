"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { parseUnits, Contract } from 'ethers';
import { formatWeiAmount } from '../utils';
import blockchain from "../blockchain.json"

// TO DO : Research and potentally add a tip feature to speed up txs.
// Wei: (10^18) and Gwei: (10^9), Gwei is often associated with gas calculations.

export default function Transfer({ provider, wallet, chain, nativeAsset, transfer, setShowTransferModal, updateBalances }) {
    const [txCostEth, setTxCostEth] = useState(undefined); // in Wei (10^18) 
    const [txCostUSD, setTxCostUSD] = useState(undefined);
    const [sending, setSending] = useState(undefined);
    const [txHash, setTxHash] = useState(undefined);
    const [error, setError] = useState(undefined);
    
    useEffect(() => {
        // Calculate the txcost in Eth and txcost in USD
        const init = async () => {
            let estimateGas;

            // 1. Estimate the gas cost
            if (!transfer.asset.address) {
                // Native asset
                const txRequest = {
                    from: wallet.address,
                    to: transfer.to,
                    value: parseUnits(transfer.amount, transfer.asset.decimals)
                };
                estimateGas = wallet.estimateGas(txRequest);
            } else {
                // ERC20 token asset
                const token = new Contract(transfer.asset.address, blockchain.abis.erc20, wallet);
                estimateGas = token.transfer.estimateGas(transfer.to, parseUnits(transfer.amount, transfer.asset.decimals));
            }
            
            // 2. Calls the estimate the gas cost function.
            // Get gas price parameters from getFeeData (EIP 1559 using baseFee & tip). 
            // Fetches ETH price in USD.
            const [ gasCost, feeData, ethPriceRaw ] = await Promise.all([
                estimateGas,
                provider.getFeeData(), // gets maxFeePerGas
                fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${nativeAsset.coingeckoId}&vs_currencies=usd&x_cg_demo_api_key=${process.env.NEXT_PUBLIC_COINGECKO_API_KEY}`)
            ]);

            // 3. Compute txCostEth
            const txCostEth = BigInt(gasCost) * BigInt(feeData.maxFeePerGas); 
            // 4. Compute txCostUSD
            const ethPrice = await ethPriceRaw.json();
            // Adjust ethPrice since its (integer * floating point)
            const scaleFactor = 100;
            const adjustedEthPrice = parseInt(ethPrice[nativeAsset.coingeckoId].usd.toFixed(2) * scaleFactor);
            const txCostUSD = txCostEth * BigInt(adjustedEthPrice) / BigInt(scaleFactor);
            
            setTxCostEth(txCostEth);
            setTxCostUSD(txCostUSD);
        }; 

        init();
    }, []);

    const getTransactionFeeString = () => {
        return `${formatWeiAmount(txCostUSD, nativeAsset.decimals)} USD (${formatWeiAmount(txCostEth, nativeAsset.decimals)} ${nativeAsset.ticker})`;
    };

    const getTransactionURL = (txHash) => {
        return `${chain.blockchainExplorer}/${txHash}`;
    };

    // Create and send transaction
    const send = async () => {
        setSending(true);
        let tx;

        try {
            if (!transfer.asset.address) {
                // Native token
                const txRequest = {
                    from: wallet.address,
                    to: transfer.to,
                    value: parseUnits(transfer.amount, transfer.asset.decimals)
                };
                tx = wallet.sendTransaction(txRequest);
            } else {
                // ERC20 token     
                const token = new Contract(transfer.asset.address, blockchain.abis.erc20, wallet);
                tx = token.transfer(transfer.to, parseUnits(transfer.amount, transfer.asset.decimals));
            }

            const txResponse = await tx;
            const txReceipt = await txResponse.wait();
            if (parseInt(txReceipt.status !== 1)) throw new Error("Transaction Failed");
            setTxHash(txReceipt.hash)

            updateBalances();

        } catch (error) {
            console.log(error);
            setError(true);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="modal-backdrop fade show"></div>

            {/* Modal */}
            <div className="modal show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">Transfer Details</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setShowTransferModal(false)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group mb-3 text-start">
                                <label className="form-label">Network</label>
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    name="network"
                                    value={chain.name}
                                    disabled={true}
                                />
                            </div>
                            <div className="form-group mb-3 text-start">
                                <label className="form-label">From</label>
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    name="from"
                                    value={wallet.address}
                                    disabled={true}
                                />
                            </div>
                            <div className="form-group mb-3 text-start">
                                <label className="form-label">To</label>
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    name="to"
                                    value={transfer.to}
                                    disabled={true}
                                />
                            </div>
                            <div className="form-group mb-3 text-start">
                                <label className="form-label">Asset</label>
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    name="amount"
                                    value={transfer.asset.ticker}
                                    disabled={true}
                                />
                            </div>
                            <div className="form-group mb-3 text-start">
                                <label className="form-label">Amount</label>
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    name="amount"
                                    value={transfer.amount}
                                    disabled={true}
                                />
                            </div>
                            <div className="form-group mb-3 text-start">
                                <label className="form-label">Transaction Fee</label>
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    name="txFee"
                                    value={txCostEth && txCostUSD ? getTransactionFeeString() : "Loading..."}
                                    disabled={true}
                                />
                            </div>
                        </div>
                        {sending && (
                            <div className="alert alert-info mt-3 mx-3">
                                <i className="bi bi-info-circle-fill me-2"></i> Sending...
                            </div>
                        )}
                        {txHash && (
                            <div className="alert alert-success mt-3 mx-3">
                                <i className="bi bi-check-circle-fill me-2"></i> Transfer Successful - <Link href={getTransactionURL(txHash)}>Transaction hash</Link>
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-danger mt-3 mx-3">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i> Transfer Failed
                            </div>
                        )}
                        <div className="modal-footer">
                            <button className="btn btn-primary me-2" onClick={() => {send()}}>Submit</button>
                            <button className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}