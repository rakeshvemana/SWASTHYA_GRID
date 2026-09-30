/**
 * Core type definitions for SwasthyaGrid AI
 * Track 3: Smart Health & Supply Chain Resilience
 */

export type FacilityType = 'PHC' | 'CHC' | 'Taluk Hospital' | 'District Hospital';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';

export type UserRole = 'STATE_ADMIN' | 'DISTRICT_COORDINATOR' | 'PHC_MEDICAL_OFFICER';

export type LanguageCode = 'en' | 'hi' | 'kn';

export interface HealthFacility {
  id: string;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  facilityType: FacilityType;
  totalBeds: number;
  occupiedBeds: number;
  staff: {
    doctorsSanctioned: number;
    doctorsAvailable: number;
    nursesSanctioned: number;
    nursesAvailable: number;
    pharmacistsSanctioned: number;
    pharmacistsAvailable: number;
  };
  hasColdChain: boolean;
  coldChainEquipment?: {
    ilrAvailable: boolean; // Ice-lined refrigerator
    deepFreezerAvailable: boolean;
    dgBackupAvailable: boolean;
    lastInspectedDate: string;
  };
  officialCode: string; // HMIS / NIN National Identification Number
  verificationDate: string;
  dataSource: 'HMIS_VERIFIED_GEO' | 'SYNTHETIC_SIMULATED' | string;
  lastInventoryAudit: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: 'Critical' | 'Antibiotic' | 'Maternal' | 'Emergency' | 'Chronic';
  unit: string;
  packSize: number; // e.g. 10 vials/box, 100 sachets
  minReserveDays: number; // mandatory safety threshold for donors (default 14)
  minRemainingShelfLifeDays: number; // minimum expiry buffer required for transfer
  maxTravelRadiusKm: number; // maximum permitted transit distance
  isLifeSaving: boolean;
  requiresColdChain: boolean;
  coldChainTempRange?: {
    minCelsius: number;
    maxCelsius: number;
  };
  standardLeadTimeDays: number;
  catalogSource: 'NLEM_INDIA' | 'HMIS_DRUG_CATALOG';
}

export interface InventoryItem {
  facilityId: string;
  medicineId: string;
  stockOnHand: number;
  minimumStock: number;
  safetyReserveStock: number;
  expiryDate: string; // YYYY-MM-DD
  batchNumber: string;
  dailyBurnRate: number; // units/day
  daysOfStock: number; // stockOnHand / dailyBurnRate
  riskLevel: RiskLevel;
  lastUpdated: string;
  isStale?: boolean; // True if > 48h without sync
}

export interface DemandForecast {
  facilityId: string;
  medicineId: string;
  forecastDate: string;
  horizonDays: number; // 7 or 14
  baselineDemand: number; // Simple Moving Average / Seasonal-Naive
  mlPredictedDemand: number; // Gradient-Boosted Poisson / XGBoost
  confidenceInterval: {
    lower95: number;
    upper95: number;
  };
  confidenceScore: number; // 0.0 - 1.0
  predictedDaysToStockout: number;
  riskLevel: RiskLevel;
  modelVersion: string;
  evaluationMetrics: {
    mae: number;
    rmse: number;
    wape: number;
  };
}

export type TransferStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED_RECEIVED'
  | 'REJECTED'
  | 'FLAGGED_EXCURSION';

export interface TransitTelemetry {
  vehicleNumber?: string;
  driverContact?: string;
  coldChainLoggerId?: string;
  currentTempCelsius?: number;
  temperatureExcursionDetected?: boolean;
  dispatchedAt?: string;
  estimatedArrival?: string;
  receivedAt?: string;
  receivedQuantityVerified?: number;
  receiverNotes?: string;
}

export interface ConstraintAuditDetails {
  // Constraint 1: Donor Safety (14-day reserve)
  donorReserveDaysBefore: number;
  donorReserveDaysAfter: number;
  donorReserveDaysThreshold: number; // 14 days
  donorSafetyReserveMet: boolean;
  donorRequiredReserveUnits: number;
  donorRemainingStockUnits: number;

  // Constraint 2: Recipient Need (Deficit Ceiling)
  recipientStockOnHand: number;
  recipientDailyDemand: number;
  recipientDeficitUnits: number;
  recipientAllocatedUnits: number;
  recipientDaysOfStockAfter: number;
  recipientNeedMet: boolean;

  // Constraint 3: Cold-Chain Compatibility
  coldChainRequired: boolean;
  donorColdChainReady: boolean;
  recipientColdChainReady: boolean;
  distanceKm: number;
  maxAuthorizedRadiusKm: number;
  coldChainCompatible: boolean;
  temperatureRequirement?: string;

  // Constraint 4: Batch Expiry Requirements
  batchNumber: string;
  batchExpiryDate: string;
  remainingShelfLifeDays: number;
  estimatedTransitDays: number;
  minRequiredBufferDays: number;
  effectiveExpiryBufferDays: number;
  batchExpiryMet: boolean;

  // Overall validation
  allConstraintsPassed: boolean;
  violationList: string[];
}

