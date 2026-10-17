/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LccaProject, StageCost, SavedScenario } from './types/lcca';
import { CASE_STUDIES } from './data/cases';
import { 
  calculateAnnualCashFlows, 
  calculateLccaSummary, 
  calculateTornadoVariables 
} from './utils/lccaMath';
import { Navbar } from './components/Navbar';
import { ModuleWorkflow } from './components/ModuleWorkflow';
import { ModuleCostAlgebra } from './components/ModuleCostAlgebra';
import { ModuleStageBreakdown } from './components/ModuleStageBreakdown';
import { ModuleDiscountTimeline } from './components/ModuleDiscountTimeline';
import { ModuleSensitivity } from './components/ModuleSensitivity';
import { ModuleCaseStudies } from './components/ModuleCaseStudies';
import { ModuleCodeEngine } from './components/ModuleCodeEngine';
import { ModuleExportReport } from './components/ModuleExportReport';
import { ModuleKnowledgeSlices } from './components/ModuleKnowledgeSlices';
import { ModuleAiDiagnosis } from './components/ModuleAiDiagnosis';
import { ModuleScenarioComparison } from './components/ModuleScenarioComparison';
import { Bot, Sparkles, Calculator, Layers, ArrowUpRight } from 'lucide-react';

export default function App() {
  // Current active project in laboratory
  const [currentProject, setCurrentProject] = useState<LccaProject>(() => {
    return JSON.parse(JSON.stringify(CASE_STUDIES[0]));
  });

  const [activeTab, setActiveTab] = useState<string>('workflow');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Synchronized dynamic calculations
  const cashFlows = useMemo(() => {
    return calculateAnnualCashFlows(currentProject);
  }, [currentProject]);

  const summary = useMemo(() => {
    return calculateLccaSummary(currentProject, cashFlows);
  }, [currentProject, cashFlows]);

  const tornadoVariables = useMemo(() => {
    return calculateTornadoVariables(currentProject);
  }, [currentProject]);

  // Saved scenarios pool for side-by-side comparison
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    const baseProj: LccaProject = JSON.parse(JSON.stringify(CASE_STUDIES[0]));
    
    // Scenario 2: High Reliability & Efficiency variant
    const greenVariant: LccaProject = JSON.parse(JSON.stringify(CASE_STUDIES[0]));
    greenVariant.id = 'scenario-green-variant';
    greenVariant.name = '跨海大桥 [高耐候材料与防腐前移优化方案]';
    greenVariant.stages.capex.directCost *= 1.12; // +12% CAPEX
    greenVariant.stages.opex.directCost *= 0.70;  // -30% routine O&M
    greenVariant.stages.maint.directCost *= 0.65; // -35% overhaul

    // Scenario 3: Alternative Benchmark (Green Data Center)
    const dcProj: LccaProject = JSON.parse(JSON.stringify(CASE_STUDIES[1]));

    return [
      {
        id: 'scenario-base',
        name: '方案 A: 跨海大桥基准设计 (常规标段方案)',
        description: '标准耐候钢材与常规除冰防腐养护设计方案',
        project: baseProj,
        color: '#0d9488', // Teal
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'scenario-green-variant',
        name: '方案 B: 高耐候长寿防腐前移优化方案',
        description: '前移硅烷浸渍与耐蚀钢投资 (CAPEX+12%)，换取后期大修周期延倍与能耗直降 30%',
        project: greenVariant,
        color: '#4f46e5', // Indigo
        createdAt: Date.now() - 1800000,
      },
      {
        id: 'scenario-datacenter',
        name: '方案 C: 新能源绿色算力中心基准标',
        description: '作为跨工业横向对比标的：轻 CAPEX、重 OPEX 电费与快速芯片迭代',
        project: dcProj,
        color: '#d97706', // Amber
        createdAt: Date.now() - 900000,
      },
    ];
  });

  // Handler to save current workspace as a scenario
  const handleSaveScenario = (name: string, description: string, project: LccaProject) => {
    const palette = ['#0d9488', '#4f46e5', '#d97706', '#e11d48', '#0284c7', '#8b5cf6'];
    const color = palette[savedScenarios.length % palette.length];
    const newScenario: SavedScenario = {
      id: `scenario-${Date.now()}`,
      name,
      description,
      project: JSON.parse(JSON.stringify(project)),
      color,
      createdAt: Date.now(),
    };
    setSavedScenarios(prev => [newScenario, ...prev]);
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== id));
  };

  const handleLoadScenarioToWorkspace = (scenario: SavedScenario) => {
    setCurrentProject(JSON.parse(JSON.stringify(scenario.project)));
  };

  // Case Selection handler
  const handleSelectCase = (caseId: string) => {
    const found = CASE_STUDIES.find(c => c.id === caseId);
    if (found) {
      setCurrentProject(JSON.parse(JSON.stringify(found)));
    }
  };

  // Reset to default
  const handleResetProject = () => {
    const found = CASE_STUDIES.find(c => c.id === currentProject.id) || CASE_STUDIES[0];
    setCurrentProject(JSON.parse(JSON.stringify(found)));
  };

  // Stage update handler
  const handleUpdateStage = (stageId: StageCost['id'], field: keyof StageCost, value: number) => {
    setCurrentProject(prev => {
      const cloned = JSON.parse(JSON.stringify(prev));
      cloned.stages[stageId][field] = value;
      return cloned;
    });
  };

  const handleUpdateDiscountRate = (rate: number) => {
    setCurrentProject(prev => ({ ...prev, discountRate: rate }));
  };

  const handleUpdateInflationRate = (rate: number) => {
    setCurrentProject(prev => ({ ...prev, inflationRate: rate }));
  };

  const handleUpdateLifetime = (years: number) => {
    setCurrentProject(prev => {
      const cloned = JSON.parse(JSON.stringify(prev));
      cloned.lifetime = years;
      cloned.stages.opex.endYear = years;
      cloned.stages.maint.endYear = years;
      cloned.stages.decom.startYear = years;
      cloned.stages.decom.endYear = years;
      return cloned;
    });
  };

  const handleUpdateSalvage = (val: number) => {
    setCurrentProject(prev => ({ ...prev, salvageValue: val }));
  };

  const handleImportProject = (imported: LccaProject) => {
    setCurrentProject(imported);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentProject={currentProject}
        summary={summary}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectCase={handleSelectCase}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onResetProject={handleResetProject}
        isAiLoading={isAiLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'workflow' && (
          <ModuleWorkflow
            project={currentProject}
            summary={summary}
            tornadoVars={tornadoVariables}
            cashFlows={cashFlows}
            onNavigateToTab={setActiveTab}
            onUpdateDiscountRate={handleUpdateDiscountRate}
            onUpdateInflationRate={handleUpdateInflationRate}
            onUpdateLifetime={handleUpdateLifetime}
          />
        )}

        {activeTab === 'algebra' && (
          <ModuleCostAlgebra
            project={currentProject}
            summary={summary}
            onUpdateDiscountRate={handleUpdateDiscountRate}
            onUpdateInflationRate={handleUpdateInflationRate}
          />
        )}

        {activeTab === 'stages' && (
          <ModuleStageBreakdown
            project={currentProject}
            summary={summary}
            onUpdateStage={handleUpdateStage}
            onUpdateSalvage={handleUpdateSalvage}
          />
        )}

        {activeTab === 'discount' && (
          <ModuleDiscountTimeline
            project={currentProject}
            cashFlows={cashFlows}
            summary={summary}
          />
        )}

        {activeTab === 'sensitivity' && (
          <ModuleSensitivity
            project={currentProject}
            summary={summary}
            tornadoVariables={tornadoVariables}
          />
        )}

        {activeTab === 'compare' && (
          <ModuleScenarioComparison
            currentProject={currentProject}
            savedScenarios={savedScenarios}
            onSaveScenario={handleSaveScenario}
            onDeleteScenario={handleDeleteScenario}
            onLoadScenarioToWorkspace={handleLoadScenarioToWorkspace}
          />
        )}

        {activeTab === 'cases' && (
          <ModuleCaseStudies
            currentProject={currentProject}
            onSelectCase={handleSelectCase}
          />
        )}

        {activeTab === 'code' && (
          <ModuleCodeEngine
            project={currentProject}
            summary={summary}
          />
        )}

        {activeTab === 'export' && (
          <ModuleExportReport
            project={currentProject}
            summary={summary}
            tornadoVars={tornadoVariables}
            cashFlows={cashFlows}
            onImportProject={handleImportProject}
          />
        )}

        {activeTab === 'knowledge' && (
          <ModuleKnowledgeSlices />
        )}
      </main>

      {/* Floating AI Diagnostic Summoner Button (Bottom Right) */}
      <aside aria-label="AI 随诊浮窗唤起" className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-slate-700/80 hover:scale-105"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">AI 专家随诊</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
          </span>
        </button>
      </aside>

      {/* AI Diagnosis and Consultation Modal */}
      <ModuleAiDiagnosis
        project={currentProject}
        summary={summary}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-700">系统全生命周期成本实验室 (LCCA Lab)</span>
            <span>· 国际工程经济学 ISO 15686-5 规范</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>CAPEX / OPEX / MAINT / DEC</span>
            <span>·</span>
            <span>多方案对齐比选引擎</span>
            <span>·</span>
            <span>DCF & NPV & EAC Engine</span>
            <span>·</span>
            <span>NumPy Financial v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
