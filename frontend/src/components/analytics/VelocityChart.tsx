'use client';

import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface VelocityChartProps {
  data: Array<{ week: string; count: number }>;
}

export function VelocityChart({ data }: VelocityChartProps) {
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.week),
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: 'value' },
    grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
    series: [
      {
        name: 'Cards completed',
        type: 'bar',
        data: data.map((d) => d.count),
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 320 }} />;
}
