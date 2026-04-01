'use client'

import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts'

const CO_LABELS: Record<string, string> = {
  CO1: 'Model Ch.', CO2: 'Reading', CO3: 'Video', CO4: 'Assessment',
  CO5: 'Game', CO6: 'Glossary', CO7: 'Teacher Guide',
}

const DIM_LABELS: Record<string, string> = {
  standardsCompliance: 'Standards',
  gradeAppropriateness: 'Grade Fit',
  templateAdherence: 'Template',
  engagementQuality: 'Engagement',
  pakistanContextAccuracy: 'PK Context',
}

interface Props {
  averages: Record<string, Record<string, number>>
  topFlagged: { criterion: string; count: number }[]
  totalFeedback: number
}

export default function AnalyticsDashboard({ averages, topFlagged, totalFeedback }: Props) {
  // Prepare radar data for all COs on one chart (averages across all dims)
  const barData = Object.entries(averages).map(([co, dims]) => {
    const overall = Object.values(dims).reduce((a, b) => a + b, 0) / Object.values(dims).length
    return { co: CO_LABELS[co] ?? co, overall: Math.round(overall * 10) / 10, ...dims }
  })

  const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-3xl font-bold text-gray-900">{totalFeedback}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-500">Content Types Covered</p>
          <p className="text-3xl font-bold text-gray-900">
            {Object.values(averages).filter((d) => Object.values(d).some((v) => v > 0)).length}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-500">Flagged Criteria Found</p>
          <p className="text-3xl font-bold text-red-500">{topFlagged.length}</p>
        </div>
      </div>

      {/* Overall scores per CO */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Average Score by Content Object</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis dataKey="co" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toFixed(1)} />
            <Bar dataKey="overall" radius={[4, 4, 0, 0]}>
              {barData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top flagged compliance criteria */}
      {topFlagged.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Flagged Standards Criteria</h3>
          <div className="space-y-2">
            {topFlagged.map((item) => (
              <div key={item.criterion} className="flex items-center gap-3">
                <div className="flex-1 text-sm text-gray-700 truncate">{item.criterion}</div>
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-red-400 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (item.count / topFlagged[0].count) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimension breakdown table */}
      <div className="card p-5 overflow-x-auto">
        <h3 className="font-semibold text-gray-900 mb-4">Dimension Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 text-left">
              <th className="pb-2 pr-4">Content Object</th>
              {Object.values(DIM_LABELS).map((d) => (
                <th key={d} className="pb-2 pr-3">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Object.entries(averages).map(([co, dims]) => (
              <tr key={co}>
                <td className="py-2 pr-4 font-medium text-gray-800">{CO_LABELS[co]}</td>
                {Object.entries(DIM_LABELS).map(([key]) => {
                  const val = dims[key] ?? 0
                  return (
                    <td key={key} className={`py-2 pr-3 font-semibold ${
                      val === 0 ? 'text-gray-300' : val < 3.5 ? 'text-red-500' : val >= 4 ? 'text-green-600' : 'text-yellow-500'
                    }`}>
                      {val === 0 ? '—' : val.toFixed(1)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
