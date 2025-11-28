'use client';

import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { SankeyData } from '@/lib/constants';

interface SankeyChartProps {
  data: SankeyData;
  height?: number;
}

export const SankeyChart: React.FC<SankeyChartProps> = ({ data, height = 300 }) => {
  // Custom node rendering
  const renderNode = (props: any) => {
    const { x, y, width, height, index, payload } = props;
    const isIncome = index === 0; // Assuming first node is total budget/income

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={isIncome ? "#1a1a1a" : "#d4b062"} // Primary or Accent
          fillOpacity={0.9}
          rx={4}
        />
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="10"
          className="pointer-events-none select-none"
        >
          {/* Simple first letter or icon could go here */}
        </text>
        <text
          x={x > 100 ? x + width + 8 : x - 8}
          y={y + height / 2}
          textAnchor={x > 100 ? 'start' : 'end'}
          dominantBaseline="middle"
          fill="#666"
          fontSize="12"
          fontWeight="500"
        >
          {payload.name}
        </text>
      </g>
    );
  };

  return (
    <div style={{ width: '100%', height: height }}>
      <ResponsiveContainer>
        <Sankey
          data={data}
          node={renderNode}
          nodePadding={50}
          margin={{
            left: 20,
            right: 100, // Extra space for labels
            top: 20,
            bottom: 20,
          }}
          link={{ stroke: '#d4b062', strokeOpacity: 0.2 }}
        >
          <Tooltip 
             contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
             }}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
};