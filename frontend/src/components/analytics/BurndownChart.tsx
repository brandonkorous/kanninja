'use client';

import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface BurndownChartProps {
  data: Array<{ date: string; remaining: number; completed: number }>;
}

export function BurndownChart({ data }: BurndownChartProps) {
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Remaining', 'Completed'] },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: 'value' },
    grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
    series: [
      {
        name: 'Remaining',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.remaining),
        itemStyle: { color: '#ef4444' },
        areaStyle: { opacity: 0.2 },
      },
      {
        name: 'Completed',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.completed),
        itemStyle: { color: '#22c55e' },
        areaStyle: { opacity: 0.2 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 320 }} />;
}
