'use client';

import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface CycleTimeChartProps {
  data: Array<{ priority: string; avg: number }>;
}

export function CycleTimeChart({ data }: CycleTimeChartProps) {
  const option = {
    tooltip: { trigger: 'axis', formatter: '{b}: {c} days' },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.priority),
    },
    yAxis: { type: 'value', name: 'Days' },
    grid: { left: '5%', right: '5%', bottom: '10%', containLabel: true },
    series: [
      {
        name: 'Avg cycle time',
        type: 'bar',
        data: data.map((d) => Math.round(d.avg * 10) / 10),
        itemStyle: { color: '#a855f7' },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 320 }} />;
}
