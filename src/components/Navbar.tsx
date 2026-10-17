import React from 'react';
import { LccaProject, LccaSummary } from '../types/lcca';
import { CASE_STUDIES } from '../data/cases';
import { formatCurrency, formatPercent } from '../utils/lccaMath';
import { 
  Building2, 
  Sparkles, 
  FileDown, 
  Layers, 
  Workflow, 
  Calculator, 
  Sliders, 
  Code2, 
  BookOpen, 
  RotateCcw,
  Bot,
  ArrowLeftRight
} from 'lucide-react';

interface NavbarProps {
  currentProject: LccaProject;
  summary: LccaSummary;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectCase: (caseId: string) => void;
  onOpenAiModal: () => void;
  onResetProject: () => void;
  isAiLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  summary,
  activeTab,
  setActiveTab,
  onSelectCase,
  onOpenAiModal,
  onResetProject,
  isAiLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner with Brand & Real-time Key Metric Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* App Title & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-teal-800 to-emerald-600 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-900/10">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                系统全生命周期成本实验室
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20">
                LCCA Lab
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              工程经济学 · 建设投资(CAPEX) · 运维成本(OPEX) · 动态NPV与敏感性评估
            </p>
          </div>
        </div>

        {/* Dynamic Financial Metrics Strip */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1.5 flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">折现现值(LCC PV):</span>
            <span className="font-bold text-teal-700 font-mono text-sm">
              {formatCurrency(summary.lccPv)}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1.5 flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">年均等额成本(EAC):</span>
            <span className="font-bold text-indigo-700 font-mono text-sm">
              {formatCurrency(summary.eac)}/年
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1.5 hidden md:flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">折现率(r):</span>
            <span className="font-semibold text-slate-800 font-mono">
              {formatPercent(currentProject.discountRate)}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">寿命:</span>
            <span className="font-semibold text-slate-800 font-mono">
              {currentProject.lifetime}年
            </span>
          </div>

          {/* AI Diagnosis Action Trigger */}
          <button
            onClick={onOpenAiModal}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium shadow-xs transition-all cursor-pointer text-xs"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI专家随诊</span>
            {isAiLoading && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 flex items-center justify-between overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 sm:space-x-2 py-1.5">
          {[
            { id: 'workflow', label: '全流程导引', icon: Workflow },
            { id: 'algebra', label: '成本代数', icon: Calculator },
            { id: 'stages', label: '阶段建模', icon: Layers },
            { id: 'discount', label: '折现NPV', icon: Sliders },
            { id: 'sensitivity', label: '敏感性分析', icon: Sparkles },
            { id: 'compare', label: '多方案对比', icon: ArrowLeftRight },
            { id: 'cases', label: '六大案例', icon: Building2 },
            { id: 'code', label: '代码引擎', icon: Code2 },
            { id: 'export', label: '报告导出', icon: FileDown },
            { id: 'knowledge', label: '知识导引', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Case selector dropdown & Reset button */}
        <div className="hidden lg:flex items-center gap-2 pl-3">
          <label className="text-xs text-slate-400 whitespace-nowrap">预设案例:</label>
          <select
            value={currentProject.id}
            onChange={e => onSelectCase(e.target.value)}
            className="text-xs bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-800 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            {CASE_STUDIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.lifetime}年)
              </option>
            ))}
          </select>
          <button
            onClick={onResetProject}
            title="恢复当前案例默认基准参数"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
