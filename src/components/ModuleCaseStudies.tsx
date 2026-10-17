import React from 'react';
import { LccaProject } from '../types/lcca';
import { CASE_STUDIES } from '../data/cases';
import { 
  Building2, 
  Server, 
  Train, 
  Atom, 
  Cpu, 
  Building, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  Zap,
  ShieldAlert
} from 'lucide-react';

interface ModuleCaseStudiesProps {
  currentProject: LccaProject;
  onSelectCase: (caseId: string) => void;
}

export const ModuleCaseStudies: React.FC<ModuleCaseStudiesProps> = ({
  currentProject,
  onSelectCase,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bridge': return Building2;
      case 'Server': return Server;
      case 'Train': return Train;
      case 'Atom': return Atom;
      case 'Cpu': return Cpu;
      case 'Building': return Building;
      default: return Building2;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                六大实战案例
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                六大全生命周期成本工业级实战案例库 (Benchmark Cases)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              涵盖跨海大桥、数据中心、高铁动车组、核电站、智慧城市 IoT 与绿色建筑改造 6 大典型工程场景，多维度映照 LCCA 核心机理。
            </p>
          </div>

          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-lg">
            当前载入: <strong className="text-teal-800">{currentProject.name}</strong>
          </span>
        </div>
      </div>

      {/* 6 Benchmark Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CASE_STUDIES.map(c => {
          const Icon = getIcon(c.iconName);
          const isSelected = currentProject.id === c.id;

          return (
            <div
              key={c.id}
              className={`bg-white rounded-xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="p-5">
                {/* Top Badge & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 block">
                        {c.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{c.industry}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      <CheckCircle2 className="w-3 h-3" />
                      当前活跃
                    </span>
                  )}
                </div>

                {/* Case Title */}
                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {c.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {c.description}
                </p>

                {/* Domain Parameters Strip */}
                {c.domainParams && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs font-mono mb-4">
                    {c.domainParams.map((p, idx) => (
                      <div key={idx} className="border-l-2 border-teal-500/60 pl-2">
                        <div className="text-[10px] text-slate-400">{p.label}</div>
                        <div className="font-semibold text-slate-800">
                          {p.value} <span className="text-[10px] text-slate-500">{p.unit || ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Core Case Insights Slice */}
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">权衡机制：</span>
                      <span className="text-slate-600">{c.caseInsights?.capexOpexTradeoff}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-slate-700">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">陷阱警示：</span>
                      <span className="text-slate-600">{c.caseInsights?.hiddenTrapWarning}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                <button
                  onClick={() => onSelectCase(c.id)}
                  disabled={isSelected}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-xs cursor-default'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{isSelected ? '当前正在推演此案例' : '载入此案例至实验室'}</span>
                  {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
