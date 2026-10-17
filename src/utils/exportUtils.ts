import { LccaProject, AnnualCashFlow, LccaSummary, TornadoVariable } from '../types/lcca';
import { formatCurrency, formatPercent, calculateAnnualCashFlows, calculateLccaSummary, calculateTornadoVariables } from './lccaMath';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports complete annual cash flows to CSV format (UTF-8 with BOM for Excel compatibility)
 */
export function exportCashFlowCsv(cashFlows: AnnualCashFlow[], projectName: string) {
  const headers = [
    '年度 (Year)',
    '规划立项 (万元)',
    '方案设计 (万元)',
    '工程施工CAPEX (万元)',
    '日常运营OPEX (万元)',
    '维护大修MAINT (万元)',
    '退役处置DEC (万元)',
    '期末残值回收 (万元)',
    '年度净名义支出 (万元)',
    '折现因子 DF_t',
    '折现后净现值 (万元)',
    '累计生命周期现值 (万元)',
  ];

  const rows = cashFlows.map(r => [
    `第${r.year}年`,
    r.planning.toFixed(2),
    r.design.toFixed(2),
    r.capex.toFixed(2),
    r.opex.toFixed(2),
    r.maint.toFixed(2),
    r.decom.toFixed(2),
    r.salvage.toFixed(2),
    r.totalNominal.toFixed(2),
    r.discountFactor.toFixed(6),
    r.discountedCashFlow.toFixed(2),
    r.cumulativeLccPv.toFixed(2),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const safeName = projectName.replace(/[\/\\:*?"<>|]/g, '_');
  downloadFile(csvContent, `LCCA_现金流量表_${safeName}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports CBS Stage Cost Breakdown to CSV
 */
export function exportStageBreakdownCsv(project: LccaProject) {
  const headers = ['阶段代码', '阶段名称', '阶段英文', '起始年', '结束年', '直接成本 (万元)', '间接/管理费 (万元)', '阶段名义总额 (万元)', '阶段说明'];
  const stageList = Object.values(project.stages);
  
  const rows = stageList.map(s => {
    const total = s.directCost + s.indirectCost;
    return [
      s.id,
      `"${s.name}"`,
      `"${s.nameEn}"`,
      s.startYear,
      s.endYear,
      s.directCost.toFixed(2),
      s.indirectCost.toFixed(2),
      total.toFixed(2),
      `"${s.description.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const safeName = project.name.replace(/[\/\\:*?"<>|]/g, '_');
  downloadFile(csvContent, `LCCA_阶段成本分解表_${safeName}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports single benchmark case raw JSON dataset
 */
export function exportCaseRawDataJson(caseProject: LccaProject) {
  const json = JSON.stringify(caseProject, null, 2);
  const safeName = caseProject.name.replace(/[\/\\:*?"<>|]/g, '_');
  downloadFile(json, `LCCA_案例原始数据集_${safeName}.json`, 'application/json');
}

/**
 * Exports single benchmark case cash flow CSV dataset
 */
export function exportCaseRawDataCsv(caseProject: LccaProject) {
  const flows = calculateAnnualCashFlows(caseProject);
  exportCashFlowCsv(flows, `${caseProject.name}_原始现金流`);
}

/**
 * Generates an executive-grade Markdown Decision Audit Whitepaper structured strictly
 * into 6 distinct parts following the guided workflow (1000+ Chinese characters).
 */
export function exportLccaMarkdownReport(
  project: LccaProject,
  summary: LccaSummary,
  tornadoVars: TornadoVariable[]
) {
  const md = `# 【工程经济学】${project.name} 全生命周期成本 (LCCA) 决策评估白皮书

**评估工程标的**：${project.name}  
**所属专业领域**：${project.category}（${project.industry}）  
**评估基准日期**：${new Date().toLocaleDateString('zh-CN')}  
**国际执行规范**：ISO 15686-5 / IEEE Engineering Economics LCC Standard  
**报告组织架构**：按照全生命周期成本全流程导引严格划分为 6 大核心审计部分（字数规模约 1200 字）

---

### 第一部分：成本要素结构分解与冰山模型审计 (CBS & Iceberg Breakdown)

根据系统工程全生命周期工作分解结构 (CBS)，本项目全周期各阶段成本细分为直接工程支出与间接管理支撑两大部分：
1. **前期规划立项阶段**：名义支出为 ¥${(project.stages.planning.directCost + project.stages.planning.indirectCost).toFixed(2)} 万元（占建设期前期约 3%），包含海洋地质勘探、环境生态红线影响评价及国家宏观核准。
2. **深化方案设计阶段**：名义支出为 ¥${(project.stages.design.directCost + project.stages.design.indirectCost).toFixed(2)} 万元，负责全生命周期数字化 BIM 正向协同建模与抗震抗疲劳结构冗余校核。
3. **施工建造安装阶段 (CAPEX)**：初始工程建设一次性投资为 ¥${(project.stages.capex.directCost + project.stages.capex.indirectCost).toFixed(2)} 万元，折现现值为 **${formatCurrency(summary.pvCapexTotal)}**。
4. **日常运营能耗阶段 (OPEX)**：年均基准常态运营耗费 ¥${(project.stages.opex.directCost + project.stages.opex.indirectCost).toFixed(2)} 万元/年（按 ${( (project.stages.opex.annualGrowthRate || 0) * 100 ).toFixed(1)}% 年递增），全周期折现现值累计达 **${formatCurrency(summary.pvOpexTotal)}**。
5. **定期中大修与翻新阶段 (MAINT)**：年均分摊维保资金 ¥${(project.stages.maint.directCost + project.stages.maint.indirectCost).toFixed(2)} 万元/年，全周期大修折现现值达 **${formatCurrency(summary.pvMaintTotal)}**。
6. **期末退役与环保修复阶段 (DEC)**：期末终止服役清算支出 ¥${(project.stages.decom.directCost + project.stages.decom.indirectCost).toFixed(2)} 万元，扣除期末残值回收抵扣后折现现值为 **${formatCurrency(summary.pvDecomTotal - summary.pvSalvageTotal)}**。

> **冰山模型审计结论**：本项目水面之上初始建设投资 (CAPEX) 现值占比为 **${summary.waterSurfaceCapexShare.toFixed(1)}%**；隐匿于水面之下的长期运维、能耗、大修及环保退役支出占比高达 **${summary.underwaterOpexShare.toFixed(1)}%**。这表明系统属于典型的“运维重载型系统”，决不可单凭最低竞标价格做定标裁决。

---

### 第二部分：折现基准参数、通货膨胀率与费雪效应审定 (Financial Baseline & Fisher Effect)

资金时间价值是衡量跨期多年度现金流的度量衡基准，本案设定核心宏观参数如下：
- **评估生命周期 ($T$)**：**${project.lifetime} 年**，涵盖系统物理服役、经济服役与环保终结全过程。
- **名义基准折现率 ($r_{nom}$)**：**${formatPercent(project.discountRate)}**，综合反映项目加权平均资本成本 (WACC) 与公共投资机会成本。
- **预期年通货膨胀率 ($i$)**：**${formatPercent(project.inflationRate)}**，基于生产要素与人工价格指数历史复合回归。
- **费雪效应实际折现率 ($r_{real}$)**：根据费雪方程 $(1 + r_{nom}) = (1 + r_{real})(1 + i)$，计算得出剔除通胀干扰的实际购买力折现率为 **${formatPercent(summary.realDiscountRate)}**。

> **参数合规审计**：在长达 ${project.lifetime} 年的周期内，必须严谨确保现金流口径与折现率口径的一致性。严禁使用名义折现率直接折现不含物价上涨的不变价费用，避免产生 15%~30% 的系统性低估。

---

### 第三部分：动态时序折现推演与净现值 (LCC PV) 求解 (Discounted Cash Flow Simulation)

通过折现因子向量 $DF_t = (1 + r)^{-t}$ 对第 $0$ 年至第 $T$ 年的净名义支出逐年进行离散卷积贴现运算：
- **名义未折现全周期总支出账面和**：**${formatCurrency(summary.nominalTotalLcc)}**（未经资金时间价值折算的简单会计算术和，仅作为名义资金总预算参考）。
- **全生命周期成本折现净现值 (LCC PV)**：
  $$LCC_{PV} = CAPEX + \\sum_{t=1}^T \\frac{OPEX_t + MAINT_t}{(1+r)^t} + \\frac{DEC - S}{(1+r)^T} = \\mathbf{${formatCurrency(summary.lccPv)}}$$
- **资金时间价值折现缩减额**：由于货币时间价值随年份指数级衰减，远期支出折现到第 0 年产生的资金时间价值差额为 **${formatCurrency(summary.nominalTotalLcc - summary.lccPv)}**。

---

### 第四部分：年均等额成本 (EAC) 求解与跨寿命方案对齐 (EAC & Capital Recovery)

由于不同技术路线或备选设备的使用寿命往往不对称，直接比对总现值 (LCC PV) 在工程经济学上存在逻辑缺陷。本案引入资本回收系数 (CRF) 求解等额年金：
- **资本回收系数 (CRF)**：
  $$CRF(r, T) = \\frac{r(1+r)^T}{(1+r)^T - 1} = \\mathbf{${summary.crf.toFixed(6)}}$$
- **年均等额成本 (EAC)**：
  $$EAC = LCC_{PV} \\times CRF(r, T) = \\mathbf{${formatCurrency(summary.eac)}/年}$$

> **方案横向对齐原则**：在未来多方案比选（如引入 15 年设备与 30 年设备竞标）时，应统一以每年等额需承担的 EAC 指标作为经济性优劣的黄金判据，实现全周期投资效率的客观对齐。

---

### 第五部分：多变量敏感性分析与龙卷风图审计 (Tornado Sensitivity Analysis)

对影响项目经济性现值的 5 项核心参数在指定波动区间进行单因素扰动扫描，按对 LCC PV 的极差 (Swing) 降序排列如下：

| 排名 | 风险敏感变量 | 基础设定值 | 敏感测试波动区间 | 对 LCC PV 影响极差 (Swing) | 风险等级与属性 |
| :---: | :--- | :--- | :--- | :--- | :---: |
${tornadoVars.map((v, idx) => `| 第${idx + 1}位 | **${v.name}** | ${v.baseVal.toFixed(1)} ${v.unit} | ${v.lowVal.toFixed(1)} ~ ${v.highVal.toFixed(1)} ${v.unit} | **${formatCurrency(v.swing)}** | ${idx === 0 ? '🔴 极高 (主导风险因子)' : idx === 1 ? '🟠 高度敏感因子' : '🟡 中度敏感因子'} |`).join('\n')}

> **敏感性特征解析**：敏感度排序第一位的 **${tornadoVars[0]?.name || '关键变量'}** 对总成本现值具备杠杆控制作用。若出现不利波动，将吞噬整个项目的预期内部收益率。折现率曲线呈现强烈的凸性 (Convexity) 特征，低折现率区间斜率尤为陡峭。

---

### 第六部分：专家评审综合诊断、陷阱防范与战略决策建议 (Expert Audit & Recommendations)

综合前述五步量化测算结果，专家评审委员会提出以下 4 条关键决策意见：
1. **前移设计阶段可靠性投资，破解沉没成本陷阱**：
   ${project.caseInsights?.capexOpexTradeoff || '在前期研发与初期建设中适度增加高规格耐候及节能防腐材料投入，可显著拉长后期大修周期，在全寿命周期实现净现值节约。'}
2. **严防高折现率掩盖远期环境生态治理责任**：
   ${project.caseInsights?.discountSensitivityComment || '远期退役处置成本在复利折现下现值极小，但属于不可规避的法定义务，必须按照现值建立独立监管的偿付准备金信托池。'}
3. **破除低价中标盲区，建立全寿命责任追溯**：
   ${project.caseInsights?.hiddenTrapWarning || '严防采购环节低价中标劣质部件，杜绝后期由运营维护人员承受频发故障与巨额替换代价的逆向淘汰。'}
4. **全生命周期制度落地与持续状态监控**：
   ${project.caseInsights?.decisionRecommendation || '全面推行基于状态监测的预测性维护 (PHM)，动态优化大修修程，在第 5 步至第 6 步决策中将动态回收期压缩至最优区间。'}

---
*编制单位：系统全生命周期成本实验室 (LCCA Lab) 专家评审委员会 · 符合 ISO 15686-5 国际标准*
`;

  const safeName = project.name.replace(/[\/\\:*?"<>|]/g, '_');
  downloadFile(md, `LCCA_全流程决策白皮书_${safeName}.md`, 'text/markdown;charset=utf-8;');
}

/**
 * Exports raw project JSON for backup/restore
 */
export function exportProjectJson(project: LccaProject) {
  const json = JSON.stringify(project, null, 2);
  const safeName = project.name.replace(/[\/\\:*?"<>|]/g, '_');
  downloadFile(json, `LCCA_项目配置方案_${safeName}.json`, 'application/json');
}
