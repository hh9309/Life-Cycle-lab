import React, { useState } from 'react';
import { 
  BookOpen, 
  Scale, 
  MapPin, 
  AlertOctagon, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles
} from 'lucide-react';

export const ModuleKnowledgeSlices: React.FC = () => {
  const [activeSlice, setActiveSlice] = useState<'slice1' | 'slice2' | 'slice3' | 'slice4'>('slice1');

  const slices = [
    {
      id: 'slice1',
      title: '切片一：CAPEX vs. OPEX 权衡机制',
      shortTitle: 'CAPEX vs OPEX 权衡',
      icon: Scale,
      color: 'teal',
      badge: '价值权衡',
    },
    {
      id: 'slice2',
      title: '切片二：适用条件与空间表示',
      shortTitle: '适用条件与空间表示',
      icon: MapPin,
      color: 'indigo',
      badge: '时空投影',
    },
    {
      id: 'slice3',
      title: '切片三：三大致命评价陷阱',
      shortTitle: '三大致命评价陷阱',
      icon: AlertOctagon,
      color: 'rose',
      badge: '红线预警',
    },
    {
      id: 'slice4',
      title: '切片四：误区警示与诊断陷阱',
      shortTitle: '误区警示与折现法则',
      icon: ShieldAlert,
      color: 'amber',
      badge: '财务真理',
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                知识机制导引
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                系统全生命周期成本与机制知识导引 (Knowledge Slices)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              通过四大知识切片，深度解析 CAPEX/OPEX 权衡、现值空间投影机理、三大致命陷阱与折现财务原则。
            </p>
          </div>
        </div>

        {/* 4 Interactive Slices Selector Strip */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2 pt-4 border-t border-slate-100">
          {slices.map(s => {
            const Icon = s.icon;
            const isSelected = activeSlice === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSlice(s.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">{s.shortTitle}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isSelected ? 'bg-slate-800 text-teal-300' : 'bg-white text-slate-500 border border-slate-200'
                }`}>
                  {s.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slice 1 Content */}
      {activeSlice === 'slice1' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  【切片一：CAPEX vs. OPEX 权衡机制 (Trade-off)】
                </h3>
                <span className="text-xs text-slate-400">系统工程经济学的“前置投入与后向节约”博弈</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-teal-50/50 border border-teal-200/60 rounded-xl space-y-2">
              <h4 className="font-bold text-teal-900 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                CAPEX 决定系统初始性能骨架
              </h4>
              <p className="text-teal-950/80 leading-relaxed">
                资本性支出 (CAPEX) 锁定了系统的热工效率、材料耐蚀等级、冗余容错架构与自动化基准。
                前期如果为了压缩采购预算而选用廉价元器件，本质是将初始成本人为“转嫁”给未来的运维部门。
              </p>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-200/60 rounded-xl space-y-2">
              <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                OPEX 决定长远系统运行生命力
              </h4>
              <p className="text-indigo-950/80 leading-relaxed">
                运营与维护支出 (OPEX + MAINT) 伴随整个生命周期按年持续发生。低效能系统每年的电费、燃料费与停机维修工时具有极强的复利时间放大效应。
                LCCA 的核心不是追求“最低初始造价”，而是寻求 **全生命周期总折现现值最小化**！
              </p>
            </div>
          </div>

          {/* Trade-off Curve Visual Slice */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-3">
            <div className="font-bold text-slate-900">非线性权衡曲线机制示意</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-400">方案 A (低CAPEX/劣品质)</div>
                <div className="text-rose-700 font-bold mt-1">CAPEX -30% → OPEX +120%</div>
                <div className="text-slate-500 mt-0.5">全周期 LCC 暴涨 65%</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-teal-300 bg-teal-50/30">
                <div className="text-teal-800 font-semibold">方案 B (LCCA 最佳平衡点)</div>
                <div className="text-teal-900 font-bold mt-1">适度增量投资 (优选节能)</div>
                <div className="text-teal-700 mt-0.5">全周期 LCC 达到局部极小值</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-400">方案 C (过度工程化)</div>
                <div className="text-amber-700 font-bold mt-1">CAPEX +150% → OPEX -15%</div>
                <div className="text-slate-500 mt-0.5">边际节能收益无法弥补期初溢价</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slice 2 Content */}
      {activeSlice === 'slice2' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  【切片二：适用条件与空间表示 (Spatial Mapping)】
                </h3>
                <span className="text-xs text-slate-400">多阶段时间序列成本向折现现值空间的几何投影</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>1. 适用工程边界条件：</strong>
              LCCA 评估方法特别适用于具备“高初始投资、超长使用寿命 (10~100年)、中后期运维能耗高昂、或具有严苛末期退役环保处置要求”的复杂系统工程（如跨海通道、核电站、算力中心、轨道列车、绿色公建）。
            </p>
            <p>
              <strong>2. 时间序列向折现现值空间映射：</strong>
              工程各阶段发生的费用分布在不同的时间坐标轴 t ∈ [0, T] 上。由于货币存在时间价值与机会成本，不同年份的名义货币购买力具有异质性。
              通过折现因子向量 DF = [(1+r)⁰, (1+r)⁻¹, ..., (1+r)⁻ᵀ]，我们将分散在 (T+1) 维时间序列空间中的成本向量，投影内积映射到标量统一的<strong>折现现值空间 (Present Value Space)</strong>，从而实现不同方案的公平度量。
            </p>
            <p>
              <strong>3. 寿命不齐时的 EAC 映射对齐：</strong>
              当方案 A 寿命 15 年，方案 B 寿命 30 年时，直接比对 LCC PV 是数学谬误。必须通过资本回收系数 $CRF(r, T)$ 映射为年均等额成本 (EAC)，方可消除生命周期不对称造成的度量畸变。
            </p>
          </div>
        </div>
      )}

      {/* Slice 3 Content */}
      {activeSlice === 'slice3' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  【切片三：三大致命评价陷阱 (Fatal Pitfalls)】
                </h3>
                <span className="text-xs text-slate-400">重大工程投资决策中最常出现的不可逆灾难性漏洞</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-rose-50/50 border border-rose-200/70 rounded-xl space-y-2">
              <div className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                陷阱一：低价中标买马容易养马难
              </div>
              <p className="text-rose-950/80 leading-relaxed">
                仅凭初始采购竞标价格定夺中标方案，完全漏算 20 年备件采购单价、非计划停机损失及高能耗。低价供应商往往通过后期垄断性维保配件高价索赔反噬项目业主。
              </p>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-2">
              <div className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                陷阱二：不当折现率扭曲长期方案
              </div>
              <p className="text-amber-950/80 leading-relaxed">
                在 60~100 年超长寿命工程中人为拔高折现率（如用 8% 代替 3.5%），数学上会将 30 年后的换索大修、设备翻新与退役负债折现压缩为零，严重虚构了不可持续方案的短期经济性。
              </p>
            </div>

            <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                陷阱三：漏算退役环保合规黑洞
              </div>
              <p className="text-slate-700 leading-relaxed">
                未将末期放射性去污、危废化学介质销毁、工业土地生态绿化恢复列入 CBS 成本结构，导致系统在退役期突发合规诉讼与无法脱网的巨额环境罚款。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Slice 4 Content */}
      {activeSlice === 'slice4' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  【切片四：误区警示与诊断陷阱 (Methodological Warnings)】
                </h3>
                <span className="text-xs text-slate-400">坚决抵制“名义成本与折现现值混淆”的财务伪命题</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl text-xs space-y-3">
            <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-600" />
              <span>警惕：名义账面成本与折现现值混淆！</span>
            </div>
            <p className="text-amber-950/90 leading-relaxed text-xs">
              在工程评审答辩中，最严重的常识性财务硬伤就是将<strong>未经过资金时间价值折现的跨年度名义成本进行简单算术累加</strong>！
              第 1 年的 1 亿元与第 30 年的 1 亿元在财务价值、购买力与资本机会成本上存在本质区别。任何未指明基准折现率与基准时点的“全生命周期总费用求和”在学术界与投资银行界均被视为无效伪命题。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="text-rose-800 font-bold flex items-center gap-1">
                <span>❌ 常见错误财务做法</span>
              </div>
              <p className="text-rose-900/80 mt-1 font-sans text-xs">
                直接计算：$Total = CAPEX + 30 \times OPEX + 30 \times MAINT + DEC$，跨 30 年名义金额直接相加。
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-emerald-800 font-bold flex items-center gap-1">
                <span>✅ 科学工程经济学做法</span>
              </div>
              <p className="text-emerald-900/80 mt-1 font-sans text-xs">
                统一折现：LCC = CAPEX + ∑ [ (OPEX_t + MAINT_t) / (1+r)ᵗ ] + [ (DEC - S) / (1+r)ᵀ ]，并以 EAC 评判。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
