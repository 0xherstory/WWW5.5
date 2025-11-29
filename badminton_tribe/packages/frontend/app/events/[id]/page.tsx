'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContracts } from 'wagmi';
import CourtsideABI from '@/abi/Courtside.json';
import { COURTSIDE_ADDRESS, MOCK_USDT_ADDRESS } from '@/constants';
import { formatUnits, parseUnits, formatEther } from 'viem';
import { use, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

// ERC20 ABI Subset
const ERC20ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
       "constant": true,
       "inputs": [
           {"name": "_owner", "type": "address"},
           {"name": "_spender", "type": "address"}
       ],
       "name": "allowance",
       "outputs": [{"name": "", "type": "uint256"}],
       "type": "function"
    }
] as const;

// Helper: Date formatter
const formatDate = (ts: number) => new Date(ts * 1000).toLocaleString();

export default function EventDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const eventId = BigInt(id);
    const { address } = useAccount();

    // --- 1. Core Event Data ---
    const { data: eventData, refetch: refetchEvent } = useReadContract({
        address: COURTSIDE_ADDRESS as `0x${string}`,
        abi: CourtsideABI.abi as any,
        functionName: 'events',
        args: [eventId],
    });

    const { data: status, refetch: refetchStatus } = useReadContract({
        address: COURTSIDE_ADDRESS as `0x${string}`,
        abi: CourtsideABI.abi as any,
        functionName: 'eventStatus',
        args: [eventId],
    });

    const { data: settlementData, refetch: refetchSettlement } = useReadContract({
        address: COURTSIDE_ADDRESS as `0x${string}`,
        abi: CourtsideABI.abi as any,
        functionName: 'settlements',
        args: [eventId],
    });

    // --- 2. Player Data & Counts ---
    const { data: playerAddresses, refetch: refetchPlayersList } = useReadContract({
        address: COURTSIDE_ADDRESS as `0x${string}`,
        abi: CourtsideABI.abi as any,
        functionName: 'getEventPlayers',
        args: [eventId],
    });

    // Batch read all player info
    const { data: allPlayersInfo, refetch: refetchPlayersInfo } = useReadContracts({
        contracts: (playerAddresses as string[] || []).map(addr => ({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'players',
            args: [eventId, addr],
        }))
    });

    // My Player Info
    const { data: myPlayerInfo, refetch: refetchMyInfo } = useReadContract({
        address: COURTSIDE_ADDRESS as `0x${string}`,
        abi: CourtsideABI.abi as any,
        functionName: 'players',
        args: [eventId, address!],
        query: {
            enabled: !!address
        }
    });

    // --- 3. Hooks / Constants ---
    const { writeContract, isPending, data: writeHash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: writeHash });

    // Refresh data on success
    useEffect(() => {
        if (isSuccess) {
            refetchEvent();
            refetchStatus();
            refetchSettlement();
            refetchPlayersList();
            refetchPlayersInfo();
            refetchMyInfo();
        }
    }, [isSuccess]);

    // --- 4. Derived State ---
    const evt: any = eventData;
    
    // Safe parsing
    const decimals = evt ? (evt[7] ? Number(evt[7]) : 18) : 18;
    const feeAmount = evt ? evt[8] : BigInt(0);
    const feeDisplay = evt ? formatUnits(feeAmount, decimals) : '0';
    
    // Status enum mapping
    const STATUS_MAP = ['Draft', 'Open', 'Full', 'Active', 'Settling', 'Completed', 'Cancelled'];
    const currentStatus = status !== undefined ? Number(status) : 0;
    const statusText = STATUS_MAP[currentStatus];

    const isHost = evt && address && evt[5] === address;
    const hasPaid = (myPlayerInfo as any)?.[1];
    const isApproved = (myPlayerInfo as any)?.[2];

    // Stats
    const confirmedCount = allPlayersInfo ? allPlayersInfo.filter(r => r.status === 'success' && (r.result as any)[2] === true).length : 0;
    const pendingCount = allPlayersInfo ? allPlayersInfo.filter(r => r.status === 'success' && (r.result as any)[2] === false && (r.result as any)[1] === true).length : 0;

    // --- 5. Actions State ---
    const [settleExpense, setSettleExpense] = useState('');
    const settlement: any = settlementData; // Cast for easy access
    // Scores state: map address -> score
    const [scores, setScores] = useState<Record<string, string>>({}); 

    if (!eventData) return <div className="p-8 text-white">Loading...</div>;

    // --- 6. Action Handlers ---

    const handleApprove = () => {
        writeContract({
            address: MOCK_USDT_ADDRESS, 
            abi: ERC20ABI,
            functionName: 'approve',
            args: [COURTSIDE_ADDRESS, feeAmount],
        });
    };

    const handleJoin = () => {
        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'joinEvent',
            args: [eventId],
        });
    };

    const handleWithdraw = () => {
        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'withdrawApplication',
            args: [eventId],
        });
    };

    const handleCancel = () => {
        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'cancelEvent',
            args: [eventId],
        });
    };

    const handleApprovePlayer = (playerAddr: string) => {
       writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'approvePlayer',
            args: [eventId, playerAddr],
        });
    };

    const handleRejectPlayer = (playerAddr: string) => {
       writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'rejectPlayer',
            args: [eventId, playerAddr],
        });
    };

    const handleBatchApprove = () => {
        // Filter all pending players
        if (!allPlayersInfo || !playerAddresses) return;
        const pending = (playerAddresses as string[]).filter((addr, idx) => {
            const info = allPlayersInfo[idx];
            return info.status === 'success' && !(info.result as any)[2]; // !isApproved
        });
        
        if (pending.length === 0) return;

        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'batchApprovePlayers',
            args: [eventId, pending],
        });
    };

    const handleSettle = () => {
        if (!settleExpense) return;
        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'settlePayment',
            args: [eventId, parseUnits(settleExpense, decimals)],
        });
    };

    const handleChallenge = () => {
        // Stake 5%
        const stake = (feeAmount * BigInt(5)) / BigInt(100);
        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'challengeSettlement',
            args: [eventId],
            value: stake + BigInt(1000), 
        });
    };

    const handleFinalize = () => {
        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'finalizeSettlement',
            args: [eventId],
        });
    };

    const handleSubmitRatings = () => {
        const rawKeys = Object.keys(scores);
        const targets: string[] = [];
        const values: number[] = [];
        
        rawKeys.forEach(key => {
            // key format: "address:type"
            const [addr] = key.split(':');
            if (scores[key] && addr) {
                targets.push(addr);
                values.push(Number(scores[key]));
            }
        });

        if (targets.length === 0) return;

        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'batchSubmitRatings',
            args: [eventId, targets, values],
        });
    };

    // --- Render Helpers ---

    const renderPlayerList = () => {
        if (!playerAddresses || !allPlayersInfo) return <p>No players yet.</p>;
        
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-700/50 uppercase font-medium text-gray-300">
                        <tr>
                            <th className="px-4 py-3">Player</th>
                            <th className="px-4 py-3">Status</th>
                            {isHost && <th className="px-4 py-3">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {(playerAddresses as string[]).map((addr, i) => {
                            const infoResult = allPlayersInfo[i];
                            if (infoResult.status !== 'success') return null;
                            const info: any = infoResult.result;
                            // info: [wallet, hasPaid, isApproved, isCheckedIn, refund]
                            const pIsApproved = info[2];
                            
                            return (
                                <tr key={addr} className="hover:bg-gray-800/50">
                                    <td className="px-4 py-3 font-mono text-xs">{addr}</td>
                                    <td className="px-4 py-3">
                                        {pIsApproved ? <span className="text-green-400">Approved</span> : <span className="text-yellow-500">Pending</span>}
                                    </td>
                                    {isHost && (
                                        <td className="px-4 py-3 flex gap-2">
                                            {!pIsApproved && (
                                                <>
                                                    <button onClick={() => handleApprovePlayer(addr)} className="text-green-400 hover:underline">Approve</button>
                                                    <button onClick={() => handleRejectPlayer(addr)} className="text-red-400 hover:underline">Reject</button>
                                                </>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderRatingBoard = () => {
        if (!playerAddresses || !address) return null;
        
        // 1. Permission Check: Current user must be a participant
        const isParticipant = (playerAddresses as string[]).includes(address);
        if (!isParticipant) return null;

        const hostAddr = evt[5] as string;
        
        // 2. Build Rating Items
        const itemsToRate: { id: string, label: string, key: string }[] = [];

        // A. Skill Rating (Rate all other players)
        (playerAddresses as string[]).forEach(pAddr => {
            if (pAddr !== address) {
                itemsToRate.push({
                    id: pAddr,
                    label: "Skill Rating",
                    key: `${pAddr}:skill`
                });
            }
        });

        // B. Host Organization Rating (Rate host if not self)
        if (hostAddr && hostAddr !== address) {
            itemsToRate.push({
                id: hostAddr,
                label: "Organization Rating",
                key: `${hostAddr}:org`
            });
        }

        if (itemsToRate.length === 0) return <p>No one to rate.</p>;

        return (
            <div className="space-y-4 mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2">Rate Participants</h3>
                <div className="grid gap-3">
                    {itemsToRate.map(item => (
                        <div key={item.key} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-mono text-slate-600 truncate">
                                    {item.id}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-emerald-600 mt-1 tracking-wide">
                                    {item.label}
                                </div>
                            </div>
                            <input 
                                type="number" 
                                min="10" max="100"
                                placeholder="10-100"
                                className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-right focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                value={scores[item.key] || ''}
                                onChange={(e) => setScores(prev => ({ ...prev, [item.key]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>
                <button onClick={handleSubmitRatings} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold mt-2 shadow-sm transition">
                    Submit Ratings
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-[family-name:var(--font-geist-sans)]">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-slate-500 hover:text-emerald-600 mb-8 inline-block font-medium transition">&larr; Back</Link>
                
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm mb-8">
                    {/* 1. Common Info */}
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-slate-800">{evt[0]}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-emerald-600`}>
                                    {statusText}
                                </span>
                            </div>
                            <p className="text-slate-500 mb-2">{evt[1]}</p>
                            <p className="text-slate-600 flex items-center font-medium">📍 {evt[2]}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-600">{feeDisplay} USDT</div>
                            <div className="text-sm text-slate-400">per person</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Start</p>
                            <p className="font-semibold text-slate-700">{formatDate(Number(evt[3]))}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Duration</p>
                            <p className="font-semibold text-slate-700">{Number(evt[4]) / 3600} Hours</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Host</p>
                            <p className="font-mono text-sm truncate text-slate-700">{evt[5]}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Progress</p>
                            <p className="font-semibold text-emerald-500">
                                {confirmedCount} <span className="text-slate-400">/</span> {Number(evt[9])}
                                <span className="text-xs text-slate-400 ml-1">({pendingCount} pending)</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Level (M)</p>
                            <p className="font-semibold text-slate-700">{Number(evt[11])}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Level (F)</p>
                            <p className="font-semibold text-slate-700">{Number(evt[12])}</p>
                        </div>
                    </div>

                    {/* 2. Player View */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                        <h3 className="text-lg font-bold mb-4 border-b border-slate-200 pb-2 text-slate-700">Player Zone</h3>
                        
                        {/* Status: Open Or Full (Allow Withdraw) */}
                            {(statusText === 'Open' || statusText === 'Full') && (
                                <div className="flex gap-4">
                                    {!hasPaid ? (
                                        statusText === 'Open' && (
                                            <>
                                                <button onClick={handleApprove} className="flex-1 py-3 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-xl font-bold transition">
                                                    1. Approve USDT
                                                </button>
                                                <button onClick={handleJoin} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition shadow-sm">
                                                    2. Join Event
                                                </button>
                                            </>
                                        )
                                    ) : (
                                        <div className="flex-1 flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                            <span className="text-emerald-700 font-bold">✅ You have paid. Status: {isApproved ? 'Approved' : 'Pending Approval'}</span>
                                            {!isApproved && (
                                                <button onClick={handleWithdraw} className="text-sm text-red-600 hover:text-red-500 underline font-medium">
                                                    Withdraw Application
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Status: Settling */}
                            {statusText === 'Settling' && (
                                <div>
                                    <div className="bg-orange-50 p-4 rounded-lg mb-4 border border-orange-200">
                                        <p className="text-orange-600 font-bold mb-2">⚠️ Settlement Initiated</p>
                                        <p className="text-slate-700">Total Expense Reported: <span className="font-mono font-bold">{settlement ? formatUnits(settlement[0], decimals) : '0'} USDT</span></p>
                                        <p className="text-sm text-slate-500 mt-1">Challenge ends at: {settlement ? formatDate(Number(settlement[1])) : '-'}</p>
                                    </div>
                                    <button onClick={handleChallenge} className="w-full py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold transition shadow-sm">
                                        Challenge Settlement (Stake 5%)
                                    </button>
                                </div>
                            )}

                        {/* Status: Completed */}
                        {statusText === 'Completed' && renderRatingBoard()}
                    </div>

                    {/* 3. Host View */}
                    {isHost && (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                            <h3 className="text-lg font-bold mb-4 border-b border-blue-200 pb-2 text-blue-800">Host Zone</h3>

                            {/* Status: Open or Full (Manage Players) */}
                            {(statusText === 'Open' || statusText === 'Full') && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold text-slate-700">Participant Requests</h4>
                                        <div className="flex gap-2">
                                            <button onClick={handleBatchApprove} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-bold shadow-sm">
                                                Approve All Pending
                                            </button>
                                            <button onClick={handleCancel} className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm font-bold shadow-sm">
                                                Cancel Event
                                            </button>
                                        </div>
                                    </div>
                                    {renderPlayerList()}
                                </div>
                            )}

                            {/* Status: Settling */}
                            {(statusText === 'Active' || statusText === 'Full' || statusText === 'Open') && (
                                <div className="mt-8 pt-8 border-t border-slate-200">
                                    <h4 className="font-semibold mb-4 text-slate-700">Initiate Settlement</h4>
                                    <div className="flex gap-4">
                                        <input 
                                            type="number" 
                                            placeholder="Total Actual Expense (USDT)"
                                            className="bg-white border border-slate-300 rounded-lg px-4 py-2 flex-1 outline-none text-slate-800 focus:ring-2 focus:ring-emerald-500"
                                            value={settleExpense}
                                            onChange={(e) => setSettleExpense(e.target.value)}
                                        />
                                        <button onClick={handleSettle} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg font-bold shadow-sm">
                                            Submit Expense
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Status: Settling (Wait) */}
                            {statusText === 'Settling' && (
                                <div>
                                    <div className="p-4 bg-blue-100/50 border border-blue-200 rounded-xl mb-4">
                                        <p className="text-blue-800 font-medium">Settlement in progress. Wait for challenge period to end.</p>
                                        <p className="text-sm text-slate-500 mt-1">End Time: {settlement ? formatDate(Number(settlement[1])) : '-'}</p>
                                    </div>
                                    <button 
                                        onClick={handleFinalize} 
                                        disabled={settlement ? (BigInt(Math.floor(Date.now() / 1000)) < settlement[1]) : true}
                                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-sm"
                                    >
                                        Finalize & Distribute
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
