import {
  HealthFacility,
  InventoryItem,
  Medicine,
  DemandForecast,
  TransferRecommendation,
  TransferStatus,
  ConstraintAuditDetails,
  ObjectiveFunctionDetails,
} from '../types';

/**
 * AI-POWERED CONSTRAINED HEALTHCARE REDISTRIBUTION ENGINE
 * 
 * =========================================================================
 * MATHEMATICAL FORMULATION & MULTI-OBJECTIVE OPTIMIZATION SPECIFICATION
 * =========================================================================
 * 
 * Let:
 *   - I be the set of eligible donor health facilities (i \in I)
 *   - J be the set of recipient health facilities in deficit (j \in J)
 *   - M be the set of NLEM medicines (m \in M)
 *   - x_{ijm} \in \mathbb{Z}^+ be the integer transfer quantity of medicine m from facility i to j.
 * 
 * -------------------------------------------------------------------------
 * 1. OBJECTIVE FUNCTION:
 * -------------------------------------------------------------------------
 * Minimize total weighted operational transfer cost:
 * 
 *   \min \sum_{i,j,m} \Big( 
 *       \alpha \cdot C_{ijm}^{\text{transport}} + 
 *       \beta  \cdot C_{im}^{\text{donorRisk}} + 
 *       \gamma \cdot C_{im}^{\text{expiry}} +
 *       \delta \cdot C_{jm}^{\text{urgency}}
 *   \Big) \cdot x_{ijm}
 * 
 * Where:
 *   - C_{ijm}^{\text{transport}} = \left( \frac{d_{ij}}{R_m^{\max}} \right) \times 100
 *       Normalized travel distance relative to the maximum thermal endurance radius R_m^{\max}.
 * 
 *   - C_{im}^{\text{donorRisk}} = \max\left(0, 1.0 - \frac{\tau_{im}^{\text{after}} - 14}{30 - 14}\right) \times 100
 *       Donor safety risk penalty. When post-transfer reserve \tau_{im}^{\text{after}} drops
 *       near the mandatory 14-day safety floor, the risk penalty rises steeply to 100.
 * 
 *   - C_{im}^{\text{expiry}} = \left( \frac{\Delta T_{im}^{\text{buffer}}}{365} \right) \times 100
 *       First-Expired, First-Out (FEFO) optimization term. Prioritizes transferring batches
 *       that have adequate shelf life but should be utilized before newer batches expire.
 * 
 *   - C_{jm}^{\text{urgency}} = (\text{PriorityFactor}_j) \times 100
 *       Clinical deficit urgency discount (CRITICAL = 0.20, HIGH = 0.60).
 * 
 * -------------------------------------------------------------------------
 * 2. EXPLICIT CLINICAL & OPERATIONAL CONSTRAINTS:
 * -------------------------------------------------------------------------
 * 
 * [CONSTRAINT 1: DONOR MANDATORY SAFETY RESERVE (>= 14 DAYS)]
 *   S_{im} - \sum_{j} x_{ijm} \ge \max(14, \text{minReserveDays}_m) \times D_{im}^{\text{daily}}
 *   A donor facility cannot donate stock if its remaining buffer would drop below 14 days of local demand.
 * 
 * [CONSTRAINT 2: RECIPIENT NEED CEILING & NON-HOARDING CAP]
 *   \sum_{i} x_{ijm} \le \text{Deficit}_{jm} = \max\left(0, \lceil 14 \times D_{jm}^{\text{daily}} \rceil - S_{jm}\right)
 *   The transfer must not over-allocate medicines beyond the recipient's verified 14-day operational need.
 * 
 * [CONSTRAINT 3: COLD-CHAIN INTEGRITY & THERMAL ENDURANCE COMPATIBILITY]
 *   If \text{requiresColdChain}(m) = \text{true}:
 *     \text{hasColdChain}(i) = \text{true} \;\land\; \text{hasColdChain}(j) = \text{true} \;\land\; d_{ij} \le R_m^{\max}
 *   Requires certified cold-chain equipment (2°C–8°C) at both nodes and travel distance within the passive container limit.
 * 
 * [CONSTRAINT 4: BATCH EXPIRY SAFETY THRESHOLD]
 *   T_{im}^{\text{shelf}} \ge t_{ij}^{\text{transit}} + T_m^{\min}
 *   Batch remaining shelf life must strictly exceed travel transit time plus the clinical minimum shelf-life threshold.
 * 
 * [CONSTRAINT 5: PACK-SIZE QUANTIZATION]
 *   x_{ijm} = k \times \text{packSize}_m, \quad k \in \mathbb{Z}^+
 *   Redistributions are packaged in sealed, quantized units.
 * 
 * [CONSTRAINT 6: DONOR CUMULATIVE ALLOCATION FEASIBILITY]
 *   \sum_{j} x_{ijm} \le S_{im} - \text{RequiredReserve}_{im}
 *   In multi-facility emergencies, cumulative donor commitments across multiple routes must never exceed total surplus.
 */

