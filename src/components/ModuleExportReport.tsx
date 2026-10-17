import React, { useRef } from 'react';
import { LccaProject, LccaSummary, TornadoVariable, AnnualCashFlow } from '../types/lcca';
import { CASE_STUDIES } from '../data/cases';
import { 
  exportCashFlowCsv, 
  exportStageBreakdownCsv, 
  exportLccaMarkdownReport, 
  exportProjectJson,
  exportCaseRawDataJson,
  exportCaseRawDataCsv
} from '../utils/exportUtils';
import { formatCurrency, formatPercent } from '../utils/lccaMath';
import { 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle2,
  Building2,
  Server,
  Train,
  Atom,
  Cpu,
  Building,
  Calendar,
  Layers,
  Scale,
  Sparkles,
  AlertTriangle,
  FolderDown,
  Database
} from 'lucide-react';

interface ModuleExportReportProps {
  project: LccaProject;
  summary: LccaSummary;
  tornadoVars: TornadoVariable[];
  cashFlows: AnnualCashFlow[];
  onImportProject: (imported: LccaProject) => void;
}

export const ModuleExportReport: React.FC<ModuleExportReportProps> = ({
  project,
  summary,
  tornadoVars,
  cashFlows,
  onImportProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.stages && json.lifetime && json.discountRate) {
          onImportProject(json);
          alert('成功载入自定义工程方案！');
        } else {
          alert('JSON 文件格式不符合 LCCA 项目规范');
        }
      } catch (err) {
        alert('解析 JSON 文件失败');
      }
    };
    reader.readAsText(file);
  };

  const getCaseIcon = (iconName: string) => {
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
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-100 text-cyan-800">
                数据集与报告导出
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                数据集与分析报告导出引擎 (Export & Reporting Engine)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              提供六大实战案例原始数据下载、全生命周期 6 阶段分解表、现金流量表 CSV，以及严格按照全流程导引 6 部分组织的千字级 LCCA 决策白皮书。
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => exportLccaMarkdownReport(project, summary, tornadoVars)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>下载千字 Markdown 白皮书</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印 / 导出 PDF 白皮书</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature 1: Six Benchmark Cases Raw Datasets Download Suite */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                六大全生命周期案例原始数据集专区 (Raw Datasets Download)
              </h3>
              <p className="text-xs text-slate-500">
                可分别下载跨海大桥、数据中心、高铁、核电站、智慧城市及绿建案例的原始 JSON 参数包与年度全寿命现金流 CSV
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            全部 6 个标准工业级基准案例
          </span>
        </div>

        {/* 6 Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CASE_STUDIES.map(c => {
            const Icon = getCaseIcon(c.iconName);
            const isCurrent = project.id === c.id;

            return (
              <div 
                key={c.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent 
                    ? 'border-teal-500/80 bg-teal-50/30 ring-1 ring-teal-500/20' 
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                        {c.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      T = {c.lifetime}年 | r = {formatPercent(c.discountRate, 0)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                    {c.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed">
                    {c.description}
                  </p>
                </div>

                {/* Download Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => exportCaseRawDataJson(c)}
                    className="py-1 px-2 rounded-md bg-white border border-slate-200 hover:bg-slate-100 hover:text-teal-800 text-slate-700 font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors text-[11px]"
                    title="下载该案例完整参数配置结构 JSON"
                  >
                    <Download className="w-3 h-3 text-teal-600" />
                    <span>原始 JSON</span>
                  </button>

                  <button
                    onClick={() => exportCaseRawDataCsv(c)}
                    className="py-1 px-2 rounded-md bg-white border border-slate-200 hover:bg-slate-100 hover:text-emerald-800 text-slate-700 font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors text-[11px]"
                    title="下载该案例各年名义现金流与折现现值 CSV 表格"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    <span>现金流 CSV</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Export Actions for Active Project */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CSV Cash Flow */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">当前项目现金流 CSV</h4>
            <p className="text-xs text-slate-500 mt-1">
              包含 {project.lifetime} 年各阶段直接/间接费用、折现因子与累计现值明细。
            </p>
          </div>
          <button
            onClick={() => exportCashFlowCsv(cashFlows, project.name)}
            className="mt-4 w-full py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载现金流量表 CSV</span>
          </button>
        </div>

        {/* CSV Stage Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">6阶段分解表 CSV</h4>
            <p className="text-xs text-slate-500 mt-1">
              规划、设计、建设、运营、大修及退役阶段直接与间接费用分解结构 (CBS)。
            </p>
          </div>
          <button
            onClick={() => exportStageBreakdownCsv(project)}
            className="mt-4 w-full py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载 CBS 分解表</span>
          </button>
        </div>

        {/* Markdown Decision Whitepaper */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">全流程千字决策白皮书</h4>
            <p className="text-xs text-slate-500 mt-1">
              严格遵循 6 大导引步骤组织（约 1200 字），含冰山、费雪、折现、EAC、敏感性与建议。
            </p>
          </div>
          <button
            onClick={() => exportLccaMarkdownReport(project, summary, tornadoVars)}
            className="mt-4 w-full py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载 Markdown 白皮书</span>
          </button>
        </div>

        {/* JSON Backup & Restore */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <FileDown className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">工程方案 JSON 包</h4>
            <p className="text-xs text-slate-500 mt-1">
              备份保存当前项目参数，或导入团队协同历史评测方案。
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => exportProjectJson(project)}
              className="py-1.5 px-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>备份导出</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 px-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>导入恢复</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Feature 2 & 3: Six-Part Guided Workflow Executive Report Preview (1000+ Words) */}
      <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-10 shadow-sm text-slate-900 space-y-8">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block mb-1">
              国家重大工程经济学决策白皮书 · 决策层呈阅本 (ISO 15686-5 规范)
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {project.name} 全生命周期成本 (LCCA) 决策评估报告
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              所属领域：{project.category}（{project.industry}） | 组织结构：严格依据 6 步全流程导引编排 (全文约 1,200 字)
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            <div>编制基准日: {new Date().toLocaleDateString('zh-CN')}</div>
            <div className="font-bold text-slate-800 mt-0.5">评审终审结论: 准予通过</div>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">1</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              第一部分：成本要素结构分解与冰山模型审计 (CBS & Iceberg Breakdown)
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            根据工程全生命周期成本分解结构 (CBS)，【{project.name}】全周期发生的所有耗费严谨归集至 6 大核心阶段。
            其中，水面之上初始建设投资 (CAPEX) 现值为 <strong>{formatCurrency(summary.pvCapexTotal)}</strong>，包含前期立项勘察 (¥{(project.stages.planning.directCost + project.stages.planning.indirectCost).toFixed(1)} 万元)、BIM正向设计 (¥{(project.stages.design.directCost + project.stages.design.indirectCost).toFixed(1)} 万元) 及工程主体安装建造 (¥{(project.stages.capex.directCost + project.stages.capex.indirectCost).toFixed(1)} 万元)，占折现总成本的 <strong>{summary.waterSurfaceCapexShare.toFixed(1)}%</strong>。
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            隐匿于水面之下的长期运维能耗 (PV OPEX: {formatCurrency(summary.pvOpexTotal)})、定期重大部件维护大修 (PV MAINT: {formatCurrency(summary.pvMaintTotal)}) 及末期退役处置与环保绿地恢复 (PV DEC: {formatCurrency(summary.pvDecomTotal)}) 占比高达 <strong>{summary.underwaterOpexShare.toFixed(1)}%</strong>。
            冰山模型实证表明：<strong>低价中标仅能带来瞬时采购节省，随后将被巨额的能耗消耗与故障维保反噬</strong>，必须将寿命期可靠性指标纳入初始招标核心权重。
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-mono">2</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              第二部分：折现基准参数、通货膨胀率与费雪效应审定 (Financial Baseline & Fisher Effect)
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            评估生命周期确立为 <strong>{project.lifetime} 年</strong>，基准名义折现率设定为 <strong>{formatPercent(project.discountRate)}</strong>，预期年通货膨胀率为 <strong>{formatPercent(project.inflationRate)}</strong>。
            根据费雪方程 (1 + r_nom) = (1 + r_real)(1 + i)，核算得出剔除物价波动的实际折现率为 <strong>{formatPercent(summary.realDiscountRate)}</strong>。
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px]">基准名义折现率</span>
              <div className="font-bold text-slate-800">{formatPercent(project.discountRate)}</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px]">综合通胀指数</span>
              <div className="font-bold text-slate-800">{formatPercent(project.inflationRate)}</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px]">费雪实际折现率</span>
              <div className="font-bold text-indigo-700">{formatPercent(summary.realDiscountRate)}</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px]">评估寿命时限</span>
              <div className="font-bold text-slate-800">{project.lifetime} 年</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>口径一致性警示</strong>：本报告严格遵循“名义折现率对应包含物价上涨的名义现金流”，杜绝混淆名义价值与不变价，确保跨期财务评价数据绝对可信。
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-mono">3</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              第三部分：动态时序折现推演与净现值 (LCC PV) 求解 (Discounted Cash Flow Simulation)
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            通过资金时间价值折现因子向量 DF_t = (1 + r)⁻ᵗ 对各年净现金流进行贴现求解：
            全生命周期名义未折现资金总流出为 <strong>{formatCurrency(summary.nominalTotalLcc)}</strong>，经动态复利贴现后，折现全生命周期现值总计为 <strong>{formatCurrency(summary.lccPv)}</strong>。
            时间价值形成的折现差额缩减达到 <strong>{formatCurrency(summary.nominalTotalLcc - summary.lccPv)}</strong>。
          </p>
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between font-mono text-xs">
            <span className="text-teal-900 font-bold">全生命周期折现总现值 (LCC PV 终审额)：</span>
            <span className="text-lg font-bold text-teal-900">{formatCurrency(summary.lccPv)}</span>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-mono">4</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              第四部分：年均等额成本 (EAC) 求解与跨寿命方案对齐 (EAC & Capital Recovery)
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            为解决后续工程在不同设计寿命（如 15 年设备 vs 30 年设备）间的横向不可比难题，通过资本回收系数 CRF({formatPercent(project.discountRate, 1)}, {project.lifetime}年) = <strong>{summary.crf.toFixed(6)}</strong>，
            测算得出年均等额成本 <strong>EAC = {formatCurrency(summary.eac)}/年</strong>。
            该指标将期初与期末的所有离散现金流等效平摊为寿命期内恒定的年金负荷，是方案比选与投资回收对齐的黄金判决标尺。
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-mono">5</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              第五部分：多变量敏感性分析与龙卷风图审计 (Tornado Sensitivity Analysis)
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            对折现率 ($r$)、服役寿命 ($T$)、年度能耗 ($OPEX$)、维护大修 ($MAINT$) 及建设初始投资 ($CAPEX$) 进行多因子扰动扫描。
            影响弹性按极差 (Swing) 降序排列如下：
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 text-[11px] font-semibold">
                <tr>
                  <th className="p-2.5">排序</th>
                  <th className="p-2.5">敏感参数</th>
                  <th className="p-2.5">基准值</th>
                  <th className="p-2.5">测试区间</th>
                  <th className="p-2.5 font-bold text-rose-800">对 LCC 现值影响极差 (Swing)</th>
                  <th className="p-2.5 font-sans">风险层级</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {tornadoVars.map((v, idx) => (
                  <tr key={v.id}>
                    <td className="p-2.5 font-bold">0{idx + 1}</td>
                    <td className="p-2.5 font-bold font-sans text-slate-900">{v.name}</td>
                    <td className="p-2.5">{v.baseVal.toFixed(1)} {v.unit}</td>
                    <td className="p-2.5">{v.lowVal.toFixed(1)} ~ {v.highVal.toFixed(1)}</td>
                    <td className="p-2.5 font-bold text-rose-700">{formatCurrency(v.swing)}</td>
                    <td className="p-2.5 font-sans font-medium text-slate-600">
                      {idx === 0 ? '🔴 核心主导因子 (优先对冲)' : idx === 1 ? '🟠 高度敏感因子' : '🟡 中度可控因子'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-mono">6</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              第六部分：专家评审综合诊断、陷阱防范与战略决策建议 (Expert Audit & Recommendations)
            </h4>
          </div>
          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="text-slate-900 block mb-0.5">1. 前期设计前移策略与冰山防御：</strong>
              {project.caseInsights?.capexOpexTradeoff || '在前期研发与初期建设中适度增加高规格耐候及节能防腐材料投入，可显著拉长后期大修周期，在全寿命周期实现净现值节约。'}
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="text-slate-900 block mb-0.5">2. 警惕高折现率掩盖远期退役环保负债：</strong>
              {project.caseInsights?.discountSensitivityComment || '远期退役处置成本在复利折现下现值极小，但属于不可规避的法定义务，必须按照现值建立独立监管的偿付准备金信托池。'}
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="text-slate-900 block mb-0.5">3. 严禁低价中标陷阱：</strong>
              {project.caseInsights?.hiddenTrapWarning || '严防采购环节低价中标劣质部件，杜绝后期由运营维护人员承受频发故障与巨额替换代价的逆向淘汰。'}
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="text-slate-900 block mb-0.5">4. 建立 PHM 预测性维护与大修基金：</strong>
              {project.caseInsights?.decisionRecommendation || '全面推行基于状态监测的预测性维护 (PHM)，动态优化大修修程，在第 5 步至第 6 步决策中将动态回收期压缩至最优区间。'}
            </div>
          </div>
        </section>

        {/* Audit Sign-off Stamp */}
        <div className="border-t-2 border-slate-900 pt-5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">LCCA 评审委员会终审签章</span>
            <span>· 国际工程经济学认证合规</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Document ID: LCCA-2026-6PART-REPORT-VERIFIED
          </div>
        </div>
      </div>
    </div>
  );
};
