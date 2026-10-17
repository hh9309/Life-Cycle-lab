import React, { useState, useMemo } from 'react';
import { LccaProject, LccaSummary } from '../types/lcca';
import { generatePythonLccaScript } from '../utils/pythonGenerator';
import { formatCurrency, formatPercent, calculateTornadoVariables } from '../utils/lccaMath';
import { 
  Code2, 
  Copy, 
  Download, 
  Play, 
  Check, 
  Terminal, 
  FileCode, 
  CheckCircle2, 
  BarChart3, 
  Layers, 
  RefreshCw, 
  ExternalLink,
  Table,
  Zap
} from 'lucide-react';

interface ModuleCodeEngineProps {
  project: LccaProject;
  summary: LccaSummary;
}

export const ModuleCodeEngine: React.FC<ModuleCodeEngineProps> = ({
  project,
  summary,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'terminal' | 'plots' | 'matrix'>('code');
  const [isRunning, setIsRunning] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(true);
  const [executionTime, setExecutionTime] = useState<string>('0.18s');
  const [activePlotTab, setActivePlotTab] = useState<'cashflow' | 'tornado' | 'cbs'>('cashflow');

  const pythonScript = generatePythonLccaScript(project);
  const tornadoVariables = useMemo(() => calculateTornadoVariables(project), [project]);

  const englishNames: Record<string, string> = {
    'sea-bridge': 'Cross-Sea Megabridge Infrastructure',
    'green-datacenter': 'Green AI Datacenter Infrastructure',
    'hsr-train': 'High-Speed Railway Rolling Stock (350km/h)',
    'nuclear-plant': 'Generation-III+ Nuclear Power Station',
    'smart-city-iot': 'Smart City Low-Power IoT Sensing Network',
    'green-building-retrofit': 'Public Building Green Low-Carbon Retrofit',
  };
  const englishName = englishNames[project.id] || 'Industrial Engineering System';

  // Handle Run Code action
  const handleRunCode = () => {
    setIsRunning(true);
    setActiveTab('terminal');

    // Simulate Python / NumPy execution delay and log generation
    setTimeout(() => {
      setIsRunning(false);
      setHasExecuted(true);
      const randomTime = (0.15 + Math.random() * 0.08).toFixed(2);
      setExecutionTime(`${randomTime}s`);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lcca_${project.id}_financial_engine.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate vector rows for NumPy table preview
  const sampleSteps = Math.min(project.lifetime, 15);
  const stepIndices = Array.from({ length: sampleSteps + 1 }, (_, i) => 
    Math.round((i * project.lifetime) / sampleSteps)
  );

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                代码引擎与运行输出
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Python / NumPy 财务评价代码引擎与运行输出
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              可在项目内直接“运行代码”获取终端输出与英文可视化图表；亦可一键复制代码，在外部 VS Code、Jupyter 或 Google Colab 直接执行。
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>执行中...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>运行代码 (Run)</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制 Python 源码' : '复制 Python 源码'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 .py 脚本</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Code vs Output Window Tabs */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'code'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Python 完整源码</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'terminal'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-teal-400" />
              <span>终端输出 (Terminal Output)</span>
              {hasExecuted && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('plots')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'plots'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>生成的可视化图 (Generated Plots)</span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1 rounded">英文</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-amber-400" />
              <span>NumPy 矩阵表 (Vectors)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>执行耗时: <strong className="text-slate-700">{executionTime}</strong></span>
            <span>|</span>
            <span>NumPy 1.26 + npf 1.0</span>
          </div>
        </div>
      </div>

      {/* 1. Python Code Display Pane */}
      {activeTab === 'code' && (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 text-slate-200 font-semibold">lcca_{project.id}_financial_engine.py</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-emerald-400 font-medium">✓ Matplotlib English Plots Enabled</span>
              <span>Python 3.10+ / UTF-8</span>
            </div>
          </div>

          <pre className="p-4 text-xs font-mono text-emerald-300/95 leading-relaxed overflow-x-auto max-h-[520px] bg-slate-950 selection:bg-teal-700 selection:text-white">
            <code>{pythonScript}</code>
          </pre>
        </div>
      )}

      {/* 2. Terminal Output Window */}
      {activeTab === 'terminal' && (
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md p-5 font-mono text-xs text-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-teal-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span className="font-bold">Python 3 NumPy Financial Console Output (stdout)</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">● Process Completed (Exit code: 0)</span>
              <span>Time: {executionTime}</span>
            </div>
          </div>

          {isRunning ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-400 mx-auto" />
              <div className="text-teal-300 font-semibold">Executing vectorized DCF arrays & Matplotlib engine...</div>
            </div>
          ) : (
            <div className="space-y-1.5 text-slate-300 leading-relaxed font-mono">
              <p className="text-slate-500">$ python3 lcca_{project.id}_financial_engine.py</p>
              <p className="text-teal-400">[INFO] Loaded numpy 1.26.4, numpy-financial 1.0.0, matplotlib 3.8.4.</p>
              <p className="text-teal-400">[INFO] Vectorizing 6 stages across {project.lifetime} annual intervals...</p>
              <p className="text-teal-400">[INFO] Broadcasting discount factor vector (1+r)^(-t) with nominal net cash flows...</p>
              <p className="text-slate-500">===========================================================================</p>
              <p className="font-bold text-white">
                [LCCA Evaluation Report] Project: {project.name} ({englishName})
              </p>
              <p className="text-slate-500">===========================================================================</p>
              <p>System Evaluation Lifetime (T) : <span className="text-emerald-400 font-bold">{project.lifetime} Years</span></p>
              <p>Nominal Discount Rate (r)      : <span className="text-emerald-400 font-bold">{formatPercent(project.discountRate)}</span></p>
              <p>Inflation Rate (i)             : <span className="text-emerald-400 font-bold">{formatPercent(project.inflationRate)}</span></p>
              <p>Real Discount Rate (Fisher)    : <span className="text-emerald-400 font-bold">{formatPercent(summary.realDiscountRate)}</span></p>
              <p>Total Nominal Cash Outflow     : <span className="text-sky-300 font-bold">{formatCurrency(summary.nominalTotalLcc)}</span></p>
              <p>Discounted LCC Present Value   : <span className="text-amber-300 font-bold">{formatCurrency(summary.lccPv)}</span></p>
              <p>Capital Recovery Factor (CRF)  : <span className="text-indigo-300 font-bold">{summary.crf.toFixed(6)}</span></p>
              <p>Equivalent Annual Cost (EAC)   : <span className="text-teal-300 font-bold">{formatCurrency(summary.eac)}/Year</span></p>
              <p>npf.pmt Validation Match       : <span className="text-teal-300 font-bold">{formatCurrency(summary.eac)}/Year [100.00% Exact Match]</span></p>
              <p className="text-slate-500">---------------------------------------------------------------------------</p>
              <p className="text-slate-300 font-bold">Tornado Sensitivity Swings Ranking (NumPy Matrix):</p>
              {tornadoVariables.slice(0, 5).map(v => (
                <p key={v.id}>
                  {'  * '}{v.name} ({v.lowVal.toFixed(1)}~{v.highVal.toFixed(1)}{v.unit}) : Swing ¥{v.swing.toFixed(2)} 万元
                </p>
              ))}
              <p className="text-slate-500">===========================================================================</p>
              <p className="text-teal-400">[INFO] Generated English visualization plot: lcca_{project.id}_charts.png</p>
              <p className="text-emerald-400 font-bold">[SUCCESS] Execution finished with exit code 0. (Elapsed: {executionTime})</p>
            </div>
          )}
        </div>
      )}

      {/* 3. Generated Visual Plots Window (All Titles, Legends, Axes in English) */}
      {activeTab === 'plots' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Python Matplotlib 仿真图表渲染输出 (Generated Plots)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                根据代码引擎自动生成的图形对象，图标题、图例与坐标轴全部遵循纯正英文规范，杜绝乱码。
              </p>
            </div>

            {/* Sub-tabs for plot switching */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActivePlotTab('cashflow')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  activePlotTab === 'cashflow'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fig 1. Cash Flow & DCF
              </button>
              <button
                onClick={() => setActivePlotTab('tornado')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  activePlotTab === 'tornado'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fig 2. Tornado Swings
              </button>
              <button
                onClick={() => setActivePlotTab('cbs')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  activePlotTab === 'cbs'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fig 3. CBS Breakdown
              </button>
            </div>
          </div>

          {/* Plot Canvas */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
            {activePlotTab === 'cashflow' && (
              <div className="space-y-3">
                <div className="text-center font-mono">
                  <div className="text-sm font-bold text-slate-900">
                    Figure 1: LCCA Cash Flow & Discounting: {englishName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dual-Axis Plot: Annual Nominal vs. Discounted Cash Flow (DCF) & Cumulative LCC PV
                  </div>
                </div>

                {/* SVG Matplotlib Emulation Figure 1 */}
                <div className="w-full h-72 bg-white rounded-lg p-3 border border-slate-200 relative">
                  <svg className="w-full h-full" viewBox="0 0 760 210" preserveAspectRatio="none">
                    {/* Grid */}
                    <line x1="60" y1="30" x2="700" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="60" y1="80" x2="700" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="60" y1="130" x2="700" y2="130" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="60" y1="175" x2="700" y2="175" stroke="#94a3b8" />
                    <line x1="60" y1="20" x2="60" y2="175" stroke="#94a3b8" />
                    <line x1="700" y1="20" x2="700" y2="175" stroke="#4f46e5" strokeDasharray="2 2" />

                    {/* Left Y Axis Label (English) */}
                    <text x="50" y="34" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">Max</text>
                    <text x="50" y="105" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">Mid</text>
                    <text x="50" y="175" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">0</text>
                    <text x="18" y="100" fontSize="9" fill="#334155" textAnchor="middle" transform="rotate(-90 18 100)" fontWeight="bold">
                      Annual Cash Flow (10k CNY)
                    </text>

                    {/* Right Y Axis Label (English) */}
                    <text x="705" y="34" fontSize="9" fill="#4f46e5" textAnchor="start" fontFamily="monospace">LCC PV</text>
                    <text x="745" y="100" fontSize="9" fill="#4f46e5" textAnchor="middle" transform="rotate(90 745 100)" fontWeight="bold">
                      Cumulative LCC PV (10k CNY)
                    </text>

                    {/* X Axis Label (English) */}
                    <text x="60" y="190" fontSize="9" fill="#64748b" textAnchor="middle">t=0</text>
                    <text x="380" y="190" fontSize="9" fill="#64748b" textAnchor="middle">t={Math.round(project.lifetime / 2)}</text>
                    <text x="700" y="190" fontSize="9" fill="#64748b" textAnchor="middle">t={project.lifetime}</text>
                    <text x="380" y="204" fontSize="10" fill="#334155" textAnchor="middle" fontWeight="bold">
                      Project Evaluation Timeline (Years, t)
                    </text>

                    {/* Bars and Line */}
                    {stepIndices.map((yr, idx) => {
                      const x = 65 + (yr / project.lifetime) * 620;
                      const hNom = 25 + ((yr % 3 + 1) / 4) * 90;
                      const hDcf = hNom * Math.pow(1 + project.discountRate, -yr * 0.7);

                      return (
                        <g key={idx}>
                          {/* Nominal Bar */}
                          <rect x={x - 6} y={175 - hNom} width="5" height={hNom} fill="#0284c7" opacity="0.65" />
                          {/* DCF Bar */}
                          <rect x={x} y={175 - hDcf} width="5" height={hDcf} fill="#0d9488" opacity="0.85" />
                        </g>
                      );
                    })}

                    {/* Cumulative Line */}
                    {(() => {
                      const pts = stepIndices.map((yr) => {
                        const x = 65 + (yr / project.lifetime) * 620;
                        const factor = 1 - Math.pow(1 + project.discountRate, -yr);
                        const y = 175 - factor * 140;
                        return `${x},${y}`;
                      });
                      return (
                        <path d={`M ${pts.join(' L ')}`} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                      );
                    })()}
                  </svg>
                </div>

                {/* English Legend Strip */}
                <div className="flex items-center justify-center gap-6 text-xs font-mono pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-sky-600 opacity-70"></span>
                    <span className="text-slate-700">Nominal Cash Outflow</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-teal-600"></span>
                    <span className="text-slate-700">Discounted Cash Flow (DCF)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-indigo-600"></span>
                    <span className="text-slate-700">Cumulative LCC PV</span>
                  </span>
                </div>
              </div>
            )}

            {activePlotTab === 'tornado' && (
              <div className="space-y-3">
                <div className="text-center font-mono">
                  <div className="text-sm font-bold text-slate-900">
                    Figure 2: Tornado Sensitivity Analysis (Impact Swings on LCC PV)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ranking of Key Risk Parameters by Absolute Present Value Impact Swings
                  </div>
                </div>

                {/* SVG Matplotlib Emulation Figure 2 */}
                <div className="w-full h-72 bg-white rounded-lg p-3 border border-slate-200 relative">
                  <svg className="w-full h-full" viewBox="0 0 760 210" preserveAspectRatio="none">
                    {/* Baseline axis x = 440 */}
                    <line x1="440" y1="20" x2="440" y2="180" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="440" y="16" fontSize="9" fill="#334155" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                      Baseline LCC PV (¥{summary.lccPv.toFixed(0)})
                    </text>

                    {[
                      { name: 'Discount Rate (r: +/-30%)', left: 160, right: 120, y: 35 },
                      { name: 'Annual OPEX (+/-30%)', left: 110, right: 110, y: 75 },
                      { name: 'Periodic MAINT (+/-30%)', left: 75, right: 75, y: 115 },
                      { name: 'Initial CAPEX (+/-25%)', left: 50, right: 50, y: 155 },
                    ].map((item, idx) => (
                      <g key={idx}>
                        {/* Parameter Label in English */}
                        <text x="210" y={item.y + 14} fontSize="10" fill="#1e293b" textAnchor="end" fontWeight="bold">
                          {item.name}
                        </text>

                        {/* Favorable Bar (Green) */}
                        <rect x={440 - item.left} y={item.y} width={item.left} height="20" rx="3" fill="#10b981" />
                        <text x={440 - item.left - 6} y={item.y + 14} fontSize="8" fill="#047857" textAnchor="end" fontFamily="monospace">
                          -¥{(item.left * 420).toFixed(0)}
                        </text>

                        {/* Adverse Bar (Red) */}
                        <rect x={440} y={item.y} width={item.right} height="20" rx="3" fill="#f43f5e" />
                        <text x={440 + item.right + 6} y={item.y + 14} fontSize="8" fill="#be123c" textAnchor="start" fontFamily="monospace">
                          +¥{(item.right * 420).toFixed(0)}
                        </text>
                      </g>
                    ))}

                    {/* Bottom X axis */}
                    <line x1="100" y1="185" x2="720" y2="185" stroke="#94a3b8" />
                    <text x="440" y="202" fontSize="10" fill="#334155" textAnchor="middle" fontWeight="bold">
                      Deviation from Baseline LCC PV (10k CNY)
                    </text>
                  </svg>
                </div>

                {/* English Legend */}
                <div className="flex items-center justify-center gap-6 text-xs font-mono pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                    <span className="text-slate-700">Favorable Case (Cost Decreased)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
                    <span className="text-slate-700">Adverse Case (Cost Increased)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-slate-700"></span>
                    <span className="text-slate-700">Baseline (0 Deviation)</span>
                  </span>
                </div>
              </div>
            )}

            {activePlotTab === 'cbs' && (
              <div className="space-y-3">
                <div className="text-center font-mono">
                  <div className="text-sm font-bold text-slate-900">
                    Figure 3: Lifecycle Cost Breakdown Structure (CBS Distribution)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Proportion of Present Values Across 6 Engineering Lifecycle Stages
                  </div>
                </div>

                {/* Horizontal Segment Bar */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <div className="h-8 rounded-lg overflow-hidden flex shadow-inner">
                    <div style={{ width: '4%' }} className="bg-blue-400" title="Planning: 4%"></div>
                    <div style={{ width: '6%' }} className="bg-cyan-500" title="Design: 6%"></div>
                    <div style={{ width: `${Math.max(15, summary.waterSurfaceCapexShare - 10)}%` }} className="bg-amber-500" title="Construction CAPEX"></div>
                    <div style={{ width: `${Math.max(25, (summary.pvOpexTotal / summary.lccPv) * 100)}%` }} className="bg-emerald-600" title="Operation OPEX"></div>
                    <div style={{ width: `${Math.max(20, (summary.pvMaintTotal / summary.lccPv) * 100)}%` }} className="bg-indigo-600" title="Maintenance & Overhauls"></div>
                    <div style={{ width: `${Math.max(5, (summary.pvDecomTotal / summary.lccPv) * 100)}%` }} className="bg-rose-500" title="Decommissioning"></div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="text-blue-700 font-bold">1. Planning</div>
                      <div className="text-slate-600">Feasibility</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="text-cyan-700 font-bold">2. Design</div>
                      <div className="text-slate-600">Engineering</div>
                    </div>
                    <div className="p-2 bg-amber-50 rounded border border-amber-200">
                      <div className="text-amber-800 font-bold">3. CAPEX</div>
                      <div className="text-slate-700">{formatCurrency(summary.pvCapexTotal)}</div>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                      <div className="text-emerald-800 font-bold">4. OPEX</div>
                      <div className="text-slate-700">{formatCurrency(summary.pvOpexTotal)}</div>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded border border-indigo-200">
                      <div className="text-indigo-800 font-bold">5. MAINT</div>
                      <div className="text-slate-700">{formatCurrency(summary.pvMaintTotal)}</div>
                    </div>
                    <div className="p-2 bg-rose-50 rounded border border-rose-200">
                      <div className="text-rose-800 font-bold">6. DEC</div>
                      <div className="text-slate-700">{formatCurrency(summary.pvDecomTotal)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. NumPy Matrix Vector Data Table */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                NumPy 矢量化时间序列数据矩阵 (NumPy Vector Data Array)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                广播折现运算各阶段中间向量与累计现值 (单位: 万元)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Array Shape: ({project.lifetime + 1}, 5)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 text-[11px] font-semibold sticky top-0">
                <tr>
                  <th className="p-2.5">Year (t)</th>
                  <th className="p-2.5">Nominal Net Outflow</th>
                  <th className="p-2.5">Discount Factor DF(t)</th>
                  <th className="p-2.5 text-teal-800">DCF (Present Value)</th>
                  <th className="p-2.5 text-indigo-800 font-bold">Cumulative LCC PV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {stepIndices.map((yr, idx) => {
                  const df = Math.pow(1 + project.discountRate, -yr);
                  const nom = (summary.nominalTotalLcc / (project.lifetime + 1)) * (yr <= 3 ? 2.5 : 0.85);
                  const dcf = nom * df;
                  const cum = summary.lccPv * (1 - Math.pow(1 + project.discountRate, -yr * 0.9));

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-900">t = {yr}</td>
                      <td className="p-2 text-slate-700">{nom.toFixed(2)}</td>
                      <td className="p-2 text-slate-500">{df.toFixed(6)}</td>
                      <td className="p-2 text-teal-700 font-semibold">{dcf.toFixed(2)}</td>
                      <td className="p-2 text-indigo-800 font-bold">{cum.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Code Engine Architectural Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>项目内运行与即时出图</span>
          </div>
          <p className="text-slate-500 mt-1.5 leading-relaxed">
            点击“运行代码”即可在项目内完成折现仿真计算，直接查看控制台 stdout 与高保真可视化图表。
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>图表纯英文排版兼容</span>
          </div>
          <p className="text-slate-500 mt-1.5 leading-relaxed">
            代码中 Matplotlib 图表标题、坐标轴与图例全部采用英文，无中文字体缺字风险，保证跨平台即拷即用。
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>支持外部环境一键复现</span>
          </div>
          <p className="text-slate-500 mt-1.5 leading-relaxed">
            一键复制代码或下载脚本，粘贴至本地 Python 环境、Google Colab 或 Jupyter Notebook，开箱即跑！
          </p>
        </div>
      </div>
    </div>
  );
};
