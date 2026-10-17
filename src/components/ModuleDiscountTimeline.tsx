import React, { useState, useEffect } from 'react';
import { LccaProject, AnnualCashFlow, LccaSummary } from '../types/lcca';
import { formatCurrency, formatPercent } from '../utils/lccaMath';
import { Play, Pause, RotateCcw, Sliders, Table, BarChart3, ArrowUpRight } from 'lucide-react';

interface ModuleDiscountTimelineProps {
  project: LccaProject;
  cashFlows: AnnualCashFlow[];
  summary: LccaSummary;
}

export const ModuleDiscountTimeline: React.FC<ModuleDiscountTimelineProps> = ({
  project,
  cashFlows,
  summary,
}) => {
  const [currentPlayYear, setCurrentPlayYear] = useState<number>(project.lifetime);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [tableFilter, setTableFilter] = useState<'all' | 'milestones'>('all');

  // Auto animation playback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentPlayYear(prev => {
          if (prev >= project.lifetime) {
            setIsPlaying(false);
            return project.lifetime;
          }
          return prev + 1;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [isPlaying, project.lifetime]);

  const activeFlows = cashFlows.slice(0, currentPlayYear + 1);
  const currentFlow = cashFlows[Math.min(currentPlayYear, cashFlows.length - 1)];

  // For SVG Chart dimensions
  const maxNominal = Math.max(...cashFlows.map(r => r.totalNominal), 1000);
  const maxCumulative = Math.max(...cashFlows.map(r => r.cumulativeLccPv), 1000);

  // Filtered rows for the table
  const displayedRows = tableFilter === 'all'
    ? cashFlows
    : cashFlows.filter(r => 
        r.year <= 5 || 
        r.year % 5 === 0 || 
        r.year === project.lifetime || 
        r.capex > 0 || 
        r.decom > 0
      );

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                动态折现推演
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                动态折现现金流与 NPV 计算 (DCF & NPV Engine)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              同屏演播全生命周期现金流量表、资金时间价值折现现值 (DCF) 与累计净现值 (LCC PV) 动态演变。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentPlayYear >= project.lifetime) setCurrentPlayYear(0);
                setIsPlaying(!isPlaying);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? '暂停演播' : '从头演播折现'}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentPlayYear(project.lifetime);
              }}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
              title="跳转至全寿命终点"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Timeline Scrubber */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">
              当前演播至：<span className="font-bold font-mono text-teal-800">第 {currentPlayYear} 年</span>（总寿命 {project.lifetime} 年）
            </span>
            <span className="text-slate-400 font-mono">
              第{currentPlayYear}年折现因子 DF = {currentFlow ? currentFlow.discountFactor.toFixed(4) : '1.0000'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={project.lifetime}
            value={currentPlayYear}
            onChange={e => {
              setIsPlaying(false);
              setCurrentPlayYear(parseInt(e.target.value, 10));
            }}
            className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Synchronized Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">当前演播累计名义总支出</div>
          <div className="text-lg font-bold font-mono text-slate-800 mt-1">
            {formatCurrency(activeFlows.reduce((acc, c) => acc + c.totalNominal, 0))}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">跨年度账面直接累加值</div>
        </div>

        <div className="bg-white rounded-xl border border-teal-200 p-4 shadow-xs bg-teal-50/20">
          <div className="text-xs text-teal-800 font-medium">当前演播折现现值 (LCC PV)</div>
          <div className="text-lg font-bold font-mono text-teal-900 mt-1">
            {formatCurrency(currentFlow ? currentFlow.cumulativeLccPv : 0)}
          </div>
          <div className="text-[11px] text-teal-700 mt-0.5">
            折现率 r = {formatPercent(project.discountRate)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">资金时间价值节约/折现差额</div>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
            {formatCurrency(
              activeFlows.reduce((acc, c) => acc + c.totalNominal, 0) -
              (currentFlow ? currentFlow.cumulativeLccPv : 0)
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">远期支出折现到当前之差</div>
        </div>

        <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-xs bg-indigo-50/20">
          <div className="text-xs text-indigo-800 font-medium">全寿命期年均等额成本 (EAC)</div>
          <div className="text-lg font-bold font-mono text-indigo-900 mt-1">
            {formatCurrency(summary.eac)}/年
          </div>
          <div className="text-[11px] text-indigo-700 mt-0.5">
            CRF({formatPercent(project.discountRate, 1)}, {project.lifetime}年) = {summary.crf.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Dual Axis Interactive Visual SVG Chart */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>动态现金流演播双轴图：年度名义支出 vs 折现现金流 (DCF) & 累计现值</span>
            </h3>
            <p className="text-xs text-slate-500">
              淡蓝柱：名义现金流；绿柱：折现后现值 (DCF)；紫色曲线：全周期累计折现现值走势
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-300"></span>
              <span className="text-slate-600">名义流</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-600"></span>
              <span className="text-slate-600">折现现值(DCF)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-indigo-600"></span>
              <span className="text-slate-600">累计LCC PV</span>
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="w-full h-64 bg-slate-50 rounded-lg p-2 border border-slate-100 overflow-hidden relative">
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Horizontal Grid lines */}
            <line x1="40" y1="30" x2="760" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="40" y1="80" x2="760" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="40" y1="130" x2="760" y2="130" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="40" y1="175" x2="760" y2="175" stroke="#cbd5e1" />

            {/* Left Axis label */}
            <text x="35" y="34" fontSize="9" fill="#94a3b8" textAnchor="end">高</text>
            <text x="35" y="100" fontSize="9" fill="#94a3b8" textAnchor="end">中</text>
            <text x="35" y="175" fontSize="9" fill="#94a3b8" textAnchor="end">0</text>

            {/* Bars for each year up to currentPlayYear */}
            {cashFlows.slice(0, currentPlayYear + 1).map((flow, i) => {
              const totalYears = project.lifetime + 1;
              const barWidth = Math.max(3, (720 / totalYears) - 2);
              const x = 45 + (flow.year / project.lifetime) * 705;

              // Height scaled to maxNominal
              const hNominal = Math.min(140, Math.max(2, (flow.totalNominal / maxNominal) * 140));
              const hDcf = Math.min(140, Math.max(2, (flow.discountedCashFlow / maxNominal) * 140));

              return (
                <g 
                  key={flow.year}
                  onMouseEnter={() => setHoveredYear(flow.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className="cursor-pointer"
                >
                  {/* Nominal Bar */}
                  <rect
                    x={x - barWidth / 2}
                    y={175 - hNominal}
                    width={barWidth}
                    height={hNominal}
                    fill="#bae6fd"
                    opacity="0.85"
                  />
                  {/* DCF Bar */}
                  <rect
                    x={x - barWidth / 2}
                    y={175 - hDcf}
                    width={barWidth}
                    height={hDcf}
                    fill="#0d9488"
                    opacity="0.9"
                  />
                </g>
              );
            })}

            {/* Cumulative PV Line Path */}
            {(() => {
              if (activeFlows.length < 2) return null;
              const pts = activeFlows.map(flow => {
                const x = 45 + (flow.year / project.lifetime) * 705;
                const y = 175 - (flow.cumulativeLccPv / maxCumulative) * 140;
                return `${x},${y}`;
              });
              return (
                <path
                  d={`M ${pts.join(' L ')}`}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              );
            })()}

            {/* Current scrubber needle */}
            {(() => {
              const needleX = 45 + (currentPlayYear / project.lifetime) * 705;
              return (
                <g>
                  <line x1={needleX} y1="20" x2={needleX} y2="175" stroke="#0f766e" strokeWidth="1.5" strokeDasharray="2 2" />
                  <circle cx={needleX} cy="20" r="4" fill="#0f766e" />
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Hovered or Active year detail callout */}
        <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-wrap items-center justify-between text-xs font-mono">
          <div className="text-slate-600">
            标尺位置: <span className="font-bold text-slate-900">第 {hoveredYear !== null ? hoveredYear : currentPlayYear} 年</span>
          </div>
          {(() => {
            const yr = hoveredYear !== null ? hoveredYear : currentPlayYear;
            const targetFlow = cashFlows[Math.min(yr, cashFlows.length - 1)];
            if (!targetFlow) return null;
            return (
              <div className="flex items-center gap-4 text-slate-700">
                <span>名义净支出: <strong className="text-sky-700">{formatCurrency(targetFlow.totalNominal)}</strong></span>
                <span>折现现值(DCF): <strong className="text-teal-700">{formatCurrency(targetFlow.discountedCashFlow)}</strong></span>
                <span>折现因子: <strong className="text-slate-800">{targetFlow.discountFactor.toFixed(4)}</strong></span>
                <span>累计LCC: <strong className="text-indigo-700">{formatCurrency(targetFlow.cumulativeLccPv)}</strong></span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Cash Flow Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              全生命周期动态现金流量明细表 (Cash Flow Table)
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">展示模式:</span>
            <button
              onClick={() => setTableFilter('all')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                tableFilter === 'all'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部 {cashFlows.length} 年
            </button>
            <button
              onClick={() => setTableFilter('milestones')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                tableFilter === 'milestones'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              关键工程节点 / 每5年抽样
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/90 text-slate-600 uppercase text-[10px] font-semibold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">年份</th>
                <th className="py-2.5 px-3">前期规划</th>
                <th className="py-2.5 px-3">工程设计</th>
                <th className="py-2.5 px-3 text-amber-800">施工CAPEX</th>
                <th className="py-2.5 px-3 text-emerald-800">日常OPEX</th>
                <th className="py-2.5 px-3 text-indigo-800">维护MAINT</th>
                <th className="py-2.5 px-3 text-rose-800">退役DEC</th>
                <th className="py-2.5 px-3 text-teal-800">残值S</th>
                <th className="py-2.5 px-3 font-bold text-slate-900">净名义支出</th>
                <th className="py-2.5 px-3 font-mono">折现因子(DF)</th>
                <th className="py-2.5 px-3 font-bold text-teal-700">折现后现值(DCF)</th>
                <th className="py-2.5 px-3 font-bold text-indigo-800">累计LCC PV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {displayedRows.map(row => (
                <tr
                  key={row.year}
                  className={`hover:bg-teal-50/40 transition-colors ${
                    row.year === currentPlayYear ? 'bg-teal-50/80 font-bold' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-semibold text-slate-900">第{row.year}年</td>
                  <td className="py-2 px-3 text-slate-600">{row.planning > 0 ? row.planning.toFixed(1) : '-'}</td>
                  <td className="py-2 px-3 text-slate-600">{row.design > 0 ? row.design.toFixed(1) : '-'}</td>
                  <td className="py-2 px-3 text-amber-700 font-semibold">{row.capex > 0 ? row.capex.toFixed(1) : '-'}</td>
                  <td className="py-2 px-3 text-emerald-700">{row.opex > 0 ? row.opex.toFixed(1) : '-'}</td>
                  <td className="py-2 px-3 text-indigo-700">{row.maint > 0 ? row.maint.toFixed(1) : '-'}</td>
                  <td className="py-2 px-3 text-rose-700">{row.decom > 0 ? row.decom.toFixed(1) : '-'}</td>
                  <td className="py-2 px-3 text-teal-700">{row.salvage > 0 ? `-${row.salvage.toFixed(1)}` : '-'}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{row.totalNominal.toFixed(1)}</td>
                  <td className="py-2 px-3 text-slate-500">{row.discountFactor.toFixed(4)}</td>
                  <td className="py-2 px-3 font-bold text-teal-700">{row.discountedCashFlow.toFixed(1)}</td>
                  <td className="py-2 px-3 font-bold text-indigo-800">{row.cumulativeLccPv.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
