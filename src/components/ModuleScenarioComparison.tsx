import React, { useState, useMemo, useEffect } from 'react';
import { LccaProject, SavedScenario, ScenarioComparisonSlot } from '../types/lcca';
import { CASE_STUDIES } from '../data/cases';
import { 
  calculateAnnualCashFlows, 
  calculateLccaSummary, 
  formatCurrency, 
  formatPercent,
  calculateCrf 
} from '../utils/lccaMath';
import { 
  Scale, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ArrowRight, 
  Download, 
  Sparkles, 
  TrendingDown, 
  BarChart3, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Sliders,
  RotateCcw,
  Zap,
  ArrowLeftRight
} from 'lucide-react';

interface ModuleScenarioComparisonProps {
  currentProject: LccaProject;
  savedScenarios: SavedScenario[];
  onSaveScenario: (name: string, description: string, project: LccaProject) => void;
  onDeleteScenario: (id: string) => void;
  onLoadScenarioToWorkspace: (scenario: SavedScenario) => void;
}

export const ModuleScenarioComparison: React.FC<ModuleScenarioComparisonProps> = ({
  currentProject,
  savedScenarios,
  onSaveScenario,
  onDeleteScenario,
  onLoadScenarioToWorkspace,
}) => {
  // Active selected scenario IDs for side-by-side comparison (up to 3)
  const [activeSlotIds, setActiveSlotIds] = useState<string[]>(() => {
    return savedScenarios.slice(0, 3).map(s => s.id);
  });

  // Keep active slots synchronized with available saved scenarios
  useEffect(() => {
    setActiveSlotIds(prev => {
      const valid = prev.filter(id => savedScenarios.some(s => s.id === id));
      if (valid.length === 0 && savedScenarios.length > 0) {
        return [savedScenarios[0].id];
      }
      return valid;
    });
  }, [savedScenarios]);

  // Modal / inline save state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');

  // Active chart tab
  const [activeOverlayChart, setActiveOverlayChart] = useState<'cumulative' | 'stages' | 'discount'>('cumulative');

  // Compute calculated slots for selected active scenarios
  const comparisonSlots: ScenarioComparisonSlot[] = useMemo(() => {
    return activeSlotIds.map(id => {
      const scenario = savedScenarios.find(s => s.id === id);
      if (!scenario) return null;
      const cashFlows = calculateAnnualCashFlows(scenario.project);
      const summary = calculateLccaSummary(scenario.project, cashFlows);
      return { scenario, cashFlows, summary };
    }).filter(Boolean) as ScenarioComparisonSlot[];
  }, [activeSlotIds, savedScenarios]);

  // Find lowest LCC PV and lowest EAC for highlighting
  const lowestLccSlot = useMemo(() => {
    if (comparisonSlots.length === 0) return null;
    return [...comparisonSlots].sort((a, b) => a.summary.lccPv - b.summary.lccPv)[0];
  }, [comparisonSlots]);

  const lowestEacSlot = useMemo(() => {
    if (comparisonSlots.length === 0) return null;
    return [...comparisonSlots].sort((a, b) => a.summary.eac - b.summary.eac)[0];
  }, [comparisonSlots]);

  // Toggle scenario in/out of comparison
  const toggleScenarioSlot = (id: string) => {
    if (activeSlotIds.includes(id)) {
      if (activeSlotIds.length <= 1) {
        alert('请至少保留一个方案用于对比！');
        return;
      }
      setActiveSlotIds(activeSlotIds.filter(x => x !== id));
    } else {
      if (activeSlotIds.length >= 3) {
        // Replace the last slot
        setActiveSlotIds([activeSlotIds[0], activeSlotIds[1], id]);
      } else {
        setActiveSlotIds([...activeSlotIds, id]);
      }
    }
  };

  // Quick preset generators (e.g. create a Green Retrofit or Low-OPEX variant)
  const handleCreateVariant = (type: 'low-opex' | 'low-capex') => {
    const cloned: LccaProject = JSON.parse(JSON.stringify(currentProject));
    if (type === 'low-opex') {
      cloned.id = `variant-${Date.now()}`;
      cloned.name = `${currentProject.name} (高效节能/低OPEX前移方案)`;
      cloned.stages.capex.directCost *= 1.15; // +15% initial investment
      cloned.stages.opex.directCost *= 0.65;  // -35% routine energy OPEX
      cloned.stages.maint.directCost *= 0.75; // -25% maintenance
      onSaveScenario(
        `${currentProject.name} [节能优化型]`,
        '前移可靠性与节能设计，CAPEX 增加 15%，年均 OPEX 节约 35%，MAINT 节约 25%',
        cloned
      );
    } else {
      cloned.id = `variant-${Date.now()}`;
      cloned.name = `${currentProject.name} (低初始造价方案/传统基准)`;
      cloned.stages.capex.directCost *= 0.85; // -15% initial investment
      cloned.stages.opex.directCost *= 1.30;  // +30% higher energy
      cloned.stages.maint.directCost *= 1.35; // +35% higher repairs
      onSaveScenario(
        `${currentProject.name} [低造价高运维型]`,
        '压缩初始采购造价 15%，但后期能耗增加 30%，设备大修维护频率增加 35%',
        cloned
      );
    }
  };

  // Export comparison table to CSV
  const handleExportComparisonCsv = () => {
    if (comparisonSlots.length === 0) return;
    const headers = [
      '评价指标项',
      ...comparisonSlots.map(s => `"${s.scenario.name}"`),
    ];

    const rows = [
      ['所属行业领域', ...comparisonSlots.map(s => `"${s.scenario.project.category}"`)],
      ['评估生命周期 (年)', ...comparisonSlots.map(s => `${s.scenario.project.lifetime}年`)],
      ['名义基准折现率 (r)', ...comparisonSlots.map(s => `${formatPercent(s.scenario.project.discountRate)}`)],
      ['全生命周期折现现值 (LCC PV 万元)', ...comparisonSlots.map(s => s.summary.lccPv.toFixed(2))],
      ['年均等额成本 (EAC 万元/年)', ...comparisonSlots.map(s => s.summary.eac.toFixed(2))],
      ['资本回收系数 (CRF)', ...comparisonSlots.map(s => s.summary.crf.toFixed(6))],
      ['名义总流出 (万元)', ...comparisonSlots.map(s => s.summary.nominalTotalLcc.toFixed(2))],
      ['初始建设投资现值 (PV CAPEX 万元)', ...comparisonSlots.map(s => s.summary.pvCapexTotal.toFixed(2))],
      ['运营日常能耗现值 (PV OPEX 万元)', ...comparisonSlots.map(s => s.summary.pvOpexTotal.toFixed(2))],
      ['定期大修维保现值 (PV MAINT 万元)', ...comparisonSlots.map(s => s.summary.pvMaintTotal.toFixed(2))],
      ['退役环保净现值 (PV DEC 万元)', ...comparisonSlots.map(s => s.summary.pvDecomTotal.toFixed(2))],
      ['水面CAPEX占比 (%)', ...comparisonSlots.map(s => `${s.summary.waterSurfaceCapexShare.toFixed(1)}%`)],
      ['水下运维隐性占比 (%)', ...comparisonSlots.map(s => `${s.summary.underwaterOpexShare.toFixed(1)}%`)],
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LCCA_多方案横向比选评估矩阵.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Determine maximum lifetime among active comparison slots for overlay chart
  const maxLifetime = Math.max(...comparisonSlots.map(s => s.scenario.project.lifetime), 20);
  const maxCumulativeLcc = Math.max(...comparisonSlots.map(s => s.summary.lccPv), 1000);

  // Palette for scenarios
  const colorMap: Record<string, { stroke: string; fill: string; badge: string; text: string }> = {
    '#0d9488': { stroke: '#0d9488', fill: 'bg-teal-50', badge: 'bg-teal-100 text-teal-800 border-teal-200', text: 'text-teal-700' },
    '#4f46e5': { stroke: '#4f46e5', fill: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', text: 'text-indigo-700' },
    '#d97706': { stroke: '#d97706', fill: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-700' },
    '#e11d48': { stroke: '#e11d48', fill: 'bg-rose-50', badge: 'bg-rose-100 text-rose-800 border-rose-200', text: 'text-rose-700' },
    '#0284c7': { stroke: '#0284c7', fill: 'bg-sky-50', badge: 'bg-sky-100 text-sky-800 border-sky-200', text: 'text-sky-700' },
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>方案对齐决策</span>
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                多方案多时态横向对比与叠加评估面板 (Side-by-Side LCCA Comparison)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              保存、管理并同时叠加多个项目方案，同屏比对全生命周期折现现值 (NPV)、年均等额成本 (EAC)、冰山构成与动态投资回收期。
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                setNewScenarioName(`${currentProject.name} (快照 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })})`);
                setNewScenarioDesc('基于当前工作台各项工程量与折现率保存的对比快照');
                setShowSaveDialog(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>保存当前配置为新方案</span>
            </button>

            <button
              onClick={handleExportComparisonCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出比选矩阵 CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario Variant Generators Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">基于当前项目一键生成对赌变体方案:</span>
            <button
              onClick={() => handleCreateVariant('low-opex')}
              className="ml-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 cursor-pointer transition-colors"
            >
              + 生成【高品质节能/低OPEX型】变体
            </button>
            <button
              onClick={() => handleCreateVariant('low-capex')}
              className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 cursor-pointer transition-colors"
            >
              + 生成【低初始造价/高运维型】变体
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            已存储方案: {savedScenarios.length} 个 | 对比栏位: {comparisonSlots.length} / 3
          </div>
        </div>
      </div>

      {/* Scenario Repository Strip (Select which scenarios to compare) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">已保存方案库 (点击标签勾选加入对比栏位):</span>
            <span className="text-slate-400">最多同时勾选 3 个方案同屏叠加</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {savedScenarios.map(s => {
            const isSelected = activeSlotIds.includes(s.id);
            const style = colorMap[s.color] || colorMap['#0d9488'];

            return (
              <div
                key={s.id}
                className={`group px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700'
                }`}
                onClick={() => toggleScenarioSlot(s.id)}
              >
                <span 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: s.color }}
                />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight line-clamp-1">{s.name}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {s.project.lifetime}年 | r={formatPercent(s.project.discountRate, 0)}
                  </div>
                </div>

                {isSelected ? (
                  <span className="ml-1 text-[10px] font-mono bg-teal-500/30 text-teal-300 px-1.5 py-0.2 rounded font-bold">
                    ✓ 对比中
                  </span>
                ) : (
                  <span className="ml-1 text-[10px] text-slate-400 group-hover:text-slate-600">
                    + 加入
                  </span>
                )}

                {/* Delete button (if not the last one) */}
                {savedScenarios.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确认删除方案「${s.name}」吗？`)) {
                        onDeleteScenario(s.id);
                        setActiveSlotIds(activeSlotIds.filter(x => x !== s.id));
                      }
                    }}
                    className={`p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 ml-1 transition-colors ${
                      isSelected ? 'hover:bg-slate-800' : ''
                    }`}
                    title="删除此方案"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Scenario Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900">保存当前配置为方案快照</h3>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">方案名称:</label>
              <input
                type="text"
                value={newScenarioName}
                onChange={e => setNewScenarioName(e.target.value)}
                placeholder="例如: 方案B - 高效地源热泵节能改造"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">方案描述 / 核心技术假设:</label>
              <textarea
                value={newScenarioDesc}
                onChange={e => setNewScenarioDesc(e.target.value)}
                placeholder="简述该方案相较基准方案的权衡特点..."
                rows={3}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newScenarioName.trim()) {
                    alert('请输入方案名称');
                    return;
                  }
                  onSaveScenario(newScenarioName, newScenarioDesc, currentProject);
                  setShowSaveDialog(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                保存方案
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">
              多方案经济性决策评价对齐矩阵 (Executive Comparison Matrix)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            绿色徽章标注最优经济性指标
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-56 font-bold text-slate-900">财务与工程决策指标</th>
                {comparisonSlots.map((slot) => {
                  const style = colorMap[slot.scenario.color] || colorMap['#0d9488'];
                  const isLowestLcc = lowestLccSlot?.scenario.id === slot.scenario.id;
                  const isLowestEac = lowestEacSlot?.scenario.id === slot.scenario.id;

                  return (
                    <th key={slot.scenario.id} className="p-3 min-w-[200px] border-l border-slate-200">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${style.badge}`}>
                          {slot.scenario.name}
                        </span>
                        {isLowestLcc && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            ⭐ 最优LCC
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans line-clamp-1 font-normal">
                        {slot.scenario.description || slot.scenario.project.category}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
              {/* Row: LCC PV */}
              <tr className="bg-slate-50/50">
                <td className="p-3 font-bold font-sans text-slate-900 flex items-center justify-between">
                  <span>全生命周期折现现值 (LCC PV)</span>
                  <span className="text-[10px] text-slate-400 font-normal">总现值极小化</span>
                </td>
                {comparisonSlots.map(s => {
                  const isLowest = lowestLccSlot?.scenario.id === s.scenario.id;
                  return (
                    <td key={s.scenario.id} className={`p-3 border-l border-slate-200 font-bold text-sm ${
                      isLowest ? 'text-emerald-700 bg-emerald-50/40' : 'text-slate-800'
                    }`}>
                      {formatCurrency(s.summary.lccPv)}
                    </td>
                  );
                })}
              </tr>

              {/* Row: EAC */}
              <tr>
                <td className="p-3 font-bold font-sans text-slate-900 flex items-center justify-between">
                  <span>年均等额成本 (EAC)</span>
                  <span className="text-[10px] text-slate-400 font-normal">等效年化基准</span>
                </td>
                {comparisonSlots.map(s => {
                  const isLowest = lowestEacSlot?.scenario.id === s.scenario.id;
                  return (
                    <td key={s.scenario.id} className={`p-3 border-l border-slate-200 font-bold text-sm ${
                      isLowest ? 'text-indigo-700 bg-indigo-50/40' : 'text-indigo-900'
                    }`}>
                      {formatCurrency(s.summary.eac)}/年
                    </td>
                  );
                })}
              </tr>

              {/* Row: Lifetime & Discount Rate */}
              <tr className="bg-slate-50/50">
                <td className="p-3 font-sans text-slate-700">设计服役寿命 (T) 与折现率 (r)</td>
                {comparisonSlots.map(s => (
                  <td key={s.scenario.id} className="p-3 border-l border-slate-200 text-slate-800">
                    {s.scenario.project.lifetime} 年 | r = {formatPercent(s.scenario.project.discountRate)}
                  </td>
                ))}
              </tr>

              {/* Row: Capital Recovery Factor */}
              <tr>
                <td className="p-3 font-sans text-slate-700">资本回收系数 CRF(r, T)</td>
                {comparisonSlots.map(s => (
                  <td key={s.scenario.id} className="p-3 border-l border-slate-200 text-slate-600">
                    {s.summary.crf.toFixed(6)}
                  </td>
                ))}
              </tr>

              {/* Row: Initial CAPEX PV */}
              <tr className="bg-slate-50/50">
                <td className="p-3 font-sans text-amber-800 font-semibold">建设初始投资现值 (PV CAPEX)</td>
                {comparisonSlots.map(s => (
                  <td key={s.scenario.id} className="p-3 border-l border-slate-200 text-amber-900 font-semibold">
                    {formatCurrency(s.summary.pvCapexTotal)}
                  </td>
                ))}
              </tr>

              {/* Row: Routine OPEX PV */}
              <tr>
                <td className="p-3 font-sans text-emerald-800 font-semibold">日常运营能耗现值 (PV OPEX)</td>
                {comparisonSlots.map(s => (
                  <td key={s.scenario.id} className="p-3 border-l border-slate-200 text-emerald-900">
                    {formatCurrency(s.summary.pvOpexTotal)}
                  </td>
                ))}
              </tr>

              {/* Row: Maintenance MAINT PV */}
              <tr className="bg-slate-50/50">
                <td className="p-3 font-sans text-indigo-800 font-semibold">定期中大修现值 (PV MAINT)</td>
                {comparisonSlots.map(s => (
                  <td key={s.scenario.id} className="p-3 border-l border-slate-200 text-indigo-900">
                    {formatCurrency(s.summary.pvMaintTotal)}
                  </td>
                ))}
              </tr>

              {/* Row: Decommissioning PV */}
              <tr>
                <td className="p-3 font-sans text-rose-800 font-semibold">退役处置与环保净现值 (PV DEC)</td>
                {comparisonSlots.map(s => (
                  <td key={s.scenario.id} className="p-3 border-l border-slate-200 text-rose-900">
                    {formatCurrency(s.summary.pvDecomTotal - s.summary.pvSalvageTotal)}
                  </td>
                ))}
              </tr>

              {/* Row: Iceberg Proportions */}
              <tr className="bg-slate-50/50">
                <td className="p-3 font-sans text-slate-700">冰山水上CAPEX vs 水下运维占比</td>
                {comparisonSlots.map(s => (
                  <td key={s.scenario.id} className="p-3 border-l border-slate-200 font-bold">
                    <span className="text-amber-700">{s.summary.waterSurfaceCapexShare.toFixed(1)}%</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-teal-700">{s.summary.underwaterOpexShare.toFixed(1)}%</span>
                  </td>
                ))}
              </tr>

              {/* Action row to load back to main workbench */}
              <tr>
                <td className="p-3 font-sans text-slate-500">工作台操作</td>
                {comparisonSlots.map(s => (
                  <td key={s.scenario.id} className="p-3 border-l border-slate-200">
                    <button
                      onClick={() => {
                        onLoadScenarioToWorkspace(s.scenario);
                        alert(`已载入「${s.scenario.name}」至主工作台！可在各个模块继续推演。`);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-sans text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>载入为主工作台方案</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Incremental Economics Callout (when exactly 2 scenarios are compared) */}
        {comparisonSlots.length === 2 && (
          <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-teal-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>双方案增量现值与经济性对赌分析 (Incremental LCCA Analysis)</span>
            </div>
            {(() => {
              const sA = comparisonSlots[0];
              const sB = comparisonSlots[1];
              const deltaCapex = sB.summary.pvCapexTotal - sA.summary.pvCapexTotal;
              const deltaOpexAnnual = (sA.scenario.project.stages.opex.directCost + sA.scenario.project.stages.maint.directCost) - 
                                     (sB.scenario.project.stages.opex.directCost + sB.scenario.project.stages.maint.directCost);
              const deltaLccPv = sA.summary.lccPv - sB.summary.lccPv;
              const paybackYears = deltaOpexAnnual > 0 ? (deltaCapex / deltaOpexAnnual).toFixed(1) : '无法静态回收';

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono">
                  <div className="p-2.5 bg-white rounded-lg border border-teal-200">
                    <div className="text-slate-500 text-[10px]">方案2相较方案1增量CAPEX</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {deltaCapex >= 0 ? '+' : ''}{formatCurrency(deltaCapex)}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-teal-200">
                    <div className="text-slate-500 text-[10px]">年均运维节约额 (OPEX+MAINT)</div>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {formatCurrency(deltaOpexAnnual)}/年
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-teal-200">
                    <div className="text-slate-500 text-[10px]">全周期净现值节省 (Net LCC Saving)</div>
                    <div className={`font-bold mt-0.5 ${deltaLccPv > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {deltaLccPv > 0 ? `方案2节省 ${formatCurrency(deltaLccPv)}` : `方案1更优 (${formatCurrency(Math.abs(deltaLccPv))})`}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Visual Multi-Scenario Overlay Charts */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                多方案多时态叠加对比图 (Multi-Scenario Overlay Trajectory)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              将选定的对比方案在同一时间轴上进行全生命周期累计现值、6阶段构成与折现敏感度叠加剖析。
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveOverlayChart('cumulative')}
              className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                activeOverlayChart === 'cumulative'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              累计现值走势重叠曲线
            </button>
            <button
              onClick={() => setActiveOverlayChart('stages')}
              className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                activeOverlayChart === 'stages'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6阶段成本构成横向柱状
            </button>
          </div>
        </div>

        {/* Visual Canvas 1: Cumulative LCC PV Growth Trajectory */}
        {activeOverlayChart === 'cumulative' && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-800">
                多方案全生命周期累计折现现值走势对比 (t = 0 ~ {maxLifetime}年)
              </span>
              <div className="flex items-center gap-4">
                {comparisonSlots.map(s => (
                  <span key={s.scenario.id} className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5" style={{ backgroundColor: s.scenario.color }} />
                    <span className="text-slate-700">{s.scenario.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* SVG Overlay Curves Canvas */}
            <div className="w-full h-72 bg-white rounded-lg p-3 border border-slate-200 relative">
              <svg className="w-full h-full" viewBox="0 0 760 210" preserveAspectRatio="none">
                {/* Horizontal grid */}
                <line x1="50" y1="20" x2="720" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="50" y1="70" x2="720" y2="70" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="50" y1="120" x2="720" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="50" y1="175" x2="720" y2="175" stroke="#cbd5e1" />
                <line x1="50" y1="20" x2="50" y2="175" stroke="#cbd5e1" />

                {/* Left labels */}
                <text x="40" y="24" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                  {formatCurrency(maxCumulativeLcc, 0)}
                </text>
                <text x="40" y="100" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                  {formatCurrency(maxCumulativeLcc * 0.5, 0)}
                </text>
                <text x="40" y="175" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">0</text>

                {/* X labels */}
                <text x="50" y="192" fontSize="9" fill="#64748b" textAnchor="middle">第0年</text>
                <text x="385" y="192" fontSize="9" fill="#64748b" textAnchor="middle">第{Math.round(maxLifetime / 2)}年</text>
                <text x="720" y="192" fontSize="9" fill="#64748b" textAnchor="middle">第{maxLifetime}年</text>

                {/* Render overlay curves for each comparison slot */}
                {comparisonSlots.map(slot => {
                  const pts = slot.cashFlows.map(flow => {
                    const x = 50 + (flow.year / maxLifetime) * (720 - 50);
                    const y = 175 - (flow.cumulativeLccPv / maxCumulativeLcc) * 150;
                    return `${x},${y}`;
                  });

                  return (
                    <g key={slot.scenario.id}>
                      <path
                        d={`M ${pts.join(' L ')}`}
                        fill="none"
                        stroke={slot.scenario.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Terminal dot */}
                      {(() => {
                        const last = slot.cashFlows[slot.cashFlows.length - 1];
                        const x = 50 + (last.year / maxLifetime) * (720 - 50);
                        const y = 175 - (last.cumulativeLccPv / maxCumulativeLcc) * 150;
                        return (
                          <circle cx={x} cy={y} r="4" fill={slot.scenario.color} />
                        );
                      })()}
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              <strong>交叉平衡点 (Break-even Crossing) 观察</strong>：
              对于初始 CAPEX 较高但能耗维护极低的优化方案，曲线在初期位于上方；随着运营年数累积，低品质方案的累积现值迅速攀升并向上反超。曲线交叉点即为“动态投资回收期”。
            </p>
          </div>
        )}

        {/* Visual Canvas 2: 6 Stages Stacked Comparison */}
        {activeOverlayChart === 'stages' && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-800">各方案 6 大阶段成本构成对比</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" /> CAPEX 建设</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" /> OPEX 运营</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs" /> MAINT 维护</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs" /> DEC 退役</span>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {comparisonSlots.map(s => {
                const total = s.summary.lccPv;
                const capexPercent = (s.summary.pvCapexTotal / total) * 100;
                const opexPercent = (s.summary.pvOpexTotal / total) * 100;
                const maintPercent = (s.summary.pvMaintTotal / total) * 100;
                const decPercent = Math.max(0, ((s.summary.pvDecomTotal - s.summary.pvSalvageTotal) / total) * 100);

                return (
                  <div key={s.scenario.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.scenario.color }} />
                        {s.scenario.name}
                      </span>
                      <span className="font-bold text-teal-800">
                        LCC PV: {formatCurrency(total)}
                      </span>
                    </div>

                    <div className="h-5 rounded-md overflow-hidden flex shadow-inner">
                      <div style={{ width: `${capexPercent}%` }} className="bg-amber-500" title={`CAPEX: ${capexPercent.toFixed(1)}%`} />
                      <div style={{ width: `${opexPercent}%` }} className="bg-emerald-600" title={`OPEX: ${opexPercent.toFixed(1)}%`} />
                      <div style={{ width: `${maintPercent}%` }} className="bg-indigo-600" title={`MAINT: ${maintPercent.toFixed(1)}%`} />
                      <div style={{ width: `${decPercent}%` }} className="bg-rose-500" title={`DEC: ${decPercent.toFixed(1)}%`} />
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-600 pt-1">
                      <div>CAPEX: <strong>{capexPercent.toFixed(1)}%</strong> ({formatCurrency(s.summary.pvCapexTotal)})</div>
                      <div>OPEX: <strong>{opexPercent.toFixed(1)}%</strong> ({formatCurrency(s.summary.pvOpexTotal)})</div>
                      <div>MAINT: <strong>{maintPercent.toFixed(1)}%</strong> ({formatCurrency(s.summary.pvMaintTotal)})</div>
                      <div>DEC: <strong>{decPercent.toFixed(1)}%</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
