import React, { useState } from 'react';
import { LccaProject, LccaSummary, StageCost } from '../types/lcca';
import { formatCurrency, formatPercent } from '../utils/lccaMath';
import { Layers, Edit3, Eye, ShieldAlert, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface ModuleStageBreakdownProps {
  project: LccaProject;
  summary: LccaSummary;
  onUpdateStage: (stageId: StageCost['id'], field: keyof StageCost, value: number) => void;
  onUpdateSalvage: (val: number) => void;
}

export const ModuleStageBreakdown: React.FC<ModuleStageBreakdownProps> = ({
  project,
  summary,
  onUpdateStage,
  onUpdateSalvage,
}) => {
  const [editingStage, setEditingStage] = useState<string | null>(null);

  const stagesList = [
    { key: 'planning', cost: project.stages.planning, badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
    { key: 'design', cost: project.stages.design, badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    { key: 'capex', cost: project.stages.capex, badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
    { key: 'opex', cost: project.stages.opex, badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { key: 'maint', cost: project.stages.maint, badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { key: 'decom', cost: project.stages.decom, badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                六阶段成本分解
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                全生命周期 6 阶段成本建模 (6-Stage CBS)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              精准量化规划、设计、建设 (CAPEX)、运行、维护 (OPEX) 及退役报废 (DEC) 6 大阶段的直接与间接成本。
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">水上CAPEX占比:</span>
            <span className="font-bold text-amber-600 font-mono text-sm">
              {summary.waterSurfaceCapexShare.toFixed(1)}%
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">水下运维隐性占比:</span>
            <span className="font-bold text-teal-700 font-mono text-sm">
              {summary.underwaterOpexShare.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* The Famous LCCA Iceberg Model Visualization */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>全生命周期“冰山效应 (Iceberg Effect)”剖析</span>
            </h3>
            <p className="text-xs text-slate-500">
              很多项目招标仅关注水面上 20%~30% 的建设采购价格，却忽视了沉睡在水面之下高达 70%~80% 的运营能耗、频繁大修及退役巨额隐性开销。
            </p>
          </div>
        </div>

        {/* Iceberg Graphic Canvas */}
        <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-b from-sky-50 via-sky-100 to-slate-900 flex flex-col justify-between p-4">
          {/* Water Surface Line */}
          <div className="absolute top-[35%] left-0 right-0 h-0.5 bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.8)] z-10 flex items-center justify-between px-4">
            <span className="bg-cyan-900/80 text-cyan-200 text-[10px] px-2 py-0.5 rounded font-mono">
              ~~~ 海平面 (采购招标决策视界) ~~~
            </span>
            <span className="text-cyan-200 text-[10px] font-mono">
              初始 CAPEX 现值: {formatCurrency(summary.pvCapexTotal)}
            </span>
          </div>

          {/* Above Water: Tip of the Iceberg */}
          <div className="relative z-10 pt-2 flex items-center justify-around">
            <div className="bg-white/90 backdrop-blur-xs border border-amber-300 rounded-lg p-2.5 shadow-sm text-center max-w-[280px]">
              <div className="text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1">
                <span>🏔️ 水面之上：冰山之角 (CAPEX)</span>
              </div>
              <div className="text-lg font-bold font-mono text-amber-900 mt-0.5">
                {summary.waterSurfaceCapexShare.toFixed(1)}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                规划 + 设计 + 施工建设一次性投资：{formatCurrency(summary.pvCapexTotal)}
              </p>
            </div>
          </div>

          {/* Underwater: Massive Hidden Iceberg */}
          <div className="relative z-10 pb-2 flex items-center justify-around">
            <div className="bg-slate-900/85 backdrop-blur-xs border border-teal-500/50 rounded-lg p-3 shadow-md text-center max-w-[480px]">
              <div className="text-xs font-bold text-teal-300 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
                <span>🌊 水面之下：隐性运维冰山 (OPEX + MAINT + DEC)</span>
              </div>
              <div className="text-xl font-bold font-mono text-teal-400 mt-0.5">
                {summary.underwaterOpexShare.toFixed(1)}%
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] font-mono text-slate-300 border-t border-slate-700/60 pt-2">
                <div>
                  <div className="text-slate-400">运营能耗现值</div>
                  <div className="font-semibold text-emerald-400">{formatCurrency(summary.pvOpexTotal)}</div>
                </div>
                <div>
                  <div className="text-slate-400">维护大修现值</div>
                  <div className="font-semibold text-indigo-300">{formatCurrency(summary.pvMaintTotal)}</div>
                </div>
                <div>
                  <div className="text-slate-400">退役环保现值</div>
                  <div className="font-semibold text-rose-300">{formatCurrency(summary.pvDecomTotal)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Stages Interactive Cost Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stagesList.map(({ key, cost, badgeColor }, index) => {
          const totalNominal = cost.directCost + cost.indirectCost;
          const isEditing = editingStage === key;

          return (
            <div
              key={key}
              className={`bg-white rounded-xl border transition-all shadow-xs ${
                isEditing ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 font-mono">0{index + 1}</span>
                      <h4 className="text-sm font-bold text-slate-900">{cost.name}</h4>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{cost.nameEn}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badgeColor}`}>
                    年限: {cost.startYear}~{cost.endYear}年
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-3">
                  {cost.description}
                </p>

                {/* Cost values summary */}
                <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">直接费用 (Direct):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatCurrency(cost.directCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">间接/管理 (Indirect):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatCurrency(cost.indirectCost)}
                    </span>
                  </div>
                  {cost.annualGrowthRate !== undefined && (
                    <div className="flex justify-between text-[11px] text-teal-700">
                      <span>年均价格上浮率:</span>
                      <span className="font-mono font-semibold">
                        {formatPercent(cost.annualGrowthRate)}
                      </span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold">
                    <span className="text-slate-700">基准名义小计:</span>
                    <span className="font-mono text-teal-800">{formatCurrency(totalNominal)}</span>
                  </div>
                </div>

                {/* Edit Toggle */}
                <div className="mt-3 pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setEditingStage(isEditing ? null : key)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? '收起调整' : '微调阶段参数'}</span>
                  </button>
                  <span className="text-[10px] text-slate-400">
                    {key === 'opex' || key === 'maint' ? '每年常态发生' : '工程节点一次/按年摊销'}
                  </span>
                </div>

                {/* Expandable Parameter Editor */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-teal-50/40 p-3 rounded-lg text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">直接费用 (万元):</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={cost.directCost}
                        onChange={e => onUpdateStage(cost.id, 'directCost', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">间接管理费用 (万元):</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={cost.indirectCost}
                        onChange={e => onUpdateStage(cost.id, 'indirectCost', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    {cost.annualGrowthRate !== undefined && (
                      <div>
                        <label className="block text-slate-600 mb-1">
                          年复合递增率 ({formatPercent(cost.annualGrowthRate)}):
                        </label>
                        <input
                          type="range"
                          min="-0.05"
                          max="0.10"
                          step="0.005"
                          value={cost.annualGrowthRate}
                          onChange={e => onUpdateStage(cost.id, 'annualGrowthRate', parseFloat(e.target.value))}
                          className="w-full accent-teal-600"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Salvage Value Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-slate-800">终期残值回收抵扣 (Salvage Value / Negative Cost)</span>
          <p className="text-slate-500">
            在第 {project.lifetime} 年设备与结构退役回收残值，将作为负成本抵扣全生命周期折现现值。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">设置残值:</span>
            <input
              type="number"
              min="0"
              step="500"
              value={project.salvageValue}
              onChange={e => onUpdateSalvage(parseFloat(e.target.value) || 0)}
              className="w-28 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-700"
            />
            <span className="text-slate-500">万元</span>
          </div>
          <div className="text-slate-400 font-mono">
            折现现值: <span className="font-semibold text-emerald-800">-{formatCurrency(summary.pvSalvageTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
