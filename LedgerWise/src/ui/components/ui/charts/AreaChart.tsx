'use client';

import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendData } from '@/lib/constants';

interface AreaChartProps {
  data: TrendData[];
  height?: number;
}

export const AreaChart: React.FC<AreaChartProps> = ({ data, height = 200 }) => {
  return (
    <div style={{ width: '100%', height: height }}>
      <ResponsiveContainer>
        <RechartsAreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            cursor={{ stroke: '#d4b062', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#1a1a1a" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorAmount)" 
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};