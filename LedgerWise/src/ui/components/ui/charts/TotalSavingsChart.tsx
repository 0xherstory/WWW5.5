'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface DataPoint {
  month: string;
  savings: number;
  expenses: number;
}

interface TotalSavingsChartProps {
  data?: DataPoint[];
  height?: number;
}

// Morandi Colors
const COLOR_INCOME = '#5C8D75'; // Deep Green
const COLOR_EXPENSE = '#E5889E'; // Morandi Rose

const defaultData: DataPoint[] = [
  { month: 'Jan', savings: 1500, expenses: -900 },
  { month: 'Feb', savings: 1900, expenses: -1200 },
  { month: 'Mar', savings: 2100, expenses: -1100 },
  { month: 'Apr', savings: 1600, expenses: -1300 },
  { month: 'May', savings: 2400, expenses: -1000 }, // Current month high
  { month: 'Jun', savings: 1300, expenses: -1500 },
  { month: 'Jul', savings: 1700, expenses: -1100 },
  { month: 'Aug', savings: 2000, expenses: -1000 },
];

export const TotalSavingsChart: React.FC<TotalSavingsChartProps> = ({ data = defaultData, height = 240 }) => {
  return (
    <div style={{ width: '100%', height: height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: -20,
            bottom: 0,
          }}
        >
          <ReferenceLine y={0} stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(value) => `$${Math.abs(value)}`}
          />
          <Tooltip
            cursor={{ fill: '#f3f4f6', opacity: 0.4 }}
            content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                return (
                    <div className="bg-slate-800 text-white p-3 rounded-xl shadow-lg border-none text-xs">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                        <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-300 capitalize">{entry.name}:</span>
                        <span className="font-mono">${Math.abs(entry.value)}</span>
                        </div>
                    ))}
                    </div>
                );
                }
                return null;
            }}
          />
          <Bar
            name="Income"
            dataKey="savings"
            fill={COLOR_INCOME}
            radius={[4, 4, 0, 0]}
            barSize={16}
            animationDuration={1500}
          />
          <Bar
            name="Expenses"
            dataKey="expenses"
            fill={COLOR_EXPENSE}
            radius={[4, 4, 0, 0]}
            barSize={16}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};