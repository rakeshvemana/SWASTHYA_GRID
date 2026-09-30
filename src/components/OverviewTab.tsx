import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bed,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Compass,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Flame,
  Globe,
  Layers,
  MapPin,
  MoreHorizontal,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Truck,
  User,
  Users,
} from 'lucide-react';
import { HealthFacility, InventoryItem, DemandForecast, TransferRecommendation, SimulationScenarioType } from '../types';
import { PRESET_SCENARIOS, ALL_INDIAN_STATES, TOTAL_DISTRICTS_COUNT } from '../data/mockOperationalData';

interface OverviewTabProps {
  facilities: HealthFacility[];
  inventory: InventoryItem[];
  forecasts: DemandForecast[];
  transfers: TransferRecommendation[];
  activeScenario: SimulationScenarioType;
  onInjectScenario: (scenarioType: SimulationScenarioType) => void;
  onNavigateTab: (tab: string) => void;
  isScenarioLoading: boolean;
  onOpenCrisisStepper?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  facilities,
  inventory,
  forecasts,
  transfers,
  activeScenario,
  onInjectScenario,
  onNavigateTab,
  isScenarioLoading,
  onOpenCrisisStepper,
}) => {
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchDistrictQuery, setSearchDistrictQuery] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(6); // Default July

  // State info
  const activeStateInfo = ALL_INDIAN_STATES.find((s) => s.name === selectedState);
  const availableDistricts = activeStateInfo ? activeStateInfo.districts : [];

  // Filter facilities
  const filteredFacilities = facilities.filter((f) => {
    if (selectedState !== 'ALL' && f.state !== selectedState) return false;
    if (selectedDistrict !== 'ALL' && f.district !== selectedDistrict) return false;
    if (searchDistrictQuery.trim() !== '') {
      const q = searchDistrictQuery.toLowerCase();
      const matchDistrict = f.district.toLowerCase().includes(q);
      const matchState = f.state.toLowerCase().includes(q);
      const matchName = f.name.toLowerCase().includes(q);
      if (!matchDistrict && !matchState && !matchName) return false;
    }
    return true;
  });

  const filteredFacilityIds = new Set(filteredFacilities.map((f) => f.id));

  const filteredInventory = inventory.filter((item) =>
    selectedState === 'ALL' && selectedDistrict === 'ALL' && !searchDistrictQuery.trim()
      ? true
      : filteredFacilityIds.has(item.facilityId)
  );

  const criticalItems = filteredInventory.filter((i) => i.riskLevel === 'CRITICAL');
  const highItems = filteredInventory.filter((i) => i.riskLevel === 'HIGH');

  const pendingTransfers = transfers.filter((t) => {
    if (selectedState === 'ALL' && selectedDistrict === 'ALL') return t.status === 'PROPOSED';
    return (
      t.status === 'PROPOSED' &&
      (filteredFacilityIds.has(t.sourceFacilityId) || filteredFacilityIds.has(t.targetFacilityId))
    );
  });

  const inTransitTransfers = transfers.filter((t) => t.status === 'IN_TRANSIT');

  const totalBeds = filteredFacilities.reduce((sum, f) => sum + f.totalBeds, 0);
  const occupiedBeds = filteredFacilities.reduce((sum, f) => sum + f.occupiedBeds, 0);

  // Chart data for Medcare dual-spline chart
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const totalPatientsData = [750, 920, 1100, 1050, 850, 1200, 1856, 1250, 1400, 1300, 1600, 1750];
  const inpatientsData = [1100, 1300, 1500, 1200, 900, 850, 1150, 1450, 1200, 1000, 1350, 1480];

  // SVG dimensions for chart
  const chartWidth = 600;
  const chartHeight = 220;
  const maxY = 2200;

  const getCoordinates = (val: number, idx: number) => {
    const x = (idx / (months.length - 1)) * (chartWidth - 60) + 40;
    const y = chartHeight - 30 - (val / maxY) * (chartHeight - 60);
    return { x, y };
  };

  const createSmoothPath = (data: number[]) => {
    const points = data.map((val, idx) => getCoordinates(val, idx));
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const totalPath = createSmoothPath(totalPatientsData);
  const inpatPath = createSmoothPath(inpatientsData);

  // Peak highlight coords (July = index 6)
  const peakIdx = 6;
  const peakCoords = getCoordinates(totalPatientsData[peakIdx], peakIdx);

  // States to display in Regional Grid
  const displayStates = selectedState === 'ALL'
    ? ALL_INDIAN_STATES.slice(0, 6)
    : [activeStateInfo || ALL_INDIAN_STATES[0]];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Greeting & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Hello, Sourav <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            There is the latest update for the last 7 days. check now
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs text-slate-600 font-medium flex items-center gap-2 shadow-xs">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span>Monday, 4th September</span>
          </div>

          {/* Quick Scenario Injector */}
          <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs text-slate-600 flex items-center gap-1.5 shadow-xs">
            <span className="text-[11px] text-slate-400">Mode:</span>
            <select
              value={activeScenario}
              onChange={(e) => onInjectScenario(e.target.value as SimulationScenarioType)}
              className="bg-transparent font-semibold text-emerald-700 focus:outline-none cursor-pointer text-xs"
            >
              {PRESET_SCENARIOS.map((sc) => (
                <option key={sc.type} value={sc.type}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Appointments (Hero Accent) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c4339] via-[#0d4e42] to-[#12584a] p-5 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs shadow-xs">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-emerald-100/90 font-medium block">Appointments</span>
              <span className="text-[10px] text-emerald-200/70">Health logistics &amp; clinic</span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-white">1,250</span>
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" />
              4.8% from last week
            </span>
          </div>
        </div>

        {/* Card 2: Call consultancy */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Call consultancy</span>
              <span className="text-[10px] text-slate-400">Tele-consult &amp; shortages</span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-800">1,002</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" />
              40% from last week
            </span>
          </div>
        </div>

        {/* Card 3: Surgeries */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Surgeries</span>
              <span className="text-[10px] text-slate-400">Critical procedures &amp; cold-chain</span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-800">60</span>
            <span className="text-xs font-semibold text-rose-500 flex items-center gap-0.5">
              <TrendingDown className="h-3.5 w-3.5" />
              25% from last week
            </span>
          </div>
        </div>

        {/* Card 4: Total patient */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total patient</span>
              <span className="text-[10px] text-slate-400">Inpatients &amp; admissions</span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-800">1,835</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" />
              2.1% from last week
            </span>
          </div>
        </div>
      </div>

      {/* Main Middle Row: Patient Statistics Chart + Today Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart: Patient Statistics (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Patient statistics</h3>
              <p className="text-xs text-slate-400">Total patient inflows vs. in-hospital clinical bed census</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs text-slate-600">
                <button
                  onClick={() => setTimeframe('week')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    timeframe === 'week' ? 'bg-[#0c4339] text-white font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    timeframe === 'month' ? 'bg-[#0c4339] text-white font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Month
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>Year-2022</span>
              </div>
            </div>
          </div>

          {/* SVG Spline Chart */}
          <div className="relative w-full h-[240px] my-2 select-none">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="verticalBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0c4339" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0c4339" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              {[0, 1000, 2000, 3000].map((val) => {
                const y = chartHeight - 30 - (val / 3000) * (chartHeight - 60);
                return (
                  <g key={val}>
                    <line x1="30" y1={y} x2={chartWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="5" y={y + 3} fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
                      {val === 0 ? '0' : val === 1000 ? '1k' : val === 2000 ? '2k' : '3k'}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Highlight Bar for July */}
              <rect
                x={peakCoords.x - 14}
                y="15"
                width="28"
                height={chartHeight - 45}
                rx="14"
                fill="url(#verticalBarGrad)"
              />

              {/* Line 2: Inpatients (Mint Cyan line) */}
              <path
                d={inpatPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-xs"
              />

              {/* Line 1: Total Patients (Dark charcoal / deep emerald line) */}
              <path
                d={totalPath}
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-xs"
              />

              {/* Highlight Circle on the Peak Point */}
              <circle
                cx={peakCoords.x}
                cy={peakCoords.y}
                r="6"
                fill="#0c4339"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Interactive Tooltip Pill for July */}
              <g transform={`translate(${peakCoords.x}, ${peakCoords.y - 32})`}>
                <rect
                  x="-28"
                  y="-12"
                  width="56"
                  height="22"
                  rx="11"
                  fill="#0c4339"
                  className="shadow-md"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  1,856
                </text>
              </g>

              {/* Month Labels */}
              {months.map((m, idx) => {
                const x = (idx / (months.length - 1)) * (chartWidth - 60) + 40;
                return (
                  <text
                    key={m}
                    x={x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill={idx === 6 ? '#0c4339' : '#94a3b8'}
                  >
                    {m}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Chart Legends */}
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1e293b]" />
              <span className="text-slate-600 font-medium">Total patients</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              <span className="text-slate-600 font-medium">Inpatients</span>
            </div>
          </div>
        </div>

        {/* Right Schedule / Calendar Widget */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800">Today 4th Sep 2023</h3>
              </div>
              <button
                onClick={onOpenCrisisStepper}
                className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition cursor-pointer"
                title="Add Appointment or Logistics"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Weekly Days Strip */}
            <div className="grid grid-cols-6 gap-1 text-center py-2.5 border-b border-slate-100">
              {[
                { day: '3', label: 'mon', active: false },
                { day: '4', label: 'tue', active: true },
                { day: '5', label: 'wed', active: false },
                { day: '6', label: 'thu', active: false },
                { day: '7', label: 'fri', active: false },
                { day: '8', label: 'sat', active: false },
              ].map((d) => (
                <div
                  key={d.day}
                  className={`py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center transition ${
                    d.active
                      ? 'bg-[#0c4339] text-white font-bold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-bold leading-none mb-1">{d.day}</span>
                  <span className={`text-[10px] uppercase font-semibold ${d.active ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {d.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Schedule Timeline Entries */}
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-10 text-[11px] font-semibold text-slate-400 pt-0.5">09:00</span>
                <div className="flex-1 h-3 border-b border-dashed border-slate-100"></div>
              </div>

              {/* Appointment 1 */}
              <div className="flex items-start gap-3">
                <span className="w-10 text-[11px] font-semibold text-slate-400 pt-2">10:00</span>
                <div className="flex-1 rounded-xl bg-slate-50 p-2.5 border-l-4 border-l-[#0c4339] border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Dentist meetup</span>
                    <MoreHorizontal className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">10:00am - 11:00pm</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-10 text-[11px] font-semibold text-slate-400 pt-0.5">11:00</span>
                <div className="flex-1 h-3 border-b border-dashed border-slate-100"></div>
              </div>

              {/* Appointment 2 */}
              <div className="flex items-start gap-3">
                <span className="w-10 text-[11px] font-semibold text-slate-400 pt-2">12:00</span>
                <div className="flex-1 rounded-xl bg-slate-50 p-2.5 border-l-4 border-l-[#0c4339] border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Procedures</span>
                    <MoreHorizontal className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">12:00pm - 04:00pm</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-10 text-[11px] font-semibold text-slate-400 pt-0.5">01:00</span>
                <div className="flex-1 h-3 border-b border-dashed border-slate-100"></div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('redistribution')}
            className="mt-4 w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>View Full Transit Schedule</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row of 3 Cards: Balance, Room Occupancy, Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Balance */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-sm font-bold text-slate-800">Balance</h4>
            <button className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer">
              <span>Open</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="my-3 flex items-center justify-between gap-4">
            {/* Circular Donut Metric (87%) */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - 0.87)}`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-extrabold text-slate-800 block">87%</span>
              </div>
            </div>

            {/* Income & Expense Sparklines */}
            <div className="flex-1 space-y-2.5 text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Total income</span>
                  <span className="font-bold text-slate-800">$8,135,450</span>
                </div>
                {/* Mini SVG Sparkline */}
                <svg viewBox="0 0 100 16" className="w-full h-4 mt-0.5">
                  <path d="M 0 12 Q 25 2, 50 10 T 100 4" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Total expense</span>
                  <span className="font-bold text-slate-800">$7,999,000</span>
                </div>
                <svg viewBox="0 0 100 16" className="w-full h-4 mt-0.5">
                  <path d="M 0 6 Q 30 14, 60 4 T 100 10" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Transaction Revenue</span>
            <span className="text-xl font-bold text-slate-900">$136,450</span>
          </div>
        </div>

        {/* Card 2: Room Occupancy */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-sm font-bold text-slate-800">Room occupancy</h4>
            <MoreHorizontal className="h-4 w-4 text-slate-400 cursor-pointer" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">52</span>
              <span className="text-xs font-semibold text-emerald-600">+124</span>
            </div>
            <span className="text-[11px] text-slate-400">Total hospital beds currently occupied</span>
          </div>

          <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                  <Bed className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-slate-700">General room</span>
              </div>
              <span className="font-bold text-slate-900">124</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                  <Bed className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-slate-700">Private room</span>
              </div>
              <span className="font-bold text-slate-900">52</span>
            </div>
          </div>
        </div>

        {/* Card 3: Reports */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-sm font-bold text-slate-800">Reports</h4>
            <MoreHorizontal className="h-4 w-4 text-slate-400 cursor-pointer" />
          </div>

          <div className="space-y-3 my-1 text-xs">
            {/* Report 1 */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-800 truncate">A shower broken in room 123....</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">1 minute ago</span>
                <button
                  onClick={() => onNavigateTab('impact')}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                >
                  View report &rarr;
                </button>
              </div>
            </div>

            {/* Report 2 */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-800 truncate">Cold-chain excursion resolved on Van KA-04</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">1 minute ago</span>
                <button
                  onClick={() => onNavigateTab('redistribution')}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                >
                  View report &rarr;
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('impact')}
            className="mt-2 w-full py-1.5 text-center text-xs font-semibold text-slate-500 hover:text-emerald-800 cursor-pointer"
          >
            All Activity Logs &rarr;
          </button>
        </div>
      </div>

      {/* Regional Operations & State Commands Grid (Pan-India 786 Districts Scope) */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-700" />
              <span>National Health Commands &middot; {TOTAL_DISTRICTS_COUNT} Districts</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live capacity, inventory adequacy, and cold-chain compliance across all 36 States and UTs
            </p>
          </div>

          {/* State Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('ALL');
                }}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All India (36 States/UTs)</option>
                {ALL_INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name} ({s.districts.length} Districts)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* State Hubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayStates.map((state) => {
            const stateFacs = facilities.filter((f) => f.state === state.name);
            const stateFacIds = new Set(stateFacs.map((f) => f.id));
            const stateInv = inventory.filter((i) => stateFacIds.has(i.facilityId));
            const stateCrit = stateInv.filter((i) => i.riskLevel === 'CRITICAL');
            const stateHigh = stateInv.filter((i) => i.riskLevel === 'HIGH');
            const stateBeds = stateFacs.reduce((s, f) => s + f.totalBeds, 0);
            const stateOcc = stateFacs.reduce((s, f) => s + f.occupiedBeds, 0);

            return (
              <div
                key={state.code}
                className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:border-emerald-600/40 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-800">{state.name}</h4>
                      <span className="rounded bg-slate-200 text-slate-700 px-1.5 py-0.5 text-[9px] font-mono font-semibold">
                        {state.zone}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {state.districts.length} Districts &middot; Capital: {state.capital}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold font-mono ${
                      stateCrit.length > 0
                        ? 'bg-rose-100 text-rose-800'
                        : stateHigh.length > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {stateCrit.length > 0 ? `${stateCrit.length} Critical` : 'Adequate'}
                  </span>
                </div>

                {/* Progress bars */}
                <div className="mt-3.5 space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Inpatient Bed Load</span>
                      <span className="font-mono text-slate-700 font-medium">
                        {stateBeds > 0 ? `${stateOcc}/${stateBeds} (${Math.round((stateOcc / stateBeds) * 100)}%)` : 'Monitoring'}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-1.5 rounded-full bg-emerald-600"
                        style={{ width: `${stateBeds > 0 ? Math.min(100, Math.round((stateOcc / stateBeds) * 100)) : 45}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Stock Adequacy Index</span>
                      <span className="font-mono text-slate-700 font-medium">
                        {Math.max(30, 100 - (stateCrit.length * 12 + stateHigh.length * 6))}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-1.5 rounded-full bg-[#0c4339]"
                        style={{
                          width: `${Math.max(30, 100 - (stateCrit.length * 12 + stateHigh.length * 6))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">{stateFacs.length} Certified Facilities</span>
                  <button
                    onClick={() => {
                      setSelectedState(state.name);
                      onNavigateTab('inventory');
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    Explore Stock &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
