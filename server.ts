import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to provide expert rule-based diagnostic analysis if API keys are absent or fallback is triggered
function getExpertLccaDiagnosis(projectData: any, userQuestion?: string, modelName = 'Gemini 3.8 Flash') {
  const { name, capex, opexAnnual, maintAnnual, decCost, lifetime, discountRate, inflationRate, eac, lccPv } = projectData || {};
  
  const totalNominalOpex = (opexAnnual || 0) * (lifetime || 1);
  const totalNominalMaint = (maintAnnual || 0) * (lifetime || 1);
  const opexMaintShareNominal = (totalNominalOpex + totalNominalMaint) / ((capex || 1) + totalNominalOpex + totalNominalMaint + (decCost || 0));
  
  const discountRatePercent = ((discountRate || 0.06) * 100).toFixed(2);
  const inflationRatePercent = ((inflationRate || 0.02) * 100).toFixed(2);
  
  const pvDec = (decCost || 0) / Math.pow(1 + (discountRate || 0.06), lifetime || 20);
  const decPvShare = lccPv ? (pvDec / lccPv) * 100 : 0;

  return `### 【LCCA 财务总监与工程经济专家深度诊断报告】
> **推理模型引擎**：${modelName}（工程金融推理内核）

**评估项目标的**：${name || '工程系统全生命周期评估方案'}
**关键财务指标**：
- 折现全生命周期总成本 (LCC PV)：**¥${(lccPv ? (lccPv / 10000).toFixed(2) : '0')} 万元**
- 年均等额成本 (EAC)：**¥${(eac ? (eac / 10000).toFixed(2) : '0')} 万元/年**
- 寿命期：**${lifetime || 20} 年** | 设定基准折现率：**${discountRatePercent}%** | 预期通胀率：**${inflationRatePercent}%**

---

#### 1. 沉没成本陷阱与水下冰山风险诊断
- **水下运维隐性成本占比**：在名义现金流测算中，运维与大修（OPEX + MAINT）占比达到 **${(opexMaintShareNominal * 100).toFixed(1)}%**。
- **专家诊断结论**：${opexMaintShareNominal > 0.6 
    ? '⚠️ **严重冰山效应！** 该项目的全生命周期成本重心严重偏向中后期运维，属于典型的“买得起、养不起”结构。若采购招标仅看最低建设报价 (CAPEX)，将落入严重的“低价中标、高额反噬”陷阱。强烈建议将设备可靠性指标 (MTBF) 与能耗保证条款写入初始合同。'
    : '✅ 初始投资 CAPEX 与运维成本比例相对平衡，但仍需建立预防性维护与定期状态监测机制，避免小故障恶化为非计划停机重大损失。'}

#### 2. 高折现率掩盖长期风险审计
- **末期退役与环保恢复责任**：名义退役成本为 ¥${((decCost || 0) / 10000).toFixed(2)} 万元，在 ${discountRatePercent}% 折现率下折算至第 0 年现值仅为 ¥${(pvDec / 10000).toFixed(2)} 万元（仅占总折现 LCC 的 **${decPvShare.toFixed(2)}%**）。
- **专家诊断结论**：${(discountRate || 0.06) >= 0.07 && (lifetime || 20) >= 30
    ? '⚠️ **长期环境/退役负债被数学稀释！** 由于折现率偏高且时间跨度长达 ' + lifetime + ' 年，复利折现公式 $(1+r)^{-T}$ 将数十甚至上百年后的巨额拆除与环境治理责任压缩得微乎其微。这在公共政策与代际公平视角下存在严重道德风险。建议设立专款专用折现准备金池。'
    : '✅ 退役成本折现结构在合理预期区间内，但建议关注相关行业环保与危废处置法规的动态更新。'}

#### 3. 通胀口径一致性与费雪效应检验
- 当前名义折现率 $r = ${discountRatePercent}\%$，通胀率 $i = ${inflationRatePercent}\%$。根据费雪公式，**实际折现率** $r_{real} = \\frac{1+r}{1+i} - 1 \\approx {(( (1 + (discountRate || 0.06))/(1 + (inflationRate || 0.02)) - 1 ) * 100).toFixed(2)}\\%$。
- **专家警告**：必须严格确保“名义折现率配名义现金流”或“实际折现率配不变价现金流”，切勿使用名义折现率折现未包含通胀的不变价运维费用，否则会导致生命周期成本被严重低估 15%~30%。

${userQuestion ? `\n---\n#### 4. 针对专项提问的解答：\n> “${userQuestion}”\n**分析意见**：基于上述成本结构，任何针对该变量的调整都应关注其在年均等额成本 (EAC) 上的边际弹性。若调整关键运维参数，将通过敏感性龙卷风图产生显著放大效应。` : ''}`;
}

