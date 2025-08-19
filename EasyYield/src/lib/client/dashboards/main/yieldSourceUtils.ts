import type { YieldSourceDisplayData } from '$shared/typings/Api';

interface DisplayInfo {
  displayName: string;
  sourceType: string;
  cleanedName: string;
  tokenIcons: string[];
  tokenSymbols: string[];
  dappIcon: string;
}

/**
 * Get user‐friendly display info for yield sources, including icons.
 */
export function getYieldSourceDisplayInfo(
  yieldSource: YieldSourceDisplayData
): DisplayInfo {
  const {
    name,
    type,
    tokenIcons = [],
    tokenSymbols = [],
    dappIcon = '/icons/protocols/default.svg',
  } = yieldSource;

  // 1. Base cleaning
  const cleanedName = cleanResourceAddress(name);

  let displayName = cleanedName;
  let sourceType = '';

  // 2. Resource‐only logic
  if (isPrimarilyResourceAddress(name)) {
    if (type) {
      switch (type.toLowerCase()) {
        case 'caviarnine':
        case 'lsu':
          sourceType = 'Liquid Staking';
          break;
        case 'xrd-staking':
        case 'staking':
          sourceType = 'Staking';
          break;
        case 'ociswap':
        case 'dex':
          sourceType = 'DEX Pool';
          break;
        default:
          sourceType = 'DeFi';
      }
    } else {
      sourceType = 'DeFi';
    }
  }
  // 3. Name‐based logic
  else {
    const lower = cleanedName.toLowerCase();

    if (/(caviarnine|lsu)/.test(lower)) {
      displayName =
        cleanedName.replace(/caviarnine/gi, '').trim() || 'LSU Pool';
      sourceType = 'Liquid Staking';
    } else if (/xrd.*staking/.test(lower)) {
      displayName = 'Direct Validator Staking';
      sourceType = 'Staking';
    } else if (/(ociswap|dex)/.test(lower)) {
      displayName = cleanedName.replace(/ociswap/gi, '').trim() || 'DEX Pool';
      sourceType = 'DEX Pool';
    } else if (type) {
      switch (type.toLowerCase()) {
        case 'caviarnine':
        case 'lsu':
          sourceType = 'Liquid Staking';
          break;
        case 'xrd-staking':
        case 'staking':
          sourceType = 'Staking';
          break;
        case 'ociswap':
        case 'dex':
          sourceType = 'DEX Pool';
          break;
        default:
          sourceType = 'DeFi';
      }
    } else {
      sourceType = 'DeFi';
    }
  }

  // 4. Final cleanup
  if (!displayName || displayName.length < 2) {
    displayName = 'Pool';
  }
  if (displayName.length > 20) {
    displayName = `${displayName.substring(0, 20)}...`;
  }

  return {
    displayName,
    sourceType,
    cleanedName,
    tokenIcons,
    tokenSymbols,
    dappIcon,
  };
}
