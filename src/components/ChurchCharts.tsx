import React, { useMemo, useState } from 'react';
import {
  Users,
  Coffee,
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  Calendar,
  Share2,
  Filter,
  Download,
  Clock,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Mail,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  Phone,
  MapPin,
  UserCheck,
  Edit3,
  Printer
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { RegistrationRecord, SentMessageLog } from '../types';
import { formatWhatsAppUrl, formatGmailComposeUrl, exportRecordsToCSV } from '../utils/storage';
import { ScheduleCoffeeModal } from './ScheduleCoffeeModal';
import { PrintChartsModal } from './PrintChartsModal';

interface ChurchChartsProps {
  records: RegistrationRecord[];
  logs?: SentMessageLog[];
  onOpenRecordsTab?: () => void;
  onUpdateRecords?: () => void;
}

// Elegant AD Leiria Color Palette
const COLORS = {
  redPrimary: '#dc2626', // Red 600
  redDark: '#991b1b', // Red 800
  redLight: '#f87171', // Red 400
  amber: '#d97706', // Amber 600
  emerald: '#059669', // Emerald 600
  blue: '#2563eb', // Blue 600
  indigo: '#4f46e5', // Indigo 600
  slate: '#475569', // Slate 600
  coffee: '#b45309', // Amber 700 / Coffee
};

const PIE_COLORS_ORIGEM = [
  '#dc2626', // Por intermédio de alguém
  '#e11d48', // Instagram
  '#2563eb', // Facebook
  '#0891b2', // Website
  '#059669', // Google
  '#d97706', // Evangelismo de rua
  '#64748b', // Outra
];

const PIE_COLORS_FAIXA = [
  '#f59e0b', // 12 a 17 anos (Amber)
  '#dc2626', // 18 a 35 anos (Red)
  '#1e293b', // 35 anos acima (Dark Slate)
];

const PIE_COLORS_DECISAO = [
  '#dc2626', // Visitante
  '#f59e0b', // Conversão
  '#059669', // Reconciliação
];

export const ChurchCharts: React.FC<ChurchChartsProps> = ({
  records,
  logs = [],
  onOpenRecordsTab,
  onUpdateRecords,
}) => {
  const [filterCelebration, setFilterCelebration] = useState<string>('todos');
  const [filterPeriod, setFilterPeriod] = useState<string>('todos');
  const [schedulingCoffeeRecord, setSchedulingCoffeeRecord] = useState<RegistrationRecord | null>(null);
  const [coffeeViewFilter, setCoffeeViewFilter] = useState<'todos' | 'marcados' | 'aguardando'>('todos');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const formatFriendlyDate = (dStr?: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  // Filtered records based on celebration or period
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchCelebration =
        filterCelebration === 'todos' || r.celebracaoDomingo === filterCelebration;
      return matchCelebration;
    });
  }, [records, filterCelebration]);

  // 1. STATS TOTALS
  const totalCount = filtered.length;
  const visitorsCount = filtered.filter((r) => r.decisionType === 'VISITANTE').length;
  const conversionsCount = filtered.filter((r) => r.decisionType === 'CONVERSAO').length;
  const reconcilsCount = filtered.filter((r) => r.decisionType === 'RECONCILIACAO').length;

  // 4 steps & Café com Pastor
  const v1Count = filtered.filter((r) => r.acompanhamento.visita1).length;
  const v2Count = filtered.filter((r) => r.acompanhamento.visita2).length;
  const v3Count = filtered.filter((r) => r.acompanhamento.visita3).length;
  const v4Count = filtered.filter((r) => r.acompanhamento.visita4).length;
  
  // Aptos: completed all 4 steps
  const aptosCafeCount = filtered.filter(
    (r) =>
      r.acompanhamento.visita1 &&
      r.acompanhamento.visita2 &&
      r.acompanhamento.visita3 &&
      r.acompanhamento.visita4
  ).length;

  // Realized: actually attended Café com Pastor
  const cafeRealizadoCount = filtered.filter(
    (r) => r.acompanhamento.cafeComPastor
  ).length;

  const cafePercentAptos =
    aptosCafeCount > 0 ? Math.round((cafeRealizadoCount / aptosCafeCount) * 100) : 0;
  const cafePercentTotal =
    totalCount > 0 ? Math.round((cafeRealizadoCount / totalCount) * 100) : 0;

  // 2. COMO CONHECEU A IGREJA (Meio de Chegada)
  const origemData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      const canal = r.comoConheceu || 'Não especificado';
      counts[canal] = (counts[canal] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        total: count,
        percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, totalCount]);

  // Top invitation people
  const convidadosPorPessoas = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      if (r.comoConheceuDetalhe && r.comoConheceuDetalhe.trim()) {
        const det = r.comoConheceuDetalhe.trim();
        counts[det] = (counts[det] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtered]);

  // 3. FAIXA ETÁRIA DATA
  const faixaEtariaData = useMemo(() => {
    const counts: Record<string, number> = {
      '12 a 17 anos': 0,
      '18 a 35 anos': 0,
      '35 anos acima': 0,
    };

    filtered.forEach((r) => {
      if (r.faixaEtaria && counts[r.faixaEtaria] !== undefined) {
        counts[r.faixaEtaria] += 1;
      } else if (r.faixaEtaria) {
        counts[r.faixaEtaria] = (counts[r.faixaEtaria] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, total]) => ({
      name,
      total,
      percent: totalCount > 0 ? Math.round((total / totalCount) * 100) : 0,
    }));
  }, [filtered, totalCount]);

  // 4. JORNADA DE ACOMPANHAMENTO (Passos 1 a 4 + Café com o Pastor)
  const jornadaData = useMemo(() => {
    return [
      {
        etapa: '1ª Visita (Passo 1)',
        pessoas: v1Count,
        percent: totalCount > 0 ? Math.round((v1Count / totalCount) * 100) : 0,
        fill: '#f87171',
      },
      {
        etapa: '2ª Visita (Passo 2)',
        pessoas: v2Count,
        percent: totalCount > 0 ? Math.round((v2Count / totalCount) * 100) : 0,
        fill: '#ef4444',
      },
      {
        etapa: '3ª Visita (Passo 3)',
        pessoas: v3Count,
        percent: totalCount > 0 ? Math.round((v3Count / totalCount) * 100) : 0,
        fill: '#dc2626',
      },
      {
        etapa: '4ª Visita (Integrados)',
        pessoas: v4Count,
        percent: totalCount > 0 ? Math.round((v4Count / totalCount) * 100) : 0,
        fill: '#b91c1c',
      },
      {
        etapa: '☕ Café c/ Pastor Realizado',
        pessoas: cafeRealizadoCount,
        percent: totalCount > 0 ? Math.round((cafeRealizadoCount / totalCount) * 100) : 0,
        fill: '#b45309',
      },
    ];
  }, [v1Count, v2Count, v3Count, v4Count, cafeRealizadoCount, totalCount]);

  // 5. DECISÕES DATA
  const decisoesData = useMemo(() => {
    return [
      {
        name: 'Visitantes',
        total: visitorsCount,
        percent: totalCount > 0 ? Math.round((visitorsCount / totalCount) * 100) : 0,
        fill: '#dc2626',
      },
      {
        name: 'Novas Conversões',
        total: conversionsCount,
        percent: totalCount > 0 ? Math.round((conversionsCount / totalCount) * 100) : 0,
        fill: '#f59e0b',
      },
      {
        name: 'Reconciliações',
        total: reconcilsCount,
        percent: totalCount > 0 ? Math.round((reconcilsCount / totalCount) * 100) : 0,
        fill: '#059669',
      },
    ];
  }, [visitorsCount, conversionsCount, reconcilsCount, totalCount]);

  // 6. CULTOS DE DOMINGO & SEXTA DATA
  const cultosData = useMemo(() => {
    const c10h = filtered.filter((r) => r.celebracaoDomingo === '10h').length;
    const c17h = filtered.filter((r) => r.celebracaoDomingo === '17h').length;
    const c21h = filtered.filter((r) => r.celebracaoDomingo === '21h').length;
    const outro = filtered.filter((r) => r.celebracaoDomingo === 'Outro').length;
    return [
      {
        name: 'Domingo 10h',
        total: c10h,
        percent: totalCount > 0 ? Math.round((c10h / totalCount) * 100) : 0,
        fill: '#dc2626',
      },
      {
        name: 'Domingo 17h',
        total: c17h,
        percent: totalCount > 0 ? Math.round((c17h / totalCount) * 100) : 0,
        fill: '#991b1b',
      },
      {
        name: 'Sexta 21h',
        total: c21h,
        percent: totalCount > 0 ? Math.round((c21h / totalCount) * 100) : 0,
        fill: '#d97706',
      },
      {
        name: 'Outras Reuniões',
        total: outro,
        percent: totalCount > 0 ? Math.round((outro / totalCount) * 100) : 0,
        fill: '#64748b',
      },
    ];
  }, [filtered, totalCount]);

  // People who completed the 4 steps (Aptos)
  const aptosList = useMemo(() => {
    return filtered.filter(
      (r) =>
        r.acompanhamento.visita1 &&
        r.acompanhamento.visita2 &&
        r.acompanhamento.visita3 &&
        r.acompanhamento.visita4
    );
  }, [filtered]);

  const marcadosList = useMemo(() => {
    return aptosList.filter((r) => r.acompanhamento.cafeComPastor);
  }, [aptosList]);

  const aguardandoList = useMemo(() => {
    return aptosList.filter((r) => !r.acompanhamento.cafeComPastor);
  }, [aptosList]);

  const displayedAptosList = useMemo(() => {
    if (coffeeViewFilter === 'marcados') return marcadosList;
    if (coffeeViewFilter === 'aguardando') return aguardandoList;
    return aptosList;
  }, [coffeeViewFilter, aptosList, marcadosList, aguardandoList]);

  return (
    <div className="space-y-6 pb-12">
      {/* Printable Area Wrapper (Captured for PDF and formatted for printing with 100% screen fidelity) */}
      <div id="printable-charts-area" className="printable-charts-content space-y-6 sm:space-y-8 bg-white rounded-3xl p-1 sm:p-3">
        {/* Top Banner & Title - identical design on screen, PDF export, and printout */}
        <div className="bg-white border-2 border-red-600 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-red-50 rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <BarChart3 className="w-3.5 h-3.5" />
                Igreja Evangélica Assembleia de Deus em Leiria • NIF 501 329 119
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Métricas de Integração • AD Leiria
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
                Ministério Integrarte • Filtro: <strong className="text-red-700 font-bold">{filterCelebration === 'todos' ? 'Todos os Cultos' : `Culto ${filterCelebration}`}</strong> • Emitido em: <strong>{new Date().toLocaleDateString('pt-PT')}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap no-print">
              {/* Filter by Celebration */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterCelebration}
                  onChange={(e) => setFilterCelebration(e.target.value)}
                  className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos os Cultos</option>
                  <option value="10h">Culto 10h (Domingo)</option>
                  <option value="17h">Culto 17h (Domingo)</option>
                  <option value="21h">Culto 21h (Sexta)</option>
                  <option value="Outro">Outros Cultos</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => exportRecordsToCSV(filtered)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar CSV
              </button>

              {/* Botão de Imprimir Gráficos em PDF */}
              <button
                type="button"
                id="btn-print-charts-pdf"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Imprimir ou Descarregar Gráficos em PDF"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>Imprimir Gráficos em PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pessoas</span>
            <Users className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Registos ativos</span>
        </div>

        {/* Visitantes */}
        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Visitantes</span>
            <Users className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-600 mt-1">{visitorsCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">
            {totalCount > 0 ? Math.round((visitorsCount / totalCount) * 100) : 0}% do total
          </span>
        </div>

        {/* Conversões */}
        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Conversões</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{conversionsCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Novas decisões</span>
        </div>

        {/* Reconciliações */}
        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Reconciliações</span>
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{reconcilsCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Retorno ao Senhor</span>
        </div>

        {/* Aptos p/ Café (4 Passos) */}
        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Aptos p/ Café</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">{aptosCafeCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Concluíram 4 passos</span>
        </div>

        {/* Café com o Pastor Realizado */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl p-4 shadow-md col-span-2 sm:col-span-1 border-2 border-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
              Café c/ Pastor
            </span>
            <Coffee className="w-4 h-4 text-amber-100 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-white">
            {cafeRealizadoCount}
          </p>
          <span className="text-[11px] text-amber-100 font-bold block mt-0.5">
            {cafePercentAptos}% dos {aptosCafeCount} aptos
          </span>
        </div>
      </div>

      {/* CHARTS ROW 1: ORIGEM & MEIO DE CHEGADA + FAIXA ETÁRIA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Como Conheceu a Igreja (8 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-red-600" />
                Como Conheceu a Igreja (Meio de Chegada)
              </h3>
              <p className="text-xs text-slate-500">
                Canais e meios através dos quais cada pessoa encontrou a comunidade
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-lg">
              {origemData.length} canais
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={origemData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#334155' }}
                  width={140}
                />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${value} pessoas (${props.payload.percent}%)`,
                    'Total',
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                  {origemData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS_ORIGEM[index % PIE_COLORS_ORIGEM.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top invitations highlight */}
          {convidadosPorPessoas.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                Top Convidadores Pessoais ("Por intermédio de alguém"):
              </span>
              <div className="flex flex-wrap gap-2">
                {convidadosPorPessoas.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-xl font-medium shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <strong>{p.nome}:</strong> {p.total} {p.total === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Faixa Etária (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 print-break-inside-avoid break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-red-600" />
                Distribuição por Faixa Etária
              </h3>
              <p className="text-xs text-slate-500">
                Composição etária dos acolhidos
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg">
              {totalCount} total
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {totalCount === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">
                Nenhum acolhido registado no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={faixaEtariaData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    label={({ percent }: { percent: number }) => (percent > 0 ? `${percent}%` : '')}
                  >
                    {faixaEtariaData.map((_entry, index) => (
                      <Cell
                        key={`cell-faixa-${index}`}
                        fill={PIE_COLORS_FAIXA[index % PIE_COLORS_FAIXA.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, _name: any, props: any) => [
                      `${val} pessoas (${props.payload.percent}%)`,
                      'Total',
                    ]}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {faixaEtariaData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS_FAIXA[index % PIE_COLORS_FAIXA.length] }}
                  />
                  <span className="font-bold text-slate-800">{item.name}</span>
                </div>
                <div className="font-mono text-slate-600 font-semibold">
                  {item.total} pessoas ({item.percent}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: DECISÕES REGISTADAS & FREQUÊNCIA POR CELEBRAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-grid-2 print-break-inside-avoid break-inside-avoid">
        {/* Tipos de Decisão */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 print-break-inside-avoid break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Decisões Registadas
              </h3>
              <p className="text-xs text-slate-500">
                Divisão entre Visitantes, Conversões e Reconciliações
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg">
              {conversionsCount + reconcilsCount} Decisões
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decisoesData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, _name: any, props: any) => [
                    `${val} pessoas (${props.payload.percent}%)`,
                    'Total',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {decisoesData.map((entry, index) => (
                    <Cell key={`cell-decisao-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {decisoesData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="font-bold text-slate-800">{item.name}</span>
                </div>
                <div className="font-mono text-slate-600 font-semibold">
                  {item.total} pessoas ({item.percent}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cultos de Domingo & Celebrações */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 print-break-inside-avoid break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                Frequência por Celebração
              </h3>
              <p className="text-xs text-slate-500">
                Distribuição das presenças por horário de culto
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-lg">
              {totalCount} Acolhidos
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cultosData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, _name: any, props: any) => [
                    `${val} pessoas (${props.payload.percent}%)`,
                    'Total',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {cultosData.map((entry, index) => (
                    <Cell key={`cell-culto-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {cultosData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="font-bold text-slate-800">{item.name}</span>
                </div>
                <div className="font-mono text-slate-600 font-semibold">
                  {item.total} pessoas ({item.percent}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 3: INTEGRAÇÃO E MARCAÇÃO CAFÉ COM PASTOR */}
      <div className="bg-white border-2 border-red-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 print-break-inside-avoid break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider mb-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-700" />
              Integração e Marcação Café com Pastor
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Progresso dos 4 Passos e Marcação do Café com o Pastor
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              A pessoa só fica apta para marcar o Café com o Pastor após concluir com sucesso os 4
              primeiros passos de visita.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-right">
              <span className="text-[11px] font-bold text-emerald-900 block">
                Café Marcado
              </span>
              <span className="text-2xl font-black text-emerald-700">
                {marcadosList.length} <span className="text-xs text-emerald-900 font-normal">agendados</span>
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-right">
              <span className="text-[11px] font-bold text-amber-900 block">
                Aguardando Marcação
              </span>
              <span className="text-2xl font-black text-amber-700">
                {aguardandoList.length} <span className="text-xs text-amber-900 font-normal">de {aptosList.length} aptos</span>
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={jornadaData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="etapa" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val: any, _name: any, props: any) => [
                  `${val} pessoas (${props.payload.percent}% do banco de dados)`,
                  'Participantes',
                ]}
                contentStyle={{
                  borderRadius: '12px',
                  borderColor: '#cbd5e1',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="pessoas" radius={[10, 10, 0, 0]}>
                {jornadaData.map((entry, index) => (
                  <Cell key={`cell-jornada-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive List: Marcação Café com Pastor */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  Marcação Café com Pastor
                </h4>
                <p className="text-xs text-slate-500">
                  Membros que concluíram os 4 passos da jornada e o estado do agendamento pastoral
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl gap-1 text-xs no-print">
              <button
                type="button"
                onClick={() => setCoffeeViewFilter('todos')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  coffeeViewFilter === 'todos'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Todos ({aptosList.length})
              </button>
              <button
                type="button"
                onClick={() => setCoffeeViewFilter('marcados')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  coffeeViewFilter === 'marcados'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Café Marcado ({marcadosList.length})
              </button>
              <button
                type="button"
                onClick={() => setCoffeeViewFilter('aguardando')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  coffeeViewFilter === 'aguardando'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Aguardando ({aguardandoList.length})
              </button>
            </div>
          </div>

          {displayedAptosList.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300 p-6">
              <Coffee className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">
                {coffeeViewFilter === 'marcados'
                  ? 'Nenhum café marcado no momento com os filtros selecionados.'
                  : coffeeViewFilter === 'aguardando'
                  ? 'Nenhuma pessoa aguardando marcação de café no momento.'
                  : 'Ainda não existem membros que tenham concluído todos os 4 passos de acompanhamento.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Conforme as visitas forem preenchidas nos registros, as pessoas aptas aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedAptosList.map((rec) => {
                const jaMarcado = Boolean(rec.acompanhamento.cafeComPastor);
                const dataMarcada = rec.acompanhamento.dataCafeComPastor;
                const horaMarcada = rec.acompanhamento.horaCafeComPastor;
                const localMarcado = rec.acompanhamento.localCafeComPastor;
                const statusCafe = rec.acompanhamento.statusCafeComPastor || 'marcado';

                return (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      jaMarcado
                        ? 'bg-gradient-to-br from-amber-50/90 to-emerald-50/40 border-amber-300 shadow-xs'
                        : 'bg-white border-amber-200/80 shadow-xs hover:border-amber-400'
                    }`}
                  >
                    <div>
                      {/* Top Header: Name & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-sm text-slate-900 truncate">
                            {rec.nome} {rec.sobrenome}
                          </h5>
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            {rec.faixaEtaria} • {rec.celebracaoDomingo} • {rec.decisionType}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider inline-flex items-center gap-1 shrink-0 ${
                            jaMarcado
                              ? statusCafe === 'realizado'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          <Coffee className="w-3 h-3" />
                          {jaMarcado
                            ? statusCafe === 'realizado'
                              ? 'Café Realizado ✓'
                              : 'Café Marcado ✓'
                            : 'Aguardando Marcação'}
                        </span>
                      </div>

                      {/* Agendamento Detalhado ou Aviso de Espera */}
                      {jaMarcado ? (
                        <div className="mt-3 p-3 bg-white/95 border border-amber-200 rounded-xl space-y-1.5 text-xs shadow-2xs">
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="inline-flex items-center gap-1.5 font-bold text-amber-900">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              Data Marcada:
                            </span>
                            <span className="font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {formatFriendlyDate(dataMarcada)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="inline-flex items-center gap-1.5 font-bold text-amber-900">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Horário:
                            </span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                              {horaMarcada || '16:00'}
                            </span>
                          </div>
                          {localMarcado && (
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="inline-flex items-center gap-1.5 font-bold text-amber-900">
                                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                                Local:
                              </span>
                              <span className="text-[11px] text-slate-600 truncate max-w-[150px]">
                                {localMarcado}
                              </span>
                            </div>
                          )}
                          {rec.acompanhamento.responsavel && (
                            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              <span>Responsável: <strong>{rec.acompanhamento.responsavel}</strong></span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 p-2.5 bg-amber-50/80 border border-dashed border-amber-300 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Passou pelas 4 etapas com sucesso!</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-tight">
                            Esta pessoa concluiu os 4 passos e está aguardando a marcação do café com o pastor.
                          </p>
                        </div>
                      )}

                      {/* Contact & Dados da Pessoa */}
                      <div className="mt-3 pt-2 border-t border-slate-200/80 text-xs space-y-1 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {rec.telemovel || 'Sem telemóvel registado'}
                          </span>
                        </div>
                        {rec.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-[11px] text-slate-600 truncate">{rec.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2 no-print">
                      <button
                        type="button"
                        onClick={() => setSchedulingCoffeeRecord(rec)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          jaMarcado
                            ? 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs'
                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{jaMarcado ? 'Alterar Agendamento' : 'Marcar Café com Pastor'}</span>
                      </button>

                      {rec.telemovel && (
                        <a
                          href={formatWhatsAppUrl(
                            rec.telemovel,
                            jaMarcado
                              ? `A Paz do Senhor, ${rec.nome}! ☕ Confirmamos o nosso Café com o Pastor na AD Leiria para o dia ${formatFriendlyDate(dataMarcada)}${horaMarcada ? ` às ${horaMarcada}` : ''}! Contamos com a sua presença preciosa.`
                              : `A Paz do Senhor, ${rec.nome}! ☕ Parabéns por completar as etapas de integração no Ministério Integrarte da AD Leiria! Gostaríamos de marcar o seu Café com o Pastor. Qual a sua melhor disponibilidade de dia e horário?`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shrink-0"
                          title="Contactar via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

        {/* Printable Official Footer */}
        <div className="print-only mt-8 pt-6 border-t border-slate-300 text-xs text-slate-500 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-700">Assembleia de Deus em Leiria • Ministério Integrarte</p>
            <p className="text-[11px]">Rua Manuel Simões Barbeiro, 2415-403 Marrazes, Leiria</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-mono">Assinatura / Visto Pastoral: ___________________________</p>
            <p className="text-[10px] text-slate-400 mt-1">Documento emitido internamente através da plataforma digital.</p>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento do Café com o Pastor */}
      {schedulingCoffeeRecord && (
        <ScheduleCoffeeModal
          record={schedulingCoffeeRecord}
          onClose={() => setSchedulingCoffeeRecord(null)}
          onSave={() => {
            setSchedulingCoffeeRecord(null);
            onUpdateRecords?.();
          }}
        />
      )}

      {/* Modal de Impressão e Exportação em PDF dos Gráficos */}
      {isPrintModalOpen && (
        <PrintChartsModal
          records={records}
          logs={logs}
          filterCelebration={filterCelebration}
          filterPeriod={filterPeriod}
          onClose={() => setIsPrintModalOpen(false)}
          onTriggerNativePrint={() => {
            try {
              window.print();
            } catch (e) {
              console.warn('Native window.print restricted in frame:', e);
            }
          }}
        />
      )}
    </div>
  );
};
