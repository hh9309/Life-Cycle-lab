import React, { useState } from 'react';
import { LccaProject, LccaSummary, TornadoVariable } from '../types/lcca';
import { formatCurrency, formatPercent, generateDiscountSensitivityCurve } from '../utils/lccaMath';
import { Sparkles, TrendingUp, AlertTriangle, HelpCircle, ArrowRightLeft } from 'lucide-react';

interface ModuleSensitivityProps {
  project: LccaProject;
  summary: LccaSummary;
  tornadoVariables: TornadoVariable[];
}

export const ModuleSensitivity: React.FC<ModuleSensitivityProps> = ({
  project,
  summary,
  tornadoVariables,
}) => {
  const [selectedVar, setSelectedVar] = useState<TornadoVariable | null>(tornadoVariables[0] || null);

  const baseLcc = summary.lccPv;
  const maxSwing = Math.max(...tornadoVariables.map(v => v.swing), 1);
  const sensitivityCurve = generateDiscountSensitivityCurve(project);

  return (
    <div className="space-y-6">
      {/* Module Title Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                敏感性分析
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                变量敏感性分析与龙卷风图 (Tornado Sensitivity)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              演播折现率、使用寿命、能源价格及运维大修波动对全生命周期总成本的边际影响，识别工程决策的主导敏感因子。
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">基准 LCC PV:</span>
            <span className="font-bold font-mono text-teal-800 text-sm">
              {formatCurrency(baseLcc)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tornado Chart Canvas */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>全生命周期敏感性龙卷风图 (Tornado Chart)</span>
            </h3>
            <p className="text-xs text-slate-500">
              按对 LCC 现值影响极差 (Swing) 降序排列。中间竖虚线为基准设定，左右延展条带代表参数在指定区间波动时的上下限偏离。
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
              <span className="text-slate-600">成本降低 (有利)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
              <span className="text-slate-600">成本上升 (不利)</span>
            </span>
          </div>
        </div>

        {/* SVG Tornado Chart */}
        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-x-auto">
          <svg className="w-full min-w-[620px]" height={tornadoVariables.length * 52 + 50} viewBox={`0 0 700 ${tornadoVariables.length * 52 + 50}`}>
            {/* Center baseline x = 380 */}
            <line x1="380" y1="20" x2="380" y2={tornadoVariables.length * 52 + 20} stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="380" y="14" fontSize="10" fill="#475569" textAnchor="middle" fontWeight="bold">
              基准现值: {formatCurrency(baseLcc)}
            </text>

            {tornadoVariables.map((v, idx) => {
              const y = 35 + idx * 52;
              const isSelected = selectedVar?.id === v.id;

              // Calculate left and right offset from baseline (380)
              // max width to either side is 240px
              const minVal = Math.min(v.lowLcc, v.highLcc);
              const maxVal = Math.max(v.lowLcc, v.highLcc);

              const leftDelta = baseLcc - minVal;
              const rightDelta = maxVal - baseLcc;

              const leftBarWidth = Math.max(4, (leftDelta / maxSwing) * 230);
              const rightBarWidth = Math.max(4, (rightDelta / maxSwing) * 230);

              return (
                <g
                  key={v.id}
                  onClick={() => setSelectedVar(v)}
                  className="cursor-pointer transition-opacity"
                  opacity={isSelected ? 1 : 0.85}
                >
                  {/* Variable name label */}
                  <text
                    x="160"
                    y={y + 16}
                    fontSize="11"
                    fill={isSelected ? '#0f766e' : '#1e293b'}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="end"
                  >
                    {idx + 1}. {v.name}
                  </text>

                  {/* Range subtitle */}
                  <text x="160" y={y + 28} fontSize="9" fill="#94a3b8" textAnchor="end">
                    [{v.lowVal.toFixed(1)} ~ {v.highVal.toFixed(1)} {v.unit}]
                  </text>

                  {/* Left Bar (Favorable Cost Reduction) */}
                  <rect
                    x={380 - leftBarWidth}
                    y={y + 6}
                    width={leftBarWidth}
                    height="20"
                    rx="3"
                    fill="#10b981"
                  />
                  <text x={380 - leftBarWidth - 6} y={y + 20} fontSize="9" fill="#047857" textAnchor="end" fontFamily="monospace">
                    -{formatCurrency(leftDelta)}
                  </text>

                  {/* Right Bar (Adverse Cost Escalation) */}
                  <rect
                    x={380}
                    y={y + 6}
                    width={rightBarWidth}
                    height="20"
                    rx="3"
                    fill="#f43f5e"
                  />
                  <text x={380 + rightBarWidth + 6} y={y + 20} fontSize="9" fill="#be123c" textAnchor="start" fontFamily="monospace">
                    +{formatCurrency(rightDelta)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Variable Audit Detail & Continuous Discount Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Variable Deep Dive Card */}
        {selectedVar && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                <h4 className="text-sm font-bold text-slate-900">{selectedVar.name} 弹性审计</h4>
              </div>
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                极差: {formatCurrency(selectedVar.swing)}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">低位参数</div>
                  <div className="font-semibold text-slate-800">{selectedVar.lowVal.toFixed(1)} {selectedVar.unit}</div>
                  <div className="text-emerald-700 font-bold">{formatCurrency(Math.min(selectedVar.lowLcc, selectedVar.highLcc))}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">当前基准</div>
                  <div className="font-semibold text-slate-800">{selectedVar.baseVal.toFixed(1)} {selectedVar.unit}</div>
                  <div className="text-slate-900 font-bold">{formatCurrency(baseLcc)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">高位参数</div>
                  <div className="font-semibold text-slate-800">{selectedVar.highVal.toFixed(1)} {selectedVar.unit}</div>
                  <div className="text-rose-700 font-bold">{formatCurrency(Math.max(selectedVar.lowLcc, selectedVar.highLcc))}</div>
                </div>
              </div>

              <div className="p-3 bg-teal-50/50 border border-teal-200/60 rounded-lg flex items-start gap-2 text-teal-900">
                <TrendingUp className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">弹性系数与工程决策意义：</div>
                  <p className="text-[11px] text-teal-800/90 mt-0.5">
                    该变量对项目总现值的影响权重在所有测试因子中排名第 {tornadoVariables.findIndex(v => v.id === selectedVar.id) + 1} 位。
                    {selectedVar.id === 'discountRate' 
                      ? '折现率是影响远期现金流折现倍数的金融核心变量，建议在项目立项评审时严格进行加权平均资本成本 (WACC) 审定。'
                      : selectedVar.id === 'opex'
                      ? '运营耗能费具有每年持续滚动的乘数效应，技术方案评选时应优先通过节能设计压降年均 OPEX。'
                      : selectedVar.id === 'maint'
                      ? '维护费用受部件失效规律影响显著，应建立预防性维护与状态监测 (PHM) 体系以平滑大修冲击。'
                      : '建设期投资一次性发生，建议引入限额设计与 EPC 总承包模式锁定初始工程造价。'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Continuous Discount Rate Sensitivity Curve */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">连续折现率扫描曲线 (0% ~ 14%)</h4>
              <p className="text-[11px] text-slate-400">展示当金融宏观利率环境变动时，全周期 LCC PV 与 EAC 的走势</p>
            </div>
          </div>

          <div className="mt-3 w-full h-44 bg-slate-50 rounded-lg p-2 border border-slate-100">
            <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
              {/* Grid */}
              <line x1="30" y1="20" x2="380" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1="30" y1="60" x2="380" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1="30" y1="100" x2="380" y2="100" stroke="#cbd5e1" />

              {/* Curve for LCC PV */}
              {(() => {
                const maxLcc = Math.max(...sensitivityCurve.map(p => p.lccPv));
                const minLcc = Math.min(...sensitivityCurve.map(p => p.lccPv));
                const range = maxLcc - minLcc || 1;

                const pts = sensitivityCurve.map((p, idx) => {
                  const x = 30 + (idx / (sensitivityCurve.length - 1)) * 350;
                  const y = 100 - ((p.lccPv - minLcc) / range) * 80;
                  return `${x},${y}`;
                });

                return (
                  <>
                    <path d={`M ${pts.join(' L ')}`} fill="none" stroke="#0d9488" strokeWidth="2.5" />
                    {sensitivityCurve.map((p, idx) => {
                      const x = 30 + (idx / (sensitivityCurve.length - 1)) * 350;
                      const y = 100 - ((p.lccPv - minLcc) / range) * 80;
                      if (idx === 0 || idx === 4 || idx === sensitivityCurve.length - 1) {
                        return (
                          <g key={idx}>
                            <circle cx={x} cy={y} r="3" fill="#0d9488" />
                            <text x={x} y={115} fontSize="8" fill="#64748b" textAnchor="middle">
                              {(p.rate * 100).toFixed(0)}%
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex justify-between font-mono">
            <span>折现率由 1% 升至 14% 时</span>
            <span className="text-teal-700 font-semibold">远期支出折现现值加速收敛衰减</span>
          </div>
        </div>
      </div>
    </div>
  );
};
