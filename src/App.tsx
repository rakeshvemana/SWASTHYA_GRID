import React, { useState, useEffect } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Bot,
  Brain,
  Cloud,
  Compass,
  Cpu,
  Globe,
  Layers,
  MapPin,
  Mic,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  WifiOff,
} from 'lucide-react';
import { MedcareSidebar } from './components/MedcareSidebar';
import { MedcareHeader } from './components/MedcareHeader';
import { OverviewTab } from './components/OverviewTab';
import { InventoryForecastTab } from './components/InventoryForecastTab';
import { RedistributionMapTab } from './components/RedistributionMapTab';
import { FederatedLearningTab } from './components/FederatedLearningTab';
import { GeminiAssistantTab } from './components/GeminiAssistantTab';
import { ImpactEvaluationTab } from './components/ImpactEvaluationTab';
import { CloudSyncModal } from './components/CloudSyncModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { SearchGroundingModal } from './components/SearchGroundingModal';
import { MapsGroundingModal } from './components/MapsGroundingModal';
import { AudioTranscribeModal } from './components/AudioTranscribeModal';
import { VisionInspectionModal } from './components/VisionInspectionModal';
import { TechStackGuideModal } from './components/TechStackGuideModal';
import { CrisisSimulationStepperModal } from './components/CrisisSimulationStepperModal';