export interface RedistributionWeights {
  alphaTransport: number; // default: 0.35 (Distance & transit cost)
  betaDonorRisk: number;  // default: 0.35 (Donor comfort margin preservation)
  gammaExpiry: number;    // default: 0.20 (FEFO expiry avoidance)
  deltaUrgency: number;   // default: 0.10 (Recipient clinical urgency priority)
}

export const DEFAULT_WEIGHTS: RedistributionWeights = {
  alphaTransport: 0.35,
  betaDonorRisk: 0.35,
  gammaExpiry: 0.20,
  deltaUrgency: 0.10,
};

// Calculate Haversine distance between two coordinates in kilometers
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Calculate remaining days until expiration from an ISO date string
export function getRemainingDaysUntilExpiry(expiryDateStr: string, referenceDateStr = '2026-09-29T08:00:00Z'): number {
  const expiry = new Date(expiryDateStr);
  const now = new Date(referenceDateStr);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Explicit Constraint 1 Verification: Donor Safety (14-Day Mandatory Reserve)
 */
export function checkDonorSafetyConstraint(
  donorStockOnHand: number,
  candidateDailyDemand: number,
  transferQuantity: number,
  minReserveDays = 14
): {
  isMet: boolean;
  requiredReserveUnits: number;
  remainingStockUnits: number;
  daysOfStockBefore: number;
  daysOfStockAfter: number;
  violationMessage?: string;
} {
  const effectiveReserveDays = Math.max(14, minReserveDays);
  const requiredReserveUnits = Math.ceil(candidateDailyDemand * effectiveReserveDays);
  const remainingStockUnits = donorStockOnHand - transferQuantity;
  const daysOfStockBefore = parseFloat((donorStockOnHand / Math.max(0.1, candidateDailyDemand)).toFixed(1));
  const daysOfStockAfter = parseFloat((remainingStockUnits / Math.max(0.1, candidateDailyDemand)).toFixed(1));
  const isMet = remainingStockUnits >= requiredReserveUnits && daysOfStockAfter >= 14.0;

  return {
    isMet,
    requiredReserveUnits,
    remainingStockUnits,
    daysOfStockBefore,
    daysOfStockAfter,
    violationMessage: isMet
      ? undefined
      : `Donor safety constraint violated: post-transfer days of stock (${daysOfStockAfter}d) dips below the mandatory 14-day safety floor (${effectiveReserveDays}d).`,
  };
}

/**
 * Explicit Constraint 2 Verification: Recipient Need (14-Day Target Deficit Ceiling)
 */
export function checkRecipientNeedConstraint(
  recipientStockOnHand: number,
  recipientDailyDemand: number,
  allocatedTransferQuantity: number,
  targetDays = 14
): {
  isMet: boolean;
  deficitUnits: number;
  target14DayStockUnits: number;
  daysOfStockAfter: number;
  violationMessage?: string;
} {
  const target14DayStockUnits = Math.ceil(recipientDailyDemand * targetDays);
  const deficitUnits = Math.max(0, target14DayStockUnits - recipientStockOnHand);
  const daysOfStockAfter = parseFloat(
    ((recipientStockOnHand + allocatedTransferQuantity) / Math.max(0.1, recipientDailyDemand)).toFixed(1)
  );
  const isMet = allocatedTransferQuantity > 0 && allocatedTransferQuantity <= deficitUnits;

  return {
    isMet,
    deficitUnits,
    target14DayStockUnits,
    daysOfStockAfter,
    violationMessage: isMet
      ? undefined
      : `Recipient need constraint violated: transfer quantity (${allocatedTransferQuantity}) exceeds the calculated deficit ceiling (${deficitUnits}) or is non-positive.`,
  };
}

/**
 * Explicit Constraint 3 Verification: Cold-Chain Compatibility & Transit Radius
 */
export function checkColdChainConstraint(
  requiresColdChain: boolean,
  donorHasColdChain: boolean,
  recipientHasColdChain: boolean,
  distanceKm: number,
  maxTravelRadiusKm: number
): {
  isMet: boolean;
  temperatureRequirement: string;
  violationMessage?: string;
} {
  const temperatureRequirement = requiresColdChain ? '2°C to 8°C (Certified Passive Shipper / ILR)' : 'Ambient Room Temperature (15°C–25°C)';

  if (!requiresColdChain) {
    const isWithinRadius = distanceKm <= maxTravelRadiusKm;
    return {
      isMet: isWithinRadius,
      temperatureRequirement,
      violationMessage: isWithinRadius
        ? undefined
        : `Transport radius boundary exceeded: distance (${distanceKm} km) exceeds maximum authorized radius (${maxTravelRadiusKm} km).`,
    };
  }

  const bothHaveColdChain = donorHasColdChain && recipientHasColdChain;
  const isWithinRadius = distanceKm <= maxTravelRadiusKm;
  const isMet = bothHaveColdChain && isWithinRadius;

  let violationMessage: string | undefined;
  if (!bothHaveColdChain) {
    violationMessage = `Cold-chain equipment missing: both donor (${donorHasColdChain ? 'Ready' : 'Missing'}) and recipient (${recipientHasColdChain ? 'Ready' : 'Missing'}) must possess certified ILR storage.`;
  } else if (!isWithinRadius) {
    violationMessage = `Cold-chain thermal endurance exceeded: route distance (${distanceKm} km) exceeds passive cooler maximum threshold (${maxTravelRadiusKm} km).`;
  }

  return {
    isMet,
    temperatureRequirement,
    violationMessage,
  };
}

/**
 * Explicit Constraint 4 Verification: Batch Expiry Safety Buffer
 */
export function checkBatchExpiryConstraint(
  expiryDateStr: string,
  estimatedHours: number,
  minRemainingShelfLifeDays = 45
): {
  isMet: boolean;
  remainingShelfLifeDays: number;
  estimatedTransitDays: number;
  effectiveExpiryBufferDays: number;
  violationMessage?: string;
} {
  const remainingShelfLifeDays = getRemainingDaysUntilExpiry(expiryDateStr);
  const estimatedTransitDays = Math.max(1, Math.ceil(estimatedHours / 24));
  const effectiveExpiryBufferDays = remainingShelfLifeDays - (estimatedTransitDays + minRemainingShelfLifeDays);
  const isMet = effectiveExpiryBufferDays >= 0;

  return {
    isMet,
    remainingShelfLifeDays,
    estimatedTransitDays,
    effectiveExpiryBufferDays,
    violationMessage: isMet
      ? undefined
      : `Batch expiry constraint violated: batch remaining shelf life (${remainingShelfLifeDays} days) is less than transit time (${estimatedTransitDays}d) + mandatory hospital buffer (${minRemainingShelfLifeDays}d).`,
  };
}

/**
 * Evaluates the explicit mathematical objective cost function for a candidate transfer.
 */
export function evaluateObjectiveCost(
  distanceKm: number,
  maxTravelRadiusKm: number,
  donorDaysAfter: number,
  remainingShelfLifeDays: number,
  minRemainingShelfLifeDays: number,
  recipientRiskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL',
  weights: RedistributionWeights = DEFAULT_WEIGHTS
): {
  totalCostScore: number;
  transportComponent: number;
  donorRiskComponent: number;
  expiryComponent: number;
  urgencyPriorityComponent: number;
  formulation: string;
} {
  // 1. Normalized transport cost C_trans = (d / d_max) * 100
  const normalizedDistance = Math.min(1.0, distanceKm / Math.max(1, maxTravelRadiusKm));
  const transportComponent = parseFloat((normalizedDistance * weights.alphaTransport * 100).toFixed(2));

  // 2. Donor risk penalty C_donorRisk:
  // Evaluates risk as donor buffer approaches 14 days (30d+ = 0 penalty, 14d = 100 penalty)
  const donorRiskNormalized = Math.max(0.0, Math.min(1.0, 1.0 - (donorDaysAfter - 14.0) / 16.0));
  const donorRiskComponent = parseFloat((donorRiskNormalized * weights.betaDonorRisk * 100).toFixed(2));

  // 3. FEFO Expiry prioritization C_expiry:
  // Balances sufficient shelf-life with dispatching batches that should be consumed before expiring
  const bufferOverThreshold = Math.max(0, remainingShelfLifeDays - minRemainingShelfLifeDays);
  const expiryScore = Math.max(0.05, Math.min(1.0, bufferOverThreshold / 365.0));
  const expiryComponent = parseFloat((expiryScore * weights.gammaExpiry * 100).toFixed(2));

  // 4. Clinical Urgency Priority factor C_urgency:
  // Lower score gives higher priority to critical emergencies
  const urgencyFactor = recipientRiskLevel === 'CRITICAL' ? 0.20 : recipientRiskLevel === 'HIGH' ? 0.60 : 1.0;
  const urgencyPriorityComponent = parseFloat((urgencyFactor * weights.deltaUrgency * 100).toFixed(2));

  const totalCostScore = parseFloat(
    (transportComponent + donorRiskComponent + expiryComponent + urgencyPriorityComponent).toFixed(2)
  );

  const formulation = `min Cost = ${weights.alphaTransport}·Transport(${transportComponent}) + ${weights.betaDonorRisk}·DonorRisk(${donorRiskComponent}) + ${weights.gammaExpiry}·Expiry(${expiryComponent}) + ${weights.deltaUrgency}·Urgency(${urgencyPriorityComponent})`;

  return {
    totalCostScore,
    transportComponent,
    donorRiskComponent,
    expiryComponent,
    urgencyPriorityComponent,
    formulation,
  };
}

/**
 * Main Algorithm: Generates mathematically verified redistribution proposals
 * enforcing all 4 primary clinical constraints and solving the constrained objective function.
 */
export function generateTransferRecommendations(
  inventory: InventoryItem[],
  forecasts: DemandForecast[],
  facilities: HealthFacility[],
  medicines: Medicine[],
  weights: RedistributionWeights = DEFAULT_WEIGHTS
): TransferRecommendation[] {
  const recommendations: TransferRecommendation[] = [];

  const facilityMap = new Map(facilities.map((f) => [f.id, f]));
  const medicineMap = new Map(medicines.map((m) => [m.id, m]));
  const forecastMap = new Map(forecasts.map((fc) => [`${fc.facilityId}_${fc.medicineId}`, fc]));

  // Track cumulative allocations per donor facility and medicine to strictly prevent multi-route over-allocation
  const cumulativeDonorAllocatedUnits = new Map<string, number>();

  // Step 1: Identify all facilities facing shortage (CRITICAL or HIGH risk)
  // Sort recipients by clinical urgency: CRITICAL before HIGH, then by lowest days of stock
  const shortageCandidates = inventory
    .filter((item) => item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH')
    .sort((a, b) => {
      if (a.riskLevel === 'CRITICAL' && b.riskLevel !== 'CRITICAL') return -1;
      if (b.riskLevel === 'CRITICAL' && a.riskLevel !== 'CRITICAL') return 1;
      return a.daysOfStock - b.daysOfStock;
    });

  shortageCandidates.forEach((recipientItem) => {
    const recipientFac = facilityMap.get(recipientItem.facilityId);
    const medicine = medicineMap.get(recipientItem.medicineId);
    const recipientForecast = forecastMap.get(`${recipientItem.facilityId}_${recipientItem.medicineId}`);
    if (!recipientFac || !medicine) return;

    // Daily demand from ML forecast (or fallback to historical burn rate)
    const targetDailyDemand = recipientForecast
      ? recipientForecast.mlPredictedDemand / Math.max(1, recipientForecast.horizonDays)
      : recipientItem.dailyBurnRate;

    // Deficit required to achieve a safe 14-day operational buffer
    const targetStockRequired = Math.ceil(targetDailyDemand * 14);
    const deficitRaw = Math.max(0, targetStockRequired - recipientItem.stockOnHand);
    if (deficitRaw <= 0) return;

    // Pack size quantization: round up to integer multiples of packSize
    const packSize = medicine.packSize || 10;
    const deficit = Math.ceil(deficitRaw / packSize) * packSize;

    // Step 2: Screen eligible candidate donor facilities
    const potentialDonors: Array<{
      donorItem: InventoryItem;
      donorFac: HealthFacility;
      availableSurplus: number;
      transferQty: number;
      distanceKm: number;
      estimatedHours: number;
      costEvaluation: ReturnType<typeof evaluateObjectiveCost>;
      constraintAudit: ConstraintAuditDetails;
      isFailsafeSuppressed: boolean;
      suppressionReason?: string;
    }> = [];

    inventory
      .filter((item) => item.medicineId === recipientItem.medicineId && item.facilityId !== recipientItem.facilityId)
      .forEach((candidateItem) => {
        const candidateFac = facilityMap.get(candidateItem.facilityId);
        if (!candidateFac) return;

        const candidateForecast = forecastMap.get(`${candidateItem.facilityId}_${candidateItem.medicineId}`);
        const candidateDaily = candidateForecast
          ? candidateForecast.mlPredictedDemand / Math.max(1, candidateForecast.horizonDays)
          : candidateItem.dailyBurnRate;

        // Cumulative previously committed stock for this donor
        const donorKey = `${candidateFac.id}_${candidateItem.medicineId}`;
        const alreadyCommitted = cumulativeDonorAllocatedUnits.get(donorKey) || 0;
        const currentEffectiveStock = candidateItem.stockOnHand - alreadyCommitted;

        // Constraint 1: Donor Safety Reserve (>= 14 days mandatory reserve)
        const effectiveDonorReserveDays = Math.max(14, medicine.minReserveDays);
        const requiredDonorReserve = Math.ceil(candidateDaily * effectiveDonorReserveDays);
        const availableSurplusRaw = currentEffectiveStock - requiredDonorReserve;

        if (availableSurplusRaw <= 0) return; // Strict exclusion: no surplus above 14-day reserve

        // Quantize available surplus to packaging units
        const availableSurplus = Math.floor(availableSurplusRaw / packSize) * packSize;
        if (availableSurplus < packSize) return;

        const candidateTransferQty = Math.min(availableSurplus, deficit);
        if (candidateTransferQty <= 0) return;

        // Calculate Haversine transit distance
        const distanceKm = calculateHaversineDistanceKm(
          candidateFac.latitude,
          candidateFac.longitude,
          recipientFac.latitude,
          recipientFac.longitude
        );

        // Transit speed: 45 km/h rural roads + 30 min packaging/loading
        const estimatedHours = parseFloat((distanceKm / 45 + 0.5).toFixed(1));

        // Evaluate all 4 explicit constraints
        const donorSafetyCheck = checkDonorSafetyConstraint(
          currentEffectiveStock,
          candidateDaily,
          candidateTransferQty,
          effectiveDonorReserveDays
        );

        const recipientNeedCheck = checkRecipientNeedConstraint(
          recipientItem.stockOnHand,
          targetDailyDemand,
          candidateTransferQty,
          14
        );

        const coldChainCheck = checkColdChainConstraint(
          !!medicine.requiresColdChain,
          !!candidateFac.hasColdChain,
          !!recipientFac.hasColdChain,
          distanceKm,
          medicine.maxTravelRadiusKm
        );

        const expiryCheck = checkBatchExpiryConstraint(
          candidateItem.expiryDate,
          estimatedHours,
          medicine.minRemainingShelfLifeDays
        );

        const packSizeQuantized = candidateTransferQty % packSize === 0;

        const violationList: string[] = [];
        if (!donorSafetyCheck.isMet && donorSafetyCheck.violationMessage) violationList.push(donorSafetyCheck.violationMessage);
        if (!recipientNeedCheck.isMet && recipientNeedCheck.violationMessage) violationList.push(recipientNeedCheck.violationMessage);
        if (!coldChainCheck.isMet && coldChainCheck.violationMessage) violationList.push(coldChainCheck.violationMessage);
        if (!expiryCheck.isMet && expiryCheck.violationMessage) violationList.push(expiryCheck.violationMessage);
        if (!packSizeQuantized) violationList.push(`Pack size quantization violated: ${candidateTransferQty} is not a multiple of ${packSize}.`);
        if (candidateItem.isStale) violationList.push('Donor inventory audit timestamp is stale (> 48 hours without sync verification).');

        const allConstraintsPassed = violationList.length === 0;

        const constraintAudit: ConstraintAuditDetails = {
          donorReserveDaysBefore: donorSafetyCheck.daysOfStockBefore,
          donorReserveDaysAfter: donorSafetyCheck.daysOfStockAfter,
          donorReserveDaysThreshold: effectiveDonorReserveDays,
          donorSafetyReserveMet: donorSafetyCheck.isMet,
          donorRequiredReserveUnits: donorSafetyCheck.requiredReserveUnits,
          donorRemainingStockUnits: donorSafetyCheck.remainingStockUnits,

          recipientStockOnHand: recipientItem.stockOnHand,
          recipientDailyDemand: parseFloat(targetDailyDemand.toFixed(1)),
          recipientDeficitUnits: recipientNeedCheck.deficitUnits,
          recipientAllocatedUnits: candidateTransferQty,
          recipientDaysOfStockAfter: recipientNeedCheck.daysOfStockAfter,
          recipientNeedMet: recipientNeedCheck.isMet,

          coldChainRequired: !!medicine.requiresColdChain,
          donorColdChainReady: !!candidateFac.hasColdChain,
          recipientColdChainReady: !!recipientFac.hasColdChain,
          distanceKm,
          maxAuthorizedRadiusKm: medicine.maxTravelRadiusKm,
          coldChainCompatible: coldChainCheck.isMet,
          temperatureRequirement: coldChainCheck.temperatureRequirement,

          batchNumber: candidateItem.batchNumber,
          batchExpiryDate: candidateItem.expiryDate,
          remainingShelfLifeDays: expiryCheck.remainingShelfLifeDays,
          estimatedTransitDays: expiryCheck.estimatedTransitDays,
          minRequiredBufferDays: medicine.minRemainingShelfLifeDays,
          effectiveExpiryBufferDays: expiryCheck.effectiveExpiryBufferDays,
          batchExpiryMet: expiryCheck.isMet,

          allConstraintsPassed,
          violationList,
        };

        // Evaluate Objective Cost
        const costEvaluation = evaluateObjectiveCost(
          distanceKm,
          medicine.maxTravelRadiusKm,
          donorSafetyCheck.daysOfStockAfter,
          expiryCheck.remainingShelfLifeDays,
          medicine.minRemainingShelfLifeDays,
          recipientItem.riskLevel,
          weights
        );

        potentialDonors.push({
          donorItem: candidateItem,
          donorFac: candidateFac,
          availableSurplus,
          transferQty: candidateTransferQty,
          distanceKm,
          estimatedHours,
          costEvaluation,
          constraintAudit,
          isFailsafeSuppressed: !allConstraintsPassed,
          suppressionReason: violationList[0],
        });
      });

    if (potentialDonors.length === 0) return;

    // Filter viable donors: strictly only candidates where all 4 constraints are satisfied
    const validDonors = potentialDonors.filter((d) => d.constraintAudit.allConstraintsPassed);
    
    // Select the donor that strictly minimizes the objective function among constraint-valid candidates
    const selectedCandidate = validDonors.length > 0
      ? validDonors.sort((a, b) => a.costEvaluation.totalCostScore - b.costEvaluation.totalCostScore)[0]
      : potentialDonors[0]; // If none viable, provide the closest with full audit of failed constraints

    const transferQty = selectedCandidate.transferQty;
    const sourceSurplusBefore = selectedCandidate.donorItem.stockOnHand;
    const sourceSurplusAfter = sourceSurplusBefore - transferQty;

    // Update cumulative allocation tally to safeguard donor reserve in cascading shortage events
    const donorKey = `${selectedCandidate.donorFac.id}_${selectedCandidate.donorItem.medicineId}`;
    cumulativeDonorAllocatedUnits.set(
      donorKey,
      (cumulativeDonorAllocatedUnits.get(donorKey) || 0) + transferQty
    );

    const audit = selectedCandidate.constraintAudit;
    const rationale = selectedCandidate.isFailsafeSuppressed
      ? `TRANSFER SUPPRESSED BY CONSTRAINT VIOLATION: ${selectedCandidate.suppressionReason}`
      : `Optimal Constrained Transfer of ${transferQty} ${medicine.unit} (${Math.round(transferQty / packSize)} packs of ${packSize}) ` +
        `from ${selectedCandidate.donorFac.name} to ${recipientFac.name}. ` +
        `Recipient deficit is ${deficit} ${medicine.unit} (${recipientItem.daysOfStock}d stock). ` +
        `Donor preserves ${sourceSurplusAfter} ${medicine.unit} (${audit.donorReserveDaysAfter} days reserve >= ${audit.donorReserveDaysThreshold}d mandatory floor). ` +
        `Haversine distance: ${selectedCandidate.distanceKm} km (~${selectedCandidate.estimatedHours}h transit <= ${medicine.maxTravelRadiusKm}km limit). ` +
        `Cold-chain: ${audit.temperatureRequirement}. ` +
        `Batch ${audit.batchNumber} has ${audit.remainingShelfLifeDays}d shelf life (+${audit.effectiveExpiryBufferDays}d above ${audit.minRequiredBufferDays}d clinical threshold). ` +
        `Objective Cost Score: ${selectedCandidate.costEvaluation.totalCostScore} (${selectedCandidate.costEvaluation.formulation}).`;

    recommendations.push({
      id: `TRF-${recipientFac.id.substring(4, 7)}-${selectedCandidate.donorFac.id.substring(4, 7)}-${medicine.id}`,
      sourceFacilityId: selectedCandidate.donorFac.id,
      targetFacilityId: recipientFac.id,
      medicineId: medicine.id,
      quantity: transferQty,
      sourceSurplusBefore,
      sourceSurplusAfter,
      targetDeficit: deficit,
      distanceKm: selectedCandidate.distanceKm,
      estimatedHours: selectedCandidate.estimatedHours,
      transferCostScore: selectedCandidate.costEvaluation.totalCostScore,
      costBreakdown: {
        transportCost: selectedCandidate.costEvaluation.transportComponent,
        donorRiskCost: selectedCandidate.costEvaluation.donorRiskComponent,
        expiryCost: selectedCandidate.costEvaluation.expiryComponent,
        urgencyPriorityCost: selectedCandidate.costEvaluation.urgencyPriorityComponent,
      },
      safetyChecks: {
        donorReservePreserved: audit.donorSafetyReserveMet,
        recipientDeficitRespected: audit.recipientNeedMet,
        expiryValid: audit.batchExpiryMet,
        coldChainCompatible: audit.coldChainCompatible,
        transportWithinLeadTime: audit.distanceKm <= audit.maxAuthorizedRadiusKm,
        packSizeQuantized: transferQty % packSize === 0,
      },
      constraintAudit: audit,
      objectiveDetails: {
        totalCostScore: selectedCandidate.costEvaluation.totalCostScore,
        transportComponent: selectedCandidate.costEvaluation.transportComponent,
        donorRiskComponent: selectedCandidate.costEvaluation.donorRiskComponent,
        expiryComponent: selectedCandidate.costEvaluation.expiryComponent,
        urgencyPriorityComponent: selectedCandidate.costEvaluation.urgencyPriorityComponent,
        weightsApplied: { ...weights },
        formulation: selectedCandidate.costEvaluation.formulation,
      },
      rationale,
      status: 'PROPOSED',
      isFailsafeSuppressed: selectedCandidate.isFailsafeSuppressed,
      suppressionReason: selectedCandidate.suppressionReason,
      createdAt: new Date().toISOString(),
    });
  });

  return recommendations;
}
