import { ValidatorModel } from '$server/mongo/models/Validator';
import { calculateRiskScore } from '$server/utils/validatorRiskScore';
import type {
  ValidatorFilters,
  ValidatorDisplayData,
  ValidatorLSUInfo,
} from '$shared/typings/Validator';

// Service function
export async function getValidators(
  filters: ValidatorFilters
): Promise<ValidatorDisplayData[]> {
  const validators = await ValidatorModel.find(filters);
  return validators.map((validator) => ({
    ...validator.toObject(),
    stakingApy: parseFloat(validator.averageApy || '0'),
    riskScore: calculateRiskScore(validator),
  }));
}

// LSU detection function
export async function isLSUToken(
  tokenAddress: string
): Promise<ValidatorLSUInfo | null> {
  return ValidatorModel.findOne(
    { lsuTokenAddress: tokenAddress, isActive: true },
    { validatorAddress: 1, lsuTokenAddress: 1, lsuTokenSymbol: 1 }
  );
}
