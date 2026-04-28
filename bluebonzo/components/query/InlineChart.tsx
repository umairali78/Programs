'use client'

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ChartData } from '@/lib/demo-data/types'

const COLORS = ['#14b8a6', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']

interface InlineChartProps {
  chart: ChartData
}

export function InlineChart({ chart }: InlineChartProps) {
  const { type, title, data, xKey, yKeys } = chart

  const commonProps = {
    data,
    margin: { top: 8, right: 8, left: 0, bottom: 8 },
  }

  return (
    <div className="mt-4 p-4 rounded-xl border border-border bg-secondary/30">
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        {type === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
            <Tooltip
              contentStyle={{ background: 'hsl(222 44% 9%)', border: '1px solid hsl(217 32% 15%)', borderRadius: 8 }}
              labelStyle={{ color: 'hsl(210 40% 96%)' }}
            />
            <Legend iconSize={10} />
            {yKeys.map((yk, i) => (
              <Line key={yk.key} type="monotone" dataKey={yk.key} name={yk.label}
                stroke={yk.color ?? COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        ) : type === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
            <Tooltip
              contentStyle={{ background: 'hsl(222 44% 9%)', border: '1px solid hsl(217 32% 15%)', borderRadius: 8 }}
              labelStyle={{ color: 'hsl(210 40% 96%)' }}
            />
            <Legend iconSize={10} />
            {yKeys.map((yk, i) => (
              <Bar key={yk.key} dataKey={yk.key} name={yk.label}
                fill={yk.color ?? COLORS[i]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        ) : type === 'area' ? (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
            <Tooltip
              contentStyle={{ background: 'hsl(222 44% 9%)', border: '1px solid hsl(217 32% 15%)', borderRadius: 8 }}
              labelStyle={{ color: 'hsl(210 40% 96%)' }}
            />
            <Legend iconSize={10} />
            {yKeys.map((yk, i) => (
              <Area key={yk.key} type="monotone" dataKey={yk.key} name={yk.label}
                stroke={yk.color ?? COLORS[i]} fill={`${yk.color ?? COLORS[i]}20`} strokeWidth={2} />
            ))}
          </AreaChart>
        ) : (
          <PieChart>
            <Pie data={data} dataKey={yKeys[0]?.key ?? 'value'} nameKey={xKey} cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
              {data.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(222 44% 9%)', border: '1px solid hsl(217 32% 15%)', borderRadius: 8 }} />
            <Legend iconSize={10} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
