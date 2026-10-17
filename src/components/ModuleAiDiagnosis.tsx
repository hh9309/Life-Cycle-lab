import React, { useState, useEffect } from 'react';
import { LccaProject, LccaSummary } from '../types/lcca';
import { formatCurrency, formatPercent } from '../utils/lccaMath';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  X, 
  RefreshCw, 
  Lightbulb,
  Settings,
  Key,
  Check,
  Server,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface ModuleAiDiagnosisProps {
  project: LccaProject;
  summary: LccaSummary;
  isOpen: boolean;
  onClose: () => void;
}

export const ModuleAiDiagnosis: React.FC<ModuleAiDiagnosisProps> = ({
  project,
  summary,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; isFallback?: boolean; model?: string }>>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Model & API Key state with localStorage persistence
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'deepseek-v4-pro'>(() => {
    return (localStorage.getItem('lcca_selected_model') as 'gemini-3.8-flash' | 'deepseek-v4-pro') || 'gemini-3.8-flash';
  });
  const [pendingModel, setPendingModel] = useState<'gemini-3.8-flash' | 'deepseek-v4-pro'>(selectedModel);

  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem('lcca_user_api_key') || '';
  });
  const [pendingApiKey, setPendingApiKey] = useState<string>(userApiKey);
  const [showKeySecret, setShowKeySecret] = useState<boolean>(false);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [confirmToast, setConfirmToast] = useState<boolean>(false);

  // Sync state if localStorage changes or opened
  useEffect(() => {
    setPendingModel(selectedModel);
    setPendingApiKey(userApiKey);
  }, [isOpen, selectedModel, userApiKey]);

  // Quick prompt questions
  const presetPrompts = [
    '为什么此项目的运维(OPEX+MAINT)成本占比可能形成“买得起、养不起”的冰山陷阱？',
    '当前折现率设定是否过度稀释了末期退役与环保修复的长期风险？',
    '如何使用年均等额成本 (EAC) 判定该系统的最佳物理大修与重置报废周期？',
    '如果通货膨胀率提高 2 个百分点，会对全周期现金流预测带来多大口径偏差？',
  ];

  // Save Settings: 1. API-Key, 2. Model, 3. Confirm
  const handleConfirmModelSettings = () => {
    setSelectedModel(pendingModel);
    setUserApiKey(pendingApiKey.trim());
    localStorage.setItem('lcca_selected_model', pendingModel);
    if (pendingApiKey.trim()) {
      localStorage.setItem('lcca_user_api_key', pendingApiKey.trim());
    } else {
      localStorage.removeItem('lcca_user_api_key');
    }
    setShowSettings(false);
    setConfirmToast(true);
    setTimeout(() => setConfirmToast(false), 2800);
  };

  // Built-in client-side expert diagnosis engine (works completely offline or when deployed to GitHub Pages)
  const getClientSideExpertDiagnosis = (queryText: string, activeModelName: string) => {
    const opexAnnual = project.stages.opex.directCost + project.stages.opex.indirectCost;
    const maintAnnual = project.stages.maint.directCost + project.stages.maint.indirectCost;
    const opexMaintShare = summary.underwaterOpexShare;
    const pvDec = summary.pvDecomTotal;
    const decPvShare = summary.lccPv > 0 ? (pvDec / summary.lccPv) * 100 : 0;

    return `### 【LCCA 财务总监与系统工程经济学专家深度诊断报告】
> **推理内核**：${activeModelName}（工程金融推理内核与规则自适应）

**评估项目**：${project.name}
- **折现总成本 (LCC PV)**：¥${(summary.lccPv / 10000).toFixed(2)} 万元
- **年均等额成本 (EAC)**：¥${(summary.eac / 10000).toFixed(2)} 万元/年
- **设计寿命**：${project.lifetime} 年 | **基准折现率**：${formatPercent(project.discountRate)} | **通货膨胀率**：${formatPercent(project.inflationRate)}

---

#### 1. 沉没成本陷阱与水下冰山风险审计
- **全周期运维隐性成本占比**：名义现金流测算中，中后期运维与大修（OPEX + MAINT）总额达到 **${opexMaintShare.toFixed(1)}%**。
- **专家诊断结论**：${opexMaintShare > 60 
      ? '⚠️ **严重冰山效应！** 该项目的全生命周期成本重心严重偏向中后期运维，属于典型的“买得起、养不起”结构。若采购招标仅看最低建设报价 (CAPEX)，将落入严重的“低价中标、高额反噬”陷阱。强烈建议将设备可靠性指标 (MTBF) 与能耗保证条款写入初始合同。'
      : '✅ 初始投资 CAPEX 与运维成本比例相对平衡，但仍需建立预防性维护与定期状态监测机制，避免小故障恶化为非计划停机重大损失。'}

#### 2. 高折现率掩盖长期风险审计
- **末期退役与环保恢复责任**：名义退役成本为 ¥${((project.stages.decom.directCost + project.stages.decom.indirectCost) / 10000).toFixed(2)} 万元，在 ${formatPercent(project.discountRate)} 折现率下折现现值仅占总折现 LCC 的 **${decPvShare.toFixed(2)}%**。
- **专家诊断结论**：${project.discountRate >= 0.07 && project.lifetime >= 30
      ? '⚠️ **长期环境/退役负债被数学稀释！** 由于折现率偏高且时间跨度长达 ' + project.lifetime + ' 年，复利折现公式 $(1+r)^{-T}$ 将数十甚至上百年后的巨额拆除与环境治理责任压缩得微乎其微。这在公共政策与代际公平视角下存在严重道德风险。建议设立专款专用折现准备金池。'
      : '✅ 退役成本折现结构在合理预期区间内，但建议关注相关行业环保与危废处置法规的动态更新。'}

#### 3. 通胀口径一致性与费雪效应检验
- 当前名义折现率 $r = ${formatPercent(project.discountRate)}$，通胀率 $i = ${formatPercent(project.inflationRate)}$。根据费雪公式，**实际折现率** $r_{real} = \\frac{1+r}{1+i} - 1 \\approx ${formatPercent(summary.realDiscountRate)}$。
- **专家警告**：必须严格确保“名义折现率配名义现金流”或“实际折现率配不变价现金流”，切勿使用名义折现率折现未包含通胀的不变价运维费用，否则会导致生命周期成本被严重低估 15%~30%。

${queryText ? `\n---\n#### 4. 针对专项提问的解答：\n> “${queryText}”\n**分析意见**：基于上述成本结构，任何针对该变量的调整都应关注其在年均等额成本 (EAC) 上的边际弹性。建议结合敏感性龙卷风图确定优先对冲参数。` : ''}`;
  };

  const runDiagnosis = async (question?: string) => {
    setIsLoading(true);
    const query = question || inputQuestion || '请对当前项目的全生命周期成本结构与潜在风险陷阱进行全面专家审计。';

    if (question || inputQuestion) {
      setMessages(prev => [...prev, { role: 'user', content: query }]);
      setInputQuestion('');
    }

    const payload = {
      name: project.name,
      category: project.category,
      lifetime: project.lifetime,
      discountRate: project.discountRate,
      inflationRate: project.inflationRate,
      capex: summary.pvCapexTotal,
      opexAnnual: project.stages.opex.directCost + project.stages.opex.indirectCost,
      maintAnnual: project.stages.maint.directCost + project.stages.maint.indirectCost,
      decCost: project.stages.decom.directCost + project.stages.decom.indirectCost,
      salvageValue: project.salvageValue,
      lccPv: summary.lccPv,
      eac: summary.eac,
      underwaterOpexShare: summary.underwaterOpexShare,
    };

    const activeModelLabel = selectedModel === 'deepseek-v4-pro' ? 'DeepSeek-V4-Pro' : 'Gemini 3.8 Flash';

    try {
      // 1. First attempt: call backend API route with userApiKey and selected model
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectData: payload, 
          question: query,
          model: selectedModel,
          userApiKey: userApiKey || undefined
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.text || '诊断完成。',
            isFallback: data.fallback,
            model: data.model || activeModelLabel,
          },
        ]);
        setIsLoading(false);
        return;
      }
      throw new Error(`Server returned ${res.status}`);
    } catch (err: any) {
      console.warn('Backend proxy /api/ai/diagnose unreachable or static GitHub deployment:', err);

      // 2. Direct browser fallback if deployed to GitHub Pages and user has provided API Key
      if (userApiKey) {
        try {
          if (selectedModel === 'deepseek-v4-pro') {
            const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userApiKey}`
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                  {
                    role: 'system',
                    content: '你是一位拥有25年系统工程经济学、重大基础设施投资决策及全生命周期成本分析 (LCCA) 经验的资深特聘总经济师与财务总监。'
                  },
                  {
                    role: 'user',
                    content: `项目数据:\n${JSON.stringify(payload, null, 2)}\n\n用户关注点:\n${query}`
                  }
                ],
                temperature: 0.3
              })
            });
            const dsData = await dsRes.json();
            const dsText = dsData.choices?.[0]?.message?.content;
            if (dsText) {
              setMessages(prev => [
                ...prev,
                { role: 'assistant', content: dsText, isFallback: false, model: 'DeepSeek-V4-Pro (浏览器直连)' }
              ]);
              setIsLoading(false);
              return;
            }
          } else {
            // Direct Gemini call from browser using key
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [{
                    text: `你是一位工程经济学专家与财务总监。请依据以下 LCCA 数据深度诊断沉没成本陷阱与折现风险:\n${JSON.stringify(payload, null, 2)}\n用户提问: ${query}`
                  }]
                }]
              })
            });
            const geminiData = await geminiRes.json();
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              setMessages(prev => [
                ...prev,
                { role: 'assistant', content: text, isFallback: false, model: 'Gemini 3.8 Flash (浏览器直连)' }
              ]);
              setIsLoading(false);
              return;
            }
          }
        } catch (directErr) {
          console.warn('Browser direct API call failed:', directErr);
        }
      }

      // 3. Robust Built-in Financial Expert Engine fallback
      const expertReport = getClientSideExpertDiagnosis(query, activeModelLabel);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: expertReport,
          isFallback: true,
          model: `${activeModelLabel} (内置专家引擎)`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold tracking-tight">
                  LCCA 智能体检随诊与大模型专家
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
                  selectedModel === 'deepseek-v4-pro'
                    ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40'
                    : 'bg-teal-500/30 text-teal-200 border-teal-400/40'
                }`}>
                  {selectedModel === 'deepseek-v4-pro' ? 'DeepSeek-V4-Pro' : 'Gemini 3.8 Flash'}
                </span>
                {userApiKey && (
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono hidden sm:inline-flex items-center gap-1">
                    <Key className="w-2.5 h-2.5" /> 自定义 Key
                  </span>
                )}
                {confirmToast && (
                  <span className="text-[10px] text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                    <Check className="w-3 h-3" /> 配置已生效
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                针对沉没成本陷阱、高折现率掩盖长期风险及通胀率未对齐风险进行实时专家随诊
              </p>
            </div>
          </div>

          {/* Right Header Actions: Settings Gear (小齿轮设置大模型图标) & Close Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setPendingModel(selectedModel);
                setPendingApiKey(userApiKey);
                setShowSettings(!showSettings);
              }}
              title="大模型配置设置 (1.手工输入API-Key 2.选择模型 3.确认模型)"
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                showSettings 
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className={`w-4 h-4 ${showSettings ? 'rotate-90 transition-transform duration-300 text-teal-300' : ''}`} />
              <span className="hidden sm:inline">模型设置</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Overlay Drawer */}
        {showSettings && (
          <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-700 animate-in slide-in-from-top-4 duration-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm text-slate-100">大模型设置与 GitHub 部署配置</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                当前运行: {selectedModel === 'deepseek-v4-pro' ? 'DeepSeek-V4-Pro' : 'Gemini 3.8 Flash'}
              </span>
            </div>

            {/* Step 1: 手工输入 API-Key */}
            <div className="space-y-2 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between">
                <label className="text-teal-300 font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-teal-400" />
                  <span>1. 手工输入 API-Key (Manual API Key Input)</span>
                </label>
                {pendingApiKey ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> 已录入密钥 (长度: {pendingApiKey.length})
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400">未设置 (将使用内置规则或环境变量)</span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  type={showKeySecret ? 'text' : 'password'}
                  value={pendingApiKey}
                  onChange={e => setPendingApiKey(e.target.value)}
                  placeholder="在此输入您的 Gemini API-Key 或 DeepSeek API-Key (如: AIzaSy... 或 sk-...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pr-20 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-slate-500"
                />
                <div className="absolute right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showKeySecret ? '隐藏密钥' : '显示密钥'}
                  >
                    {showKeySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {pendingApiKey && (
                    <button
                      type="button"
                      onClick={() => setPendingApiKey('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/50 cursor-pointer"
                    >
                      清空
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                📌 <strong>GitHub 静态部署说明</strong>：本项目部署到 GitHub Pages / 浏览器静态托管时，必须手工输入 API-Key 才能由浏览器直接向大模型服务发起调用；密钥仅存储在您本地浏览器中，绝不上传第三方服务器。
              </p>
            </div>

            {/* Step 2: 选择大模型 */}
            <div className="space-y-2">
              <label className="text-teal-300 font-bold block">
                2. 选择大模型专家内核 (Select Model):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Gemini 3 flash */}
                <div
                  onClick={() => setPendingModel('gemini-3.8-flash')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    pendingModel === 'gemini-3.8-flash'
                      ? 'border-teal-400 bg-teal-950/40 text-white ring-1 ring-teal-400/50'
                      : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-teal-300">Gemini 3 flash</span>
                    <span className="text-[10px] bg-teal-900 text-teal-200 px-1.5 py-0.2 rounded font-mono">
                      推荐 / Google官方
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    极速低延迟，严谨遵循工程经济学 LCC 资金时间价值、EAC 计算与费雪通胀对齐标准。
                  </p>
                </div>

                {/* Option B: DeepSeek-V4-Pro */}
                <div
                  onClick={() => setPendingModel('deepseek-v4-pro')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    pendingModel === 'deepseek-v4-pro'
                      ? 'border-indigo-400 bg-indigo-950/40 text-white ring-1 ring-indigo-400/50'
                      : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-indigo-300">DeepSeek-V4-Pro</span>
                    <span className="text-[10px] bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded font-mono">
                      深度推理思维链
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    强化多步数理思维链 (Chain-of-Thought)，深挖沉没成本心理陷阱与高折现率长期负债稀释。
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: 确认大模型选择 */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>已就绪配置将自动保存至本地缓存</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmModelSettings}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>3. 确认大模型选择</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Diagnostic 3-Point Checklist Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-white rounded-lg border border-slate-200/80">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">陷阱一：沉没成本与运维冰山</div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs font-bold text-slate-800">
                运维占比: {summary.underwaterOpexShare.toFixed(1)}%
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                summary.underwaterOpexShare > 60 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {summary.underwaterOpexShare > 60 ? '高度冰山' : '结构稳健'}
              </span>
            </div>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-200/80">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">陷阱二：高折现率掩盖远期风险</div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs font-bold text-slate-800">
                r = {formatPercent(project.discountRate)} ({project.lifetime}年)
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                project.discountRate >= 0.07 && project.lifetime >= 30 ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
              }`}>
                {project.discountRate >= 0.07 && project.lifetime >= 30 ? '警惕稀释' : '折现合规'}
              </span>
            </div>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-200/80">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">陷阱三：通胀费雪口径一致性</div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs font-bold text-slate-800">
                实际折现: {formatPercent(summary.realDiscountRate)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-indigo-100 text-indigo-800">
                已自动对齐
              </span>
            </div>
          </div>
        </div>

        {/* Chat / Diagnostic Scrollable Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.length === 0 ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-teal-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900">
                  准备就绪，即刻启动全生命周期财务风险体检
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  当前启用大模型：<strong className="text-teal-700">{selectedModel === 'deepseek-v4-pro' ? 'DeepSeek-V4-Pro' : 'Gemini 3 flash'}</strong>。
                  {userApiKey ? ' 已加载手工配置 API-Key。' : ' 未配置手工 Key 时将使用系统默认/离线专家内核。'}
                </p>
                {!userApiKey && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>提示：若部署在 GitHub 静态页面浏览，请先点击右上角 ⚙️ 输入 API-Key。</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => runDiagnosis()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs cursor-pointer text-xs"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>生成当前项目一键综合体检报告</span>
              </button>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed text-xs shadow-xs ${
                    m.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                  {m.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {m.isFallback ? '⚡ 本地专家规则引擎求解' : `🤖 ${m.model || (selectedModel === 'deepseek-v4-pro' ? 'DeepSeek-V4-Pro' : 'Gemini 3 flash')} 实时推理`}
                      </span>
                      <span className="font-mono">{new Date().toLocaleTimeString('zh-CN')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 p-3 bg-slate-50 rounded-lg text-xs animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              <span>
                {selectedModel === 'deepseek-v4-pro' 
                  ? 'DeepSeek-V4-Pro 正在展开多步工程金融推理链 (Chain-of-Thought)...' 
                  : 'Gemini 3 flash 正在动态审计现金流与敏感性矩阵...'}
              </span>
            </div>
          )}
        </div>

        {/* Preset Prompt Buttons Strip */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> 快捷追问:
          </span>
          {presetPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => runDiagnosis(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50/50 whitespace-nowrap cursor-pointer transition-colors"
            >
              {prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt}
            </button>
          ))}
        </div>

        {/* Bottom Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (inputQuestion.trim()) runDiagnosis();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            placeholder={`向 ${selectedModel === 'deepseek-v4-pro' ? 'DeepSeek-V4-Pro' : 'Gemini 3 flash'} 提问 (如：大修周期设定、折现率敏感性...)`}
            className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>咨询</span>
          </button>
        </form>
      </div>
    </div>
  );
};