export interface ObjectiveFunctionDetails {
  totalCostScore: number;
  transportComponent: number;
  donorRiskComponent: number;
  expiryComponent: number;
  urgencyPriorityComponent: number;
  weightsApplied: {
    alphaTransport: number;
    betaDonorRisk: number;
    gammaExpiry: number;
    deltaUrgency: number;
  };
  formulation: string;
}

export interface TransferRecommendation {
  id: string;
  sourceFacilityId: string;
  targetFacilityId: string;
  medicineId: string;
  quantity: number;
  sourceSurplusBefore: number;
  sourceSurplusAfter: number;
  targetDeficit: number;
  distanceKm: number;
  estimatedHours: number;
  transferCostScore: number; // Weighted objective cost
  costBreakdown: {
    transportCost: number;
    donorRiskCost: number;
    expiryCost: number;
    urgencyPriorityCost?: number;
  };
  safetyChecks: {
    donorReservePreserved: boolean;
    recipientDeficitRespected: boolean;
    expiryValid: boolean;
    coldChainCompatible: boolean;
    transportWithinLeadTime: boolean;
    packSizeQuantized: boolean;
  };
  constraintAudit?: ConstraintAuditDetails;
  objectiveDetails?: ObjectiveFunctionDetails;
  rationale: string;
  status: TransferStatus;
  humanApproval?: {
    approvedBy?: string;
    approverRole?: UserRole;
    approvedAt?: string;
    notes?: string;
  };
  transitTelemetry?: TransitTelemetry;
  createdAt: string;
  isFailsafeSuppressed?: boolean;
  suppressionReason?: string;
}

export interface FederatedNode {
  id: string;
  name: string;
  district: string;
  facilityCount: number;
  localRecordsCount: number;
  localMAE: number;
  lastTrainedAt: string;
  status: 'ONLINE' | 'TRAINING' | 'SYNCED' | 'OFFLINE';
  localGradientNorm: number;
  clippingThreshold: number; // C = 1.5
  isAnomalyRejected?: boolean;
}

export interface FederatedRound {
  roundNumber: number;
  timestamp: string;
  participatingNodes: string[];
  globalLoss: number;
  globalMAE: number;
  localBaselineMAE: number;
  accuracyImprovementPct: number;
  weightsNormDelta: number;
  noiseMultiplierSigma: number;
  cumulativeEpsilonSpent: number;
  quorumMet: boolean;
}

export interface FederatedState {
  currentRound: number;
  isTraining: boolean;
  nodes: FederatedNode[];
  roundsHistory: FederatedRound[];
  globalModelVersion: string;
  differentialPrivacyEpsilon: number; // ε = 1.25
  differentialPrivacyDelta: number; // δ = 10^-5
  clippingThresholdC: number; // C = 1.5
  privacySummary: {
    rawRecordsTransferred: number;
    parameterGradientsOnly: boolean;
    explanation: string;
    threatModelCovered: string;
  };
}

export type SimulationScenarioType =
  | 'NORMAL'
  | 'DEMAND_SURGE'
  | 'DELIVERY_DELAY'
  | 'UNEVEN_DISTRIBUTION'
  | 'MULTI_FACILITY_EMERGENCY';

export interface SimulationScenario {
  type: SimulationScenarioType;
  name: string;
  description: string;
  multiplierBurnRate: number;
  deliveryDelayDays: number;
  affectedDistricts: string[];
  activeSince?: string;
}

export interface ImpactEvaluationData {
  scenario: string;
  sampleSizeDays: number;
  totalObservationRows: number;
  dataSplitting: {
    trainWindow: string;
    valWindow: string;
    testWindow: string;
  };
  baseline: {
    name: string;
    stockoutEvents: number;
    totalStockoutDays: number;
    shortageRecall7DayPct: number;
    shortageRecall14DayPct: number;
    falseAlertRatePct: number;
    avgAlertLeadTimeDays: number;
    unmetDemandQuantity: number;
    expiredUnitsWasted: number;
    mae: number;
    wape: number;
  };
  intervention: {
    name: string;
    stockoutEvents: number;
    totalStockoutDays: number;
    shortageRecall7DayPct: number;
    shortageRecall14DayPct: number;
    falseAlertRatePct: number;
    avgAlertLeadTimeDays: number;
    unmetDemandQuantity: number;
    expiredUnitsWasted: number;
    mae: number;
    wape: number;
  };
  improvementPct: {
    stockoutReduction: number;
    stockoutDaysReduction: number;
    earlyDetectionIncrease: number;
    falseAlertReduction: number;
    unmetDemandReduction: number;
    expirationWasteReduction: number;
    accuracyGainMAE: number;
    accuracyGainWAPE: number;
  };
  confidenceIntervals95: {
    stockoutReduction: [number, number];
    recallAt7Days: [number, number];
    maeIntervention: [number, number];
  };
}

export interface CloudBackupSnapshot {
  id: string;
  timestamp: string;
  hash: string;
  recordCount: number;
  sizeKb: number;
  deviceOrigin: string;
  syncLatencyMs: number;
  status: 'SYNCED' | 'RESTORED' | 'PENDING';
  dataPayload?: any;
}