import {
  HealthFacility,
  InventoryItem,
  Medicine,
  DemandForecast,
  TransferRecommendation,
  FederatedState,
  SimulationScenarioType,
  CloudBackupSnapshot,
  UserRole,
  LanguageCode,
} from './types';
import {
  INITIAL_FACILITIES,
  MEDICINES_CATALOG,
  generateInitialInventory,
} from './data/mockOperationalData';
import { calculateForecasts } from './services/forecastingEngine';
import {
  generateTransferRecommendations,
  RedistributionWeights,
} from './services/redistributionEngine';
import {
  INITIAL_FEDERATED_NODES,
  INITIAL_ROUNDS_HISTORY,
  runFederatedTrainingRound,
} from './services/federatedLearningEngine';
import {
  saveToOfflineCache,
  loadFromOfflineCache,
  createCloudBackupSnapshot,
  getStoredBackupSnapshots,
} from './services/cloudStorageBackupService';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  saveTransferAudit,
  testFirestoreConnection,
} from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [userRole, setUserRole] = useState<UserRole>('DISTRICT_COORDINATOR');
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');

  // Firebase User Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Modal States
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isSearchGroundingOpen, setIsSearchGroundingOpen] = useState(false);
  const [isMapsGroundingOpen, setIsMapsGroundingOpen] = useState(false);
  const [isAudioTranscribeOpen, setIsAudioTranscribeOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isTechStackOpen, setIsTechStackOpen] = useState(false);
  const [isCrisisStepperOpen, setIsCrisisStepperOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [chatTranscribedInput, setChatTranscribedInput] = useState<string>('');

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncLatencyMs, setSyncLatencyMs] = useState<number>(24);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const [backups, setBackups] = useState<CloudBackupSnapshot[]>([]);

  // Operational State
  const [facilities, setFacilities] = useState<HealthFacility[]>(INITIAL_FACILITIES);
  const [medicines] = useState<Medicine[]>(MEDICINES_CATALOG);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => generateInitialInventory());
  const [activeScenario, setActiveScenario] = useState<SimulationScenarioType>('NORMAL');
  const [burnRateMultiplier, setBurnRateMultiplier] = useState<number>(1.0);
  const [deliveryDelayDays, setDeliveryDelayDays] = useState<number>(0);

  // Forecast & Optimization Engine State
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [transfers, setTransfers] = useState<TransferRecommendation[]>([]);
  const [isScenarioLoading, setIsScenarioLoading] = useState<boolean>(false);

  // Federated State
  const [federatedState, setFederatedState] = useState<FederatedState>({
    currentRound: 4,
    isTraining: false,
    nodes: [...INITIAL_FEDERATED_NODES],
    roundsHistory: [...INITIAL_ROUNDS_HISTORY],
    globalModelVersion: 'SwasthyaFed_v4.4_GlobalFedAvg',
    differentialPrivacyEpsilon: 1.25,
    differentialPrivacyDelta: 0.00001,
    clippingThresholdC: 1.5,
    privacySummary: {
      rawRecordsTransferred: 0,
      parameterGradientsOnly: true,
      explanation: 'Differentially private FedAvg protocol active across district nodes.',
      threatModelCovered: 'Honest-but-curious aggregator & membership inference attacks',
    },
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchBackendState();
    };
    const handleOffline = () => {
      setIsOnline(false);
      saveToOfflineCache('operational_state', { facilities, inventory, forecasts, transfers, federatedState });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const cached = loadFromOfflineCache('operational_state');
    if (cached) {
      if (cached.facilities) setFacilities(cached.facilities);
      if (cached.inventory) setInventory(cached.inventory);
      if (cached.transfers) setTransfers(cached.transfers);
    }

    setBackups(getStoredBackupSnapshots());
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
    });
    return () => unsubscribe();
  }, []);

  // Sync state from server on boot
  const fetchBackendState = async () => {
    const start = performance.now();
    try {
      const res = await fetch('/api/operational-summary');
      if (res.ok) {
        const data = await res.json();
        if (data.facilities) setFacilities(data.facilities);
        if (data.inventory) setInventory(data.inventory);
        if (data.forecasts) setForecasts(data.forecasts);
        if (data.transfers) setTransfers(data.transfers);
        if (data.federatedState) setFederatedState(data.federatedState);
        if (data.activeScenario) setActiveScenario(data.activeScenario);
      }
    } catch {
      // Fallback
    } finally {
      const elapsed = Math.round(performance.now() - start);
      setSyncLatencyMs(elapsed > 0 ? elapsed : 18);
      setLastSyncedTime(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchBackendState();
  }, []);

  // Recompute local forecasts and transfers
  useEffect(() => {
    const calculatedFc = calculateForecasts(inventory, facilities, medicines, burnRateMultiplier);
    setForecasts(calculatedFc);
    const recs = generateTransferRecommendations(inventory, calculatedFc, facilities, medicines);
    setTransfers(recs);
  }, [inventory, facilities, medicines, burnRateMultiplier]);

  // Auth actions
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.warn('Google login popup cancelled or error', e);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Logout error', e);
    }
  };

  // State machine handlers
  const handleApproveTransfer = async (transferId: string) => {
    try {
      const res = await fetch(`/api/transfers/${transferId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers);
        return;
      }
    } catch {
      // Offline fallback
    }

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'APPROVED',
              humanApproval: {
                approvedBy: `Dr. Sourav Sharma (${userRole})`,
                approverRole: userRole,
                approvedAt: new Date().toISOString(),
              },
            }
          : t
      )
    );
  };

  const handleRejectTransfer = async (transferId: string) => {
    try {
      const res = await fetch(`/api/transfers/${transferId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers);
        return;
      }
    } catch {
      // Offline fallback
    }

    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'REJECTED' } : t))
    );
  };

  const handleDispatchTransfer = async (
    transferId: string,
    telemetry: { vehicleNumber: string; coldChainLoggerId: string; tempCelsius: number }
  ) => {
    try {
      const res = await fetch(`/api/transfers/${transferId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry),
      });
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers);
        return;
      }
    } catch {
      // Offline fallback
    }

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'IN_TRANSIT',
              transitTelemetry: {
                vehicleNumber: telemetry.vehicleNumber,
                coldChainLoggerId: telemetry.coldChainLoggerId,
                currentTempCelsius: telemetry.tempCelsius,
                dispatchedAt: new Date().toISOString(),
              },
            }
          : t
      )
    );
  };

  const handleConfirmReceiptTransfer = async (transferId: string, verifiedQuantity: number) => {
    try {
      const res = await fetch(`/api/transfers/${transferId}/confirm-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedQuantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers);
        setInventory(data.inventory);
        return;
      }
    } catch {
      // Offline fallback
    }

    const trf = transfers.find((t) => t.id === transferId);
    if (!trf) return;

    setInventory((prev) =>
      prev.map((item) => {
        if (item.facilityId === trf.sourceFacilityId && item.medicineId === trf.medicineId) {
          const newQty = Math.max(0, item.stockOnHand - verifiedQuantity);
          return {
            ...item,
            stockOnHand: newQty,
            daysOfStock: Math.round((newQty / (item.dailyBurnRate || 1)) * 10) / 10,
          };
        }
        if (item.facilityId === trf.targetFacilityId && item.medicineId === trf.medicineId) {
          const newQty = item.stockOnHand + verifiedQuantity;
          return {
            ...item,
            stockOnHand: newQty,
            daysOfStock: Math.round((newQty / (item.dailyBurnRate || 1)) * 10) / 10,
          };
        }
        return item;
      })
    );

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'DELIVERED_RECEIVED',
              transitTelemetry: {
                ...t.transitTelemetry,
                receivedAt: new Date().toISOString(),
                receivedQuantityVerified: verifiedQuantity,
              },
            }
          : t
      )
    );
  };

  const handleRecomputeTransfers = (weights: RedistributionWeights) => {
    const updated = generateTransferRecommendations(inventory, forecasts, facilities, medicines, weights);
    setTransfers(updated);
  };

  const handleInjectScenario = async (scenarioType: SimulationScenarioType) => {
    setIsScenarioLoading(true);
    setActiveScenario(scenarioType);

    try {
      const res = await fetch('/api/simulation/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioType }),
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory);
        setForecasts(data.forecasts);
        setTransfers(data.transfers);
        setBurnRateMultiplier(data.burnRateMultiplier);
        setDeliveryDelayDays(data.deliveryDelayDays);
        return;
      }
    } catch {
      // Fallback
    } finally {
      setIsScenarioLoading(false);
    }
  };

  const handleRunFederatedRound = async () => {
    try {
      const res = await fetch('/api/federated/round', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFederatedState(data.federatedState);
        return;
      }
    } catch {
      // Fallback
    }

    setFederatedState((prev) => ({ ...prev, isTraining: true }));
    setTimeout(() => {
      const updated = runFederatedTrainingRound(federatedState);
      setFederatedState(updated);
    }, 1200);
  };

  const handleUpdateStock = async (facilityId: string, medicineId: string, newStock: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.facilityId === facilityId && item.medicineId === medicineId) {
          return {
            ...item,
            stockOnHand: newStock,
            daysOfStock: Math.round((newStock / (item.dailyBurnRate || 1)) * 10) / 10,
          };
        }
        return item;
      })
    );
  };

  // Cloud Storage Snapshot
  const handleCreateSnapshot = async () => {
    try {
      const res = await fetch('/api/backups/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceOrigin: `WEB-CLIENT-${userRole}` }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
          setBackups((prev) => [data.snapshot, ...prev].slice(0, 15));
          return;
        }
      }
    } catch {
      // Fallback
    }

    const snap = createCloudBackupSnapshot({
      facilities,
      inventory,
      transfers,
      activeScenario,
    });
    setBackups((prev) => [snap, ...prev].slice(0, 15));
  };

  const handleRestoreSnapshot = async (snapshotId: string) => {
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId }),
      });
      if (res.ok) {
        await fetchBackendState();
        return;
      }
    } catch {
      // Fallback
    }

    const snap = backups.find((s) => s.id === snapshotId);
    if (snap && snap.dataPayload) {
      if (snap.dataPayload.inventory) setInventory(snap.dataPayload.inventory);
      if (snap.dataPayload.transfers) setTransfers(snap.dataPayload.transfers);
      if (snap.dataPayload.activeScenario) setActiveScenario(snap.dataPayload.activeScenario);
    }
  };

  const criticalStockCount = inventory.filter((i) => i.riskLevel === 'CRITICAL').length;
  const pendingTransfersCount = transfers.filter((t) => t.status === 'PROPOSED').length;

  return (
    <div className="flex h-screen w-full bg-[#f3f6f5] text-slate-800 font-sans overflow-hidden">
      {/* Medcare Sidebar (Left) */}
      <MedcareSidebar
        activeTab={activeTab}
        onTabChange={(tabId) => {
          if (tabId === 'help') {
            setIsTechStackOpen(true);
          } else {
            setActiveTab(tabId);
          }
        }}
        criticalStockCount={criticalStockCount}
        pendingTransfersCount={pendingTransfersCount}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f3f6f5]">
        {/* Medcare Top Header */}
        <MedcareHeader
          currentRole={userRole}
          onRoleChange={setUserRole}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          isOnline={isOnline}
          syncLatencyMs={syncLatencyMs}
          onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          lastSyncedTime={lastSyncedTime}
          user={currentUser}
          onLogin={handleGoogleLogin}
          onLogout={handleGoogleLogout}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          onOpenSearchGrounding={() => setIsSearchGroundingOpen(true)}
          onOpenMapsGrounding={() => setIsMapsGroundingOpen(true)}
          onOpenAudioTranscribe={() => setIsAudioTranscribeOpen(true)}
          onOpenVision={() => setIsVisionOpen(true)}
          onOpenTechStack={() => setIsTechStackOpen(true)}
          onOpenCrisisStepper={() => setIsCrisisStepperOpen(true)}
        />

        {/* Offline Banner if disconnected */}
        {!isOnline && (
          <div className="bg-amber-100 border-b border-amber-200 px-4 py-1.5 text-center text-xs font-semibold text-amber-900 flex items-center justify-center gap-2 shrink-0">
            <WifiOff className="h-3.5 w-3.5 text-amber-700" />
            <span>
              Offline Resilience Active &middot; Operating from client-side encrypted IndexedDB cache. Decisions queued for cloud reconciliation.
            </span>
          </div>
        )}

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab
              facilities={facilities}
              inventory={inventory}
              forecasts={forecasts}
              transfers={transfers}
              activeScenario={activeScenario}
              onInjectScenario={handleInjectScenario}
              onNavigateTab={setActiveTab}
              isScenarioLoading={isScenarioLoading}
              onOpenCrisisStepper={() => setIsCrisisStepperOpen(true)}
            />
          )}

          {(activeTab === 'inventory' || activeTab === 'facilities') && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {activeTab === 'facilities' ? '786 Districts & Facilities Explorer' : 'Inventory & Demand Forecasting'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    All-India NLEM inventory stocks, AI demand predictions, and facility telemetry
                  </p>
                </div>
              </div>
              <InventoryForecastTab
                facilities={facilities}
                inventory={inventory}
                medicines={medicines}
                forecasts={forecasts}
                onUpdateStock={handleUpdateStock}
              />
            </div>
          )}

          {activeTab === 'redistribution' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Constrained Redistribution Grid &middot; Transit Corridors
                  </h2>
                  <p className="text-xs text-slate-500">
                    Multi-objective optimization with donor safety reserves, cold-chain ILR validation, and batch expiry constraints
                  </p>
                </div>
              </div>
              <RedistributionMapTab
                facilities={facilities}
                inventory={inventory}
                medicines={medicines}
                transfers={transfers}
                userRole={userRole}
                onApproveTransfer={handleApproveTransfer}
                onRejectTransfer={handleRejectTransfer}
                onDispatchTransfer={handleDispatchTransfer}
                onConfirmReceiptTransfer={handleConfirmReceiptTransfer}
                onRecomputeTransfers={handleRecomputeTransfers}
                onOpenCrisisStepper={() => setIsCrisisStepperOpen(true)}
              />
            </div>
          )}

          {activeTab === 'federated' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Federated Learning Intelligence Hub
                  </h2>
                  <p className="text-xs text-slate-500">
                    Decentralized edge training across Indian state health servers with differential privacy
                  </p>
                </div>
              </div>
              <FederatedLearningTab
                federatedState={federatedState}
                onRunTrainingRound={handleRunFederatedRound}
              />
            </div>
          )}

          {activeTab === 'gemini' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Clinical Assistance &amp; MoHFW Grounding
                  </h2>
                  <p className="text-xs text-slate-500">
                    Multimodal triage, live voice dispatch, and official protocol consultation
                  </p>
                </div>
              </div>
              <GeminiAssistantTab
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
                onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
                onOpenSearchGrounding={() => setIsSearchGroundingOpen(true)}
                onOpenMapsGrounding={() => setIsMapsGroundingOpen(true)}
                onOpenAudioTranscribe={() => setIsAudioTranscribeOpen(true)}
                externalInputText={chatTranscribedInput}
                onClearExternalInput={() => setChatTranscribedInput('')}
              />
            </div>
          )}

          {(activeTab === 'impact' || activeTab === 'statistics') && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Impact Evaluation &amp; Algorithmic Benchmarks
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comparative clinical efficacy, wastage reduction, and mortality impact metrics
                  </p>
                </div>
              </div>
              <ImpactEvaluationTab />
            </div>
          )}
        </main>
      </div>

      {/* Multimodal Modals */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        backups={backups}
        isOnline={isOnline}
        syncLatencyMs={syncLatencyMs}
        onCreateSnapshot={handleCreateSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
        currentRecordCount={facilities.length + inventory.length + transfers.length}
      />

      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      <SearchGroundingModal
        isOpen={isSearchGroundingOpen}
        onClose={() => setIsSearchGroundingOpen(false)}
      />

      <MapsGroundingModal
        isOpen={isMapsGroundingOpen}
        onClose={() => setIsMapsGroundingOpen(false)}
      />

      <AudioTranscribeModal
        isOpen={isAudioTranscribeOpen}
        onClose={() => setIsAudioTranscribeOpen(false)}
        onInsertToChat={(text: string) => {
          setChatTranscribedInput(text);
          setActiveTab('gemini');
          setIsAudioTranscribeOpen(false);
        }}
      />

      <VisionInspectionModal
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
      />

      <TechStackGuideModal
        isOpen={isTechStackOpen}
        onClose={() => setIsTechStackOpen(false)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenVision={() => setIsVisionOpen(true)}
        onOpenSearch={() => setIsSearchGroundingOpen(true)}
        onOpenMaps={() => setIsMapsGroundingOpen(true)}
        onOpenTranscribe={() => setIsAudioTranscribeOpen(true)}
      />

      <CrisisSimulationStepperModal
        isOpen={isCrisisStepperOpen}
        onClose={() => setIsCrisisStepperOpen(false)}
        onExecuteFullWorkflow={() => {
          handleInjectScenario('DEMAND_SURGE');
          setIsCrisisStepperOpen(false);
        }}
      />
    </div>
  );
}
