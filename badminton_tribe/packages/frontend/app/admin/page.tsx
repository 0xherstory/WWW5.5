'use client';

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import CourtsideABI from '@/abi/Courtside.json';
import { COURTSIDE_ADDRESS } from '@/constants';
import { formatUnits, parseUnits } from 'viem';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function AdminPage() {
    const { address } = useAccount();
    
    // 1. Check Owner
    const { data: owner } = useReadContract({
        address: COURTSIDE_ADDRESS as `0x${string}`,
        abi: CourtsideABI.abi as any,
        functionName: 'owner',
    });

    // 2. Fetch All Events to find disputes
    const { data: nextId } = useReadContract({
        address: COURTSIDE_ADDRESS as `0x${string}`,
        abi: CourtsideABI.abi as any,
        functionName: 'nextEventId',
    });

    const [allIds, setAllIds] = useState<bigint[]>([]);

    useEffect(() => {
        if (nextId) {
            const max = Number(nextId);
            const arr = [];
            for (let i = 1; i < max; i++) {
                arr.push(BigInt(i));
            }
            setAllIds(arr);
        }
    }, [nextId]);

    // Batch read settlements
    const { data: settlementsData, refetch: refetchSettlements } = useReadContracts({
        contracts: allIds.map(id => ({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'settlements',
            args: [id],
        }))
    });

    // Batch read names for context
    const { data: eventsData } = useReadContracts({
        contracts: allIds.map(id => ({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'events',
            args: [id],
        }))
    });

    // Filter Disputed
    const disputedEvents = useMemo(() => {
        if (!settlementsData || !eventsData) return [];
        return settlementsData.map((res, idx) => {
            if (res.status !== 'success') return null;
            const settlement: any = res.result;
            // settlement: [totalExpense, challengeEndTime, settled, isDisputed]
            if (settlement[3] === true) { // isDisputed
                const evtRes = eventsData[idx];
                const evtName = evtRes.status === 'success' ? (evtRes.result as any)[0] : `Event #${allIds[idx]}`;
                const decimals = evtRes.status === 'success' ? ((evtRes.result as any)[7] ?? 18) : 18;
                
                return {
                    id: allIds[idx],
                    name: evtName,
                    reportedExpense: settlement[0],
                    decimals: Number(decimals) // default 18 if not found
                };
            }
            return null;
        }).filter(Boolean) as { id: bigint, name: string, reportedExpense: bigint, decimals: number }[];
    }, [settlementsData, eventsData, allIds]);

    // Form State Management (Map eventId -> Form Data)
    const [forms, setForms] = useState<Record<string, { finalExpense: string, challenger: string, win: boolean }>>({});

    const updateForm = (id: string, field: string, value: any) => {
        setForms(prev => {
            const currentForm = prev[id] || { finalExpense: '', challenger: '', win: false };
            return {
                ...prev,
                [id]: { ...currentForm, [field]: value }
            };
        });
    };

    // Resolve Action
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isSuccess) refetchSettlements();
    }, [isSuccess]);

    const handleResolve = (id: bigint, decimals: number) => {
        const idStr = id.toString();
        const formData = forms[idStr] || { finalExpense: '', challenger: '', win: false };
        
        if (!formData.finalExpense || !formData.challenger) {
            alert("Please fill all fields");
            return;
        }

        writeContract({
            address: COURTSIDE_ADDRESS as `0x${string}`,
            abi: CourtsideABI.abi as any,
            functionName: 'resolveDispute',
            args: [
                id, 
                parseUnits(formData.finalExpense, decimals), 
                formData.win, 
                formData.challenger as `0x${string}`
            ],
        });
    };

    // Auth Guard
    if (address && owner && address !== owner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-600 text-2xl font-bold">
                ⛔️ Unauthorized (Admin Only)
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-[family-name:var(--font-geist-sans)]">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                    <h1 className="text-3xl font-bold text-red-600">Admin Panel ⚖️</h1>
                    <Link href="/" className="text-slate-500 hover:text-slate-800 font-medium transition">&larr; Back</Link>
                </header>

                <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-6 text-red-700">Active Disputes ({disputedEvents.length})</h2>
                    
                    <div className="space-y-6">
                        {disputedEvents.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">No active disputes.</p>
                        ) : (
                            disputedEvents.map(item => {
                                const idStr = item.id.toString();
                                const form = forms[idStr] || { finalExpense: '', challenger: '', win: false };

                                return (
                                    <div key={idStr} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                                                <p className="text-xs font-mono text-slate-400">ID: {idStr}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500">Reported Expense</p>
                                                <p className="text-xl font-mono text-orange-600 font-bold">{formatUnits(item.reportedExpense, item.decimals)} USDT</p>
                                            </div>
                                        </div>

                                        {/* Resolution Form */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">Final Approved Expense</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-800 focus:outline-none focus:border-red-500"
                                                    placeholder="Amount"
                                                    value={form.finalExpense}
                                                    onChange={(e) => updateForm(idStr, 'finalExpense', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">Challenger Address</label>
                                                <input 
                                                    type="text"
                                                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-800 font-mono text-sm focus:outline-none focus:border-red-500"
                                                    placeholder="0x..."
                                                    value={form.challenger}
                                                    onChange={(e) => updateForm(idStr, 'challenger', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="text-sm font-bold text-slate-700">Challenger Wins?</label>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-5 h-5 accent-red-600"
                                                    checked={form.win}
                                                    onChange={(e) => updateForm(idStr, 'win', e.target.checked)}
                                                />
                                                <span className="text-xs text-slate-400">(If checked, deposit returned to challenger)</span>
                                            </div>
                                            <div className="flex items-end">
                                                <button 
                                                    onClick={() => handleResolve(item.id, item.decimals)}
                                                    disabled={isPending}
                                                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-sm transition"
                                                >
                                                    {isPending ? 'Resolving...' : 'Resolve Dispute'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