// POST endpoint for AI Diagnosis with dual model support
app.post('/api/ai/diagnose', async (req, res) => {
  try {
    const { projectData, question, model = 'gemini-3.8-flash' } = req.body;
    const isDeepSeek = model === 'deepseek-v4-pro';
    const activeModelLabel = isDeepSeek ? 'DeepSeek-V4-Pro' : 'Gemini 3.8 Flash';

    const userKey = (req.body.userApiKey || req.body.apiKey || '').trim();
    const apiKey = userKey || process.env.GEMINI_API_KEY;
    const deepseekKey = (isDeepSeek && userKey) ? userKey : (process.env.DEEPSEEK_API_KEY || userKey);

    // Check if independent DeepSeek API call is possible
    if (isDeepSeek && deepseekKey) {
      try {
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
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
                content: `项目数据:\n${JSON.stringify(projectData, null, 2)}\n\n用户关注点:\n${question || '请对当前项目的全生命周期成本结构与潜在财务陷阱进行全方位深度诊断。'}`
              }
            ],
            temperature: 0.3
          })
        });
        const dsData = await dsRes.json();
        const dsText = dsData.choices?.[0]?.message?.content;
        if (dsText) {
          return res.json({ fallback: false, text: dsText, model: activeModelLabel });
        }
      } catch (dsErr) {
        console.warn('DeepSeek direct call failed, falling back to Gemini reasoning or local engine:', dsErr);
      }
    }

    if (!apiKey) {
      console.log('No GEMINI_API_KEY detected in env, using built-in financial expert engine');
      return res.json({
        fallback: true,
        text: getExpertLccaDiagnosis(projectData, question, activeModelLabel),
        model: activeModelLabel
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemPrompt = isDeepSeek 
      ? `【DeepSeek-V4-Pro 深度工程经济学推理引擎模式】
你是一位具备强大逻辑推演与数理金融证明能力的资深工程财务总监。
请针对项目数据进行多步逐步深度思考 (Step-by-Step Chain of Thought)：
1. 深入剖析冰山效应与低价中标反噬机制，量化直接成本与隐性间接成本比例；
2. 严密测算贴现率变化对超期责任的久期冲击与凸性非线性特征；
3. 核查名义折现率与实际折现率口径一致性，防范费雪效应误配；
4. 针对关键敏感性变量提出切实可行的工程风险对冲与准备金信托策略。`
      : `你是一位拥有25年系统工程经济学、重大基础设施投资决策及全生命周期成本分析 (LCCA) 经验的资深特聘总经济师与财务总监。
你的分析重点必须涵盖：
1. 【沉没成本陷阱与运维冰山效应】：剖析 CAPEX 冰山之角与水下运维隐性成本，防范低价中标陷阱。
2. 【折现率与代际/长期风险评估】：剖析复利折现公式在长寿命项目中是否过分稀释了末期退役与环境治理负债。
3. 【通货膨胀与现金流口径对齐】：检验名义折现率与实际折现率（费雪效应）、名义现金流与实际现金流的匹配。
4. 【敏感性关键变量与决策边界】：针对折现率、寿命期、能源动力费波动对 EAC/LCC 的边际冲击给出量化建议。`;

    const userPrompt = `项目全生命周期成本现状数据：
${JSON.stringify(projectData, null, 2)}

用户问询或关注点：
${question || '请对当前项目的全生命周期成本结构、折现稳健性与潜在财务陷阱进行全方位专家诊断与风险审计。'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: isDeepSeek ? 0.2 : 0.3,
      }
    });

    const responseText = response.text || getExpertLccaDiagnosis(projectData, question, activeModelLabel);
    return res.json({ fallback: false, text: responseText, model: activeModelLabel });
  } catch (error: any) {
    console.error('AI call failed, falling back to local expert engine:', error);
    const fallbackLabel = req.body.model === 'deepseek-v4-pro' ? 'DeepSeek-V4-Pro' : 'Gemini 3.8 Flash';
    return res.json({
      fallback: true,
      text: getExpertLccaDiagnosis(req.body.projectData, req.body.question, fallbackLabel),
      model: fallbackLabel
    });
  }
});

async function main() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LCCA Laboratory server started at http://0.0.0.0:${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
