import React, { useState, useEffect, useMemo } from 'react';
import { LccaProject, LccaSummary, TornadoVariable, AnnualCashFlow } from '../types/lcca';
import { formatCurrency, formatPercent, calculateCrf } from '../utils/lccaMath';
import { 
  Workflow, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Sparkles, 
  FileText, 
  Calculator,
  ChevronRight,
  TrendingDown,
  Gauge,
  RotateCcw,
  Check,
  Zap,
  Info
} from 'lucide-react';

interface ModuleWorkflowProps {
  project: LccaProject;
  summary: LccaSummary;
  tornadoVars: TornadoVariable[];
  cashFlows: AnnualCashFlow[];
  onNavigateToTab: (tabId: string) => void;
  onUpdateDiscountRate: (rate: number) => void;
  onUpdateInflationRate: (rate: number) => void;
  onUpdateLifetime: (years: number) => void;
}

export const ModuleWorkflow: React.FC<ModuleWorkflowProps> = ({
  project,
  summary,
  tornadoVars,
  cashFlows,
  onNavigateToTab,
  onUpdateDiscountRate,
  onUpdateInflationRate,
  onUpdateLifetime,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(3); // Default to Step 3 so the user directly lands on the interactive simulator or can browse 1-5
  const [simDiscountRate, setSimDiscountRate] = useState<number>(project.discountRate);
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  // Sync simulation rate when active project changes
  useEffect(() => {
    setSimDiscountRate(project.discountRate);
  }, [project.id, project.discountRate]);

  // Instant O(T) non-linear calculation without re-running entire project initialization
  const simResults = useMemo(() => {
    let simLccPv = 0;
    for (const row of cashFlows) {
      simLccPv += row.totalNominal * Math.pow(1 + simDiscountRate, -row.year);
    }
    const simCrf = calculateCrf(simDiscountRate, project.lifetime);
    const simEac = simLccPv * simCrf;

    const deltaLccPv = simLccPv - summary.lccPv;
    const deltaLccPvPercent = summary.lccPv > 0 ? (deltaLccPv / summary.lccPv) * 100 : 0;

    const deltaEac = simEac - summary.eac;
    const deltaEacPercent = summary.eac > 0 ? (deltaEac / summary.eac) * 100 : 0;

    // Generate 25 curve points across 1% to 15% for the mini SVG
    const curvePoints = [];
    for (let r = 0.01; r <= 0.151; r += 0.007) {
      let pv = 0;
      for (const row of cashFlows) {
        pv += row.totalNominal * Math.pow(1 + r, -row.year);
      }
      const crf = calculateCrf(r, project.lifetime);
      const eac = pv * crf;
      curvePoints.push({ rate: r, lccPv: pv, eac });
    }

    return {
      simLccPv,
      simCrf,
      simEac,
      deltaLccPv,
      deltaLccPvPercent,
      deltaEac,
      deltaEacPercent,
      curvePoints,
    };
  }, [cashFlows, simDiscountRate, project.lifetime, summary.lccPv, summary.eac]);

  const handleApplyToProject = () => {
    onUpdateDiscountRate(simDiscountRate);
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 2200);
  };

  const steps = [
    { num: 1, title: '结构分解 (CBS)', desc: '阶段成本与隐性要素拆解', tabTarget: 'stages' },
    { num: 2, title: '参数设定 (Param)', desc: '折现率、通胀率与寿命配置', tabTarget: 'algebra' },
    { num: 3, title: '折现推演 (DCF)', desc: '即时折现敏感度与NPV/EAC', tabTarget: 'discount' },
    { num: 4, title: '敏感评估 (Sensitivity)', desc: '龙卷风图与风险变量扫描', tabTarget: 'sensitivity' },
    { num: 5, title: '决策审计 (Audit)', desc: '白皮书生成与评估报告导出', tabTarget: 'export' },
  ];

  return (
    <div className="space-y-6">
      {/* Workflow Navigation Stepper Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800">
                全流程导引
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                LCCA 全生命周期成本分析五步全流程导引
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              遵循国际工程经济学标准流程：结构分解 → 参数设定 → 折现推演与即时敏感观测 → 敏感评估 → 决策白皮书。
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500">
            步骤 <span className="font-bold text-teal-700 text-sm">{currentStep}</span> / 5
          </div>
        </div>

        {/* Horizontal Stepper Progress Track */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {steps.map(s => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-1 ring-teal-500/20'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-600'
                    : 'border-slate-200/60 bg-white hover:bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent ? 'bg-teal-700 text-white' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted ? '✓' : s.num}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className={`text-xs font-bold ${isCurrent ? 'text-teal-900' : 'text-slate-800'}`}>
                  {s.title}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {s.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Interactive Panes */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  步骤一：成本要素与工作分解结构 (CBS 拆解)
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('stages')}
                className="text-xs text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>跳转至阶段建模微调</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              将系统在 100% 寿命周期内的所有耗费，严谨归集至 6 大阶段。重点警惕“水下冰山”：日常 OPEX 能耗与定期 MAINT 大修费用。
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400">1. 规划立项</div>
                <div className="font-bold text-slate-800">{formatCurrency(project.stages.planning.directCost + project.stages.planning.indirectCost)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400">2. 工程设计</div>
                <div className="font-bold text-slate-800">{formatCurrency(project.stages.design.directCost + project.stages.design.indirectCost)}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/60">
                <div className="text-amber-800 font-semibold">3. 施工建设 CAPEX</div>
                <div className="font-bold text-amber-900">{formatCurrency(project.stages.capex.directCost + project.stages.capex.indirectCost)}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200/60">
                <div className="text-emerald-800 font-semibold">4. 日常运营 OPEX/年</div>
                <div className="font-bold text-emerald-900">{formatCurrency(project.stages.opex.directCost + project.stages.opex.indirectCost)}/年</div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200/60">
                <div className="text-indigo-800 font-semibold">5. 维护大修 MAINT/年</div>
                <div className="font-bold text-indigo-900">{formatCurrency(project.stages.maint.directCost + project.stages.maint.indirectCost)}/年</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200/60">
                <div className="text-rose-800 font-semibold">6. 退役处置 DEC</div>
                <div className="font-bold text-rose-900">{formatCurrency(project.stages.decom.directCost + project.stages.decom.indirectCost)}</div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  步骤二：折现率、通货膨胀率与寿命期配置
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('algebra')}
                className="text-xs text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>跳转至公式推导器</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              确定资金时间价值折现率。对长寿命重大基建，需审查名义折现率与实际折现率口径一致性，防止高折现率掩盖远期环境生态治理责任。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between font-medium">
                  <span>基准名义折现率 (r)</span>
                  <span className="font-mono font-bold text-slate-900">{formatPercent(project.discountRate)}</span>
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

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between font-medium">
                  <span>预期通胀率 (i)</span>
                  <span className="font-mono font-bold text-slate-900">{formatPercent(project.inflationRate)}</span>
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

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between font-medium">
                  <span>评估生命周期 (T)</span>
                  <span className="font-mono font-bold text-slate-900">{project.lifetime} 年</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={project.lifetime}
                  onChange={e => onUpdateLifetime(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Step Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    步骤三：动态折现现金流与 NPV / EAC 求解
                  </h3>
                  <p className="text-xs text-slate-500">
                    实时调节折现率滑块，即时观测折现现值 (NPV) 与年均等额成本 (EAC) 的非线性凸性衰减，无需重算整个项目！
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab('discount')}
                className="text-xs text-teal-700 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>跳转至折现演播图表</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Baseline Project Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-500 text-[11px]">基准项目现值 (LCC PV)</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(summary.lccPv)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">r₀ = {formatPercent(project.discountRate)}</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-500 text-[11px]">基准年均等额成本 (EAC)</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(summary.eac)}/年</div>
                <div className="text-[10px] text-slate-400 mt-0.5">跨周期横向对齐基准</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-500 text-[11px]">基准资本回收系数 (CRF)</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{summary.crf.toFixed(6)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">基于 {project.lifetime} 年寿命周期</div>
              </div>
            </div>

            {/* Interactive Real-Time Discount Rate Sensitivity & Convexity Scrubber Card */}
            <div className="bg-gradient-to-br from-teal-50/70 via-slate-50 to-indigo-50/50 border border-teal-200/80 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>折现率 (r) 动态即时敏感度滑块</span>
                      <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold">
                        毫秒级非线性响应
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      拖动滑块或选择利率预设，即刻观测数学折现非线性冲击，不重置项目其他工程量配置。
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimDiscountRate(project.discountRate)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
                    title="恢复为项目基准折现率"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>重置基准 ({formatPercent(project.discountRate)})</span>
                  </button>

                  <button
                    onClick={handleApplyToProject}
                    disabled={Math.abs(simDiscountRate - project.discountRate) < 0.0001}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-medium shadow-xs cursor-pointer"
                  >
                    {appliedNotification ? <Check className="w-3 h-3 text-emerald-300" /> : <Zap className="w-3 h-3 text-amber-300" />}
                    <span>{appliedNotification ? '已同步至全局' : '应用至全局项目'}</span>
                  </button>
                </div>
              </div>

              {/* Slider Control */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <span>测试折现率 r:</span>
                    <strong className="text-base font-mono text-teal-800 font-bold">
                      {(simDiscountRate * 100).toFixed(2)}%
                    </strong>
                    {simDiscountRate === project.discountRate && (
                      <span className="text-[10px] text-slate-400">(当前基准)</span>
                    )}
                  </span>
                  
                  <span className="text-xs font-mono text-slate-500">
                    偏离基准: <strong className={simDiscountRate > project.discountRate ? 'text-amber-700' : simDiscountRate < project.discountRate ? 'text-emerald-700' : 'text-slate-600'}>
                      {simDiscountRate >= project.discountRate ? '+' : ''}{((simDiscountRate - project.discountRate) * 100).toFixed(2)}%
                    </strong>
                  </span>
                </div>

                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.0025"
                  value={simDiscountRate}
                  onChange={e => setSimDiscountRate(parseFloat(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1.0% (低利率环境)</span>
                  <span>4.0%</span>
                  <span>7.0% (企业基准)</span>
                  <span>10.0%</span>
                  <span>15.0% (高贴现率)</span>
                </div>

                {/* Quick Presets Strip */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 text-[10px] font-medium mr-1">快捷场景:</span>
                  {[
                    { label: '超低政策性 (2.5%)', rate: 0.025 },
                    { label: `基准设定 (${formatPercent(project.discountRate)})`, rate: project.discountRate },
                    { label: '基建规范 (5.0%)', rate: 0.05 },
                    { label: '企业WACC (7.0%)', rate: 0.07 },
                    { label: '商业风险贴水 (9.5%)', rate: 0.095 },
                    { label: '宏观加息压力 (12.0%)', rate: 0.12 },
                  ].map(p => (
                    <button
                      key={p.rate}
                      onClick={() => setSimDiscountRate(p.rate)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                        Math.abs(simDiscountRate - p.rate) < 0.001
                          ? 'bg-teal-700 text-white font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Output Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* LCC PV Response Card */}
                <div className="bg-white p-4 rounded-xl border border-teal-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-teal-900 font-semibold">即时折现总现值 (LCC PV)</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      simResults.deltaLccPv < 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : simResults.deltaLccPv > 0 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {simResults.deltaLccPv >= 0 ? '+' : ''}{simResults.deltaLccPvPercent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="text-xl font-bold font-mono text-teal-800">
                    {formatCurrency(simResults.simLccPv)}
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-100">
                    <span>相较基准偏离:</span>
                    <strong className={simResults.deltaLccPv < 0 ? 'text-emerald-700' : simResults.deltaLccPv > 0 ? 'text-rose-700' : 'text-slate-600'}>
                      {simResults.deltaLccPv >= 0 ? '+' : ''}{formatCurrency(simResults.deltaLccPv)}
                    </strong>
                  </div>
                </div>

                {/* EAC Response Card */}
                <div className="bg-white p-4 rounded-xl border border-indigo-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-900 font-semibold">即时年均等额成本 (EAC)</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      simResults.deltaEac < 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : simResults.deltaEac > 0 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {simResults.deltaEac >= 0 ? '+' : ''}{simResults.deltaEacPercent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="text-xl font-bold font-mono text-indigo-900">
                    {formatCurrency(simResults.simEac)}/年
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-100">
                    <span>实时资本回收系数:</span>
                    <strong className="text-slate-800">
                      CRF = {simResults.simCrf.toFixed(6)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dynamic Non-linear Convexity Sparkline SVG */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
                    <span>折现率非线性衰减轨迹 (NPV Convexity Curve)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    绿色曲线: LCC PV(r) | 动标指示: 当前 r={(simDiscountRate * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="w-full h-28 bg-slate-50 rounded-lg p-2 border border-slate-100 relative">
                  <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none">
                    {/* Grid */}
                    <line x1="20" y1="15" x2="480" y2="15" stroke="#f1f5f9" />
                    <line x1="20" y1="45" x2="480" y2="45" stroke="#f1f5f9" />
                    <line x1="20" y1="70" x2="480" y2="70" stroke="#e2e8f0" />

                    {/* Non-linear decay curve */}
                    {(() => {
                      const maxPv = Math.max(...simResults.curvePoints.map(p => p.lccPv));
                      const minPv = Math.min(...simResults.curvePoints.map(p => p.lccPv));
                      const range = maxPv - minPv || 1;

                      const pts = simResults.curvePoints.map((p, idx) => {
                        const x = 20 + (idx / (simResults.curvePoints.length - 1)) * 460;
                        const y = 70 - ((p.lccPv - minPv) / range) * 55;
                        return `${x},${y}`;
                      });

                      // Current moving pin coordinates
                      const pinProgress = Math.max(0, Math.min(1, (simDiscountRate - 0.01) / (0.15 - 0.01)));
                      const pinX = 20 + pinProgress * 460;
                      const pinY = 70 - ((simResults.simLccPv - minPv) / range) * 55;

                      return (
                        <>
                          <path d={`M ${pts.join(' L ')}`} fill="none" stroke="#0d9488" strokeWidth="2.5" />
                          {/* Pin */}
                          <line x1={pinX} y1="10" x2={pinX} y2="70" stroke="#0f766e" strokeWidth="1.5" strokeDasharray="2 2" />
                          <circle cx={pinX} cy={pinY} r="4.5" fill="#0f766e" stroke="#ffffff" strokeWidth="1.5" />
                        </>
                      );
                    })()}
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>r = 1.0% (高敏感区)</span>
                  <span className="text-slate-500">数学凸性特征：低利率区间斜率陡峭，高利率区间逐渐趋缓</span>
                  <span>r = 15.0% (饱和平缓区)</span>
                </div>
              </div>

              {/* Economic Rationale Insight Box */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">折现率非线性影响机理：</span>
                  <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                    依据复利折现公式 1 / (1+r)ᵗ，折现率在分母上呈几何级数幂次展开，因此对远期现金流具有极强的<strong>凸性 (Convexity) 与久期敏感性</strong>。
                    在【{project.name}】（寿命长达 {project.lifetime} 年）中，折现率从 3% 上升至 6% 时，后半程的运维现值被剧烈衰减，体现出明显的非线性边际递减效应。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  步骤四：敏感性分析与主导风险因子识别
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('sensitivity')}
                className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>跳转至龙卷风图面板</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              在不确定性环境下，识别哪个变量对 LCC 现值具有决定性影响。根据敏感度排序建立风险对冲机制。
            </p>

            <div className="space-y-2 text-xs">
              {tornadoVars.slice(0, 3).map((v, i) => (
                <div key={v.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">第 {i + 1} 敏感因子：{v.name}</span>
                    <div className="text-[11px] text-slate-500">基准 {v.baseVal.toFixed(1)} {v.unit}</div>
                  </div>
                  <span className="font-mono font-bold text-rose-700">
                    影响极差: {formatCurrency(v.swing)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  步骤五：决策审计与评估报告导出
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('export')}
                className="text-xs text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>跳转至报告导出下载区</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>全生命周期成本评估审核已完备！</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                您可以直接导出符合企业决策与工程评审规范的《LCCA 决策白皮书 (Markdown)》、现金流量表 CSV 数据集，或一键调取浏览器排版打印生成高保真 PDF 决策文档。
              </p>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>上一步</span>
          </button>

          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            disabled={currentStep === 5}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40 text-xs font-semibold cursor-pointer shadow-xs"
          >
            <span>{currentStep === 5 ? '流程已完成' : '下一步'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
