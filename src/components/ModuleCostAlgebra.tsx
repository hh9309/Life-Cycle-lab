import React, { useState } from 'react';
import { LccaProject, LccaSummary } from '../types/lcca';
import { formatCurrency, formatPercent, calculateCrf } from '../utils/lccaMath';
import { Calculator, ArrowRight, Info, CheckCircle2, Sigma, TrendingDown } from 'lucide-react';

interface ModuleCostAlgebraProps {
  project: LccaProject;
  summary: LccaSummary;
  onUpdateDiscountRate: (rate: number) => void;
  onUpdateInflationRate: (rate: number) => void;
}

export const ModuleCostAlgebra: React.FC<ModuleCostAlgebraProps> = ({
  project,
  summary,
  onUpdateDiscountRate,
  onUpdateInflationRate,
}) => {
  const [activeTerm, setActiveTerm] = useState<'capex' | 'opex' | 'maint' | 'decom' | 'salvage' | 'eac'>('capex');

  // Term descriptions and live values
  const termDetails = {
    capex: {
      title: 'CAPEX (资本性建设支出)',
      formula: 'CAPEX = C_{planning} + C_{design} + C_{construction}',
      value: summary.pvCapexTotal,
      desc: '初始建造与购置阶段的一次性资本支出。包含前期勘察可行性研究、工程正向深化设计、设备成套采购、土建施工及联调联试总投资。在工程经济学中通常发生在 t = 0 至建设期终点。',
      insight: '工程设计前移原则：设计阶段虽仅占总投资 3%~5%，却锁定了后续 70%~80% 的全寿命运维成本。',
    },
    opex: {
      title: 'OPEX (日常运营性支出现值)',
      formula: '\\sum_{t=1}^T \\frac{OPEX_t}{(1+r)^t}',
      value: summary.pvOpexTotal,
      desc: '系统进入投运服役期后，为维持其正常运营功能所必须支付的持续性消耗。主要包括能源动力费（电力、燃气、燃料）、消耗品采购、生产操作人工薪酬、以及场地与网络租金。',
      insight: '能源价格具有时间累积杠杆；若未考虑物价上涨或电费阶梯波动，长期现值将被严重低估。',
    },
    maint: {
      title: 'MAINT (定期维护与中大修现值)',
      formula: '\\sum_{t=1}^T \\frac{MAINT_t}{(1+r)^t}',
      value: summary.pvMaintTotal,
      desc: '周期性预防性保养、状态检修、部件定期翻新更换及寿命中期全系统大修 (Overhaul)。高可靠性系统维护费用常呈离散脉冲或浴盆曲线 (Bathtub Curve) 晚期加速上升。',
      insight: '忽视维护费用的递增率（如年增 2%~4%），常导致项目在中后期陷入“维护费用吞噬利润”的停机困境。',
    },
    decom: {
      title: 'DEC (退役报废与环境治理处置现值)',
      formula: '\\frac{DEC}{(1+r)^T}',
      value: summary.pvDecomTotal,
      desc: '系统寿命到期终止服役后的拆解、危废无害化处置、土地与生态环境修复合规支出。在核电、化工、海上风电及数据中心领域尤为高昂。',
      insight: '由于处于遥远的第 T 年，受复利折现 (1+r)^T 强烈衰减，在财务报表上现值常被压缩得很小，但存在极高代际转嫁风险。',
    },
    salvage: {
      title: 'S (期末残值回收抵扣现值)',
      formula: '-\\frac{S}{(1+r)^T}',
      value: summary.pvSalvageTotal,
      desc: '服役期终点，系统设备、金属构件、建筑物材料或废弃物通过二手转售、材料再生冶炼回收所获取的净现金流入。在 LCC 中作为负成本项进行扣除。',
      insight: '设备残值通常在 3%~10% 区间，若技术迭代剧烈（如芯片或算力板卡），残值率需保守评估。',
    },
    eac: {
      title: 'EAC (年均等额成本 / Equivalent Annual Cost)',
      formula: 'EAC = LCC_{PV} \\times CRF(r, T) = LCC_{PV} \\times \\frac{r(1+r)^T}{(1+r)^T - 1}',
      value: summary.eac,
      desc: '将全寿命周期的总折现现值 (LCC PV)，通过资本回收系数 (CRF) 转换为在寿命期 T 内每年恒定等额支付的年金成本。是跨越不同寿命期方案（如比较 15 年设备与 25 年设备）公平评判的黄金基准！',
      insight: '当两个技术方案寿命周期不相等时，不可直接对比 LCC PV 总现值，必须使用 EAC 进行等效年化裁决！',
    },
  };

  // Generate discount decay curve data for SVG
  const sampleSteps = Math.min(30, project.lifetime);
  const stepYears = Array.from({ length: sampleSteps + 1 }, (_, i) => Math.round((i * project.lifetime) / sampleSteps));
  const decayPoints = stepYears.map(yr => {
    const factor = Math.pow(1 + project.discountRate, -yr);
    return { year: yr, factor };
  });

  return (
    <div className="space-y-6">
      {/* Module Title Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800">
                成本代数与时间价值
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                成本代数与资金时间价值建模 (Cost Algebra & TVM)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              形式化构建全生命周期成本代数模型，推导演播资金时间价值复利折现与年均等额成本 (EAC) 的数学机理。
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="text-slate-500">资本回收系数 (CRF)</div>
              <div className="text-base font-bold font-mono text-slate-800">
                {summary.crf.toFixed(6)}
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5">
              <div className="text-teal-700 font-medium">年均等额成本 (EAC)</div>
              <div className="text-base font-bold font-mono text-teal-900">
                {formatCurrency(summary.eac)}/年
              </div>
            </div>
          </div>
        </div>

        {/* Master Mathematical Algebraic Equation Bar */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white shadow-inner">
          <div className="text-xs text-teal-300 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sigma className="w-3.5 h-3.5" />
            <span>全生命周期成本代数主方程 (形式化定义)</span>
          </div>
          
          <div className="text-center py-3 overflow-x-auto">
            <div className="inline-flex items-center font-mono text-sm sm:text-base md:text-lg tracking-wide space-x-1 sm:space-x-2">
              <span className="font-bold text-teal-300">LCC</span>
              <span className="text-slate-400">=</span>
              
              <button
                onClick={() => setActiveTerm('capex')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  activeTerm === 'capex'
                    ? 'bg-teal-500/30 text-teal-200 ring-2 ring-teal-400'
                    : 'text-amber-300 hover:bg-slate-700/60'
                }`}
                title="点击查看 CAPEX 详细推导"
              >
                CAPEX
              </button>

              <span className="text-slate-400">+</span>

              <button
                onClick={() => setActiveTerm('opex')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  activeTerm === 'opex'
                    ? 'bg-teal-500/30 text-teal-200 ring-2 ring-teal-400'
                    : 'text-sky-300 hover:bg-slate-700/60'
                }`}
                title="点击查看 OPEX 折现项"
              >
                ∑ <span className="text-xs opacity-80">(t=1..T)</span> [OPEX<sub>t</sub> / (1+r)<sup>t</sup>]
              </button>

              <span className="text-slate-400">+</span>

              <button
                onClick={() => setActiveTerm('maint')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  activeTerm === 'maint'
                    ? 'bg-teal-500/30 text-teal-200 ring-2 ring-teal-400'
                    : 'text-indigo-300 hover:bg-slate-700/60'
                }`}
                title="点击查看 MAINT 大修折现项"
              >
                ∑ <span className="text-xs opacity-80">(t=1..T)</span> [MAINT<sub>t</sub> / (1+r)<sup>t</sup>]
              </button>

              <span className="text-slate-400">+</span>

              <button
                onClick={() => setActiveTerm('decom')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  activeTerm === 'decom'
                    ? 'bg-teal-500/30 text-teal-200 ring-2 ring-teal-400'
                    : 'text-rose-300 hover:bg-slate-700/60'
                }`}
                title="点击查看 DEC 退役折现项"
              >
                DEC / (1+r)<sup>T</sup>
              </button>

              <span className="text-slate-400">-</span>

              <button
                onClick={() => setActiveTerm('salvage')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  activeTerm === 'salvage'
                    ? 'bg-teal-500/30 text-teal-200 ring-2 ring-teal-400'
                    : 'text-emerald-300 hover:bg-slate-700/60'
                }`}
                title="点击查看期末残值回收项"
              >
                S / (1+r)<sup>T</sup>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 mt-1">
            提示：点击上方任意代数项，下方将实时切换对应项的数学推导、实际数值与经济学机理。
          </div>
        </div>
      </div>

      {/* Selected Term Deep-Dive Inspection Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                代数要素微积分与经济学含义
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-0.5">
                {termDetails[activeTerm].title}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">当前项目现值贡献</span>
              <div className="text-lg font-bold font-mono text-teal-700">
                {activeTerm === 'eac' 
                  ? `${formatCurrency(termDetails[activeTerm].value)}/年` 
                  : formatCurrency(termDetails[activeTerm].value)}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg font-mono text-sm text-slate-700 flex items-center gap-2">
              <span className="text-slate-400">公式形式:</span>
              <span className="font-semibold text-slate-900">{termDetails[activeTerm].formula}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {termDetails[activeTerm].desc}
            </p>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start gap-2 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">核心经济学机理：</span>
                {termDetails[activeTerm].insight}
              </div>
            </div>
          </div>

          {/* Quick tab switchers */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            {(['capex', 'opex', 'maint', 'decom', 'salvage', 'eac'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTerm(t)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                  activeTerm === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Capital Recovery Factor (CRF) & Fisher Equation Box */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <span>折现参数与费雪方程对齐</span>
          </h4>

          {/* Interactive Discount Rate & Inflation Inputs */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>名义折现率 (r_nom)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatPercent(project.discountRate)}
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.15"
                step="0.005"
                value={project.discountRate}
                onChange={e => onUpdateDiscountRate(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>预期通胀率 (i)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatPercent(project.inflationRate)}
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.08"
                step="0.005"
                value={project.inflationRate}
                onChange={e => onUpdateInflationRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Fisher Real Discount Rate Result */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-200/70 rounded-lg text-xs space-y-1">
            <div className="text-indigo-900 font-semibold flex items-center justify-between">
              <span>实际折现率 (Fisher Effect):</span>
              <span className="font-mono text-sm text-indigo-700">
                {formatPercent(summary.realDiscountRate)}
              </span>
            </div>
            <p className="text-[11px] text-indigo-700/80">
              公式: (1 + r<sub>real</sub>) = (1 + r<sub>nom</sub>) / (1 + i)
            </p>
          </div>

          {/* CRF Derivation breakdown */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 font-mono">
            <div className="text-slate-500 text-[11px]">资本回收系数 CRF(r, T):</div>
            <div className="text-slate-800 font-semibold">
              CRF({formatPercent(project.discountRate, 1)}, {project.lifetime}年) = {summary.crf.toFixed(6)}
            </div>
            <div className="text-slate-500 text-[10px]">
              EAC = {formatCurrency(summary.lccPv)} × {summary.crf.toFixed(6)} = {formatCurrency(summary.eac)}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Time Value of Money: Discount Factor Decay Curve */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-teal-600" />
              <span>资金时间价值衰减曲线：折现因子 DF(t) = (1 + r)⁻ᵗ 演播</span>
            </h3>
            <p className="text-xs text-slate-500">
              随着时间跨度延伸，未来现金流在当前的实际权重指数级下降。直观解释为何远期退役成本容易被“数学稀释”。
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            t=0 时 DF=1.000 → t={project.lifetime} 时 DF={(Math.pow(1 + project.discountRate, -project.lifetime)).toFixed(4)}
          </div>
        </div>

        {/* SVG Curve Canvas */}
        <div className="w-full h-44 relative bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
            {/* Grid horizontal lines */}
            <line x1="40" y1="20" x2="580" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="40" y1="60" x2="580" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="40" y1="100" x2="580" y2="100" stroke="#cbd5e1" />

            {/* Labels */}
            <text x="35" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">1.0</text>
            <text x="35" y="64" fontSize="10" fill="#94a3b8" textAnchor="end">0.5</text>
            <text x="35" y="104" fontSize="10" fill="#94a3b8" textAnchor="end">0.0</text>

            {/* X-axis labels */}
            <text x="50" y="115" fontSize="10" fill="#64748b">第0年</text>
            <text x="310" y="115" fontSize="10" fill="#64748b">第{Math.round(project.lifetime / 2)}年</text>
            <text x="560" y="115" fontSize="10" fill="#64748b">第{project.lifetime}年</text>

            {/* Curve path */}
            {(() => {
              const points = decayPoints.map(p => {
                const x = 50 + (p.year / project.lifetime) * (560 - 50);
                const y = 100 - p.factor * 80;
                return `${x},${y}`;
              });
              const d = `M ${points.join(' L ')}`;
              const areaD = `M 50,100 L ${points.join(' L ')} L 560,100 Z`;

              return (
                <>
                  <path d={areaD} fill="url(#tealGradient)" opacity="0.15" />
                  <path d={d} fill="none" stroke="#0d9488" strokeWidth="2.5" />
                  {decayPoints.map((p, idx) => {
                    const x = 50 + (p.year / project.lifetime) * (560 - 50);
                    const y = 100 - p.factor * 80;
                    if (idx === 0 || idx === Math.floor(decayPoints.length / 2) || idx === decayPoints.length - 1) {
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={y} r="4" fill="#0d9488" />
                          <text x={x} y={y - 8} fontSize="9" fill="#0f766e" textAnchor="middle" fontWeight="bold">
                            DF={p.factor.toFixed(3)}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}
                </>
              );
            })()}

            <defs>
              <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#f8fafc" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};
