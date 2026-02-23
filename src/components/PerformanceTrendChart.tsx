'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TrendPoint {
  week: string
  avgScore: number
  benchmark: number
}

interface PerformanceTrendChartProps {
  data: TrendPoint[]
}

function getMomentum(data: TrendPoint[]): 'up' | 'down' | 'flat' {
  if (data.length < 3) return 'flat'
  const last3 = data.slice(-3).map((d) => d.avgScore)
  const allUp = last3[0] < last3[1] && last3[1] < last3[2]
  const allDown = last3[0] > last3[1] && last3[1] > last3[2]
  if (allUp) return 'up'
  if (allDown) return 'down'
  return 'flat'
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-gray-900 border border-white/[0.12] rounded-xl p-3 shadow-2xl min-w-[160px]">
      <p className="text-xs text-zinc-400 font-mono mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-zinc-400">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-white">{entry.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

export function PerformanceTrendChart({ data }: PerformanceTrendChartProps) {
  const momentum = getMomentum(data)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[var(--accent)] rounded" />
            Your Stories
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-zinc-600 rounded border-dashed" />
            Platform Benchmark
          </div>
        </div>

        {momentum !== 'flat' && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              momentum === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
            }`}
          >
            {momentum === 'up' ? (
              <>
                <TrendingUp className="w-3 h-3" />
                Momentum Up
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                Trending Down
              </>
            )}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="week"
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={6.5} stroke="#52525b" strokeDasharray="4 4" strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="avgScore"
            name="Your Stories"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: 'var(--accent-hover)' }}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="Platform Benchmark"
            stroke="#52525b"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
