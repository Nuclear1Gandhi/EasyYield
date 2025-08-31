// scripts/findDapps.ts - Remove the auto-execution part
import { getCachedDappDefinitions } from '$server/api/radixApi/radixApi';
import { RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Load env vars
// config({ path: path.resolve(__dirname, '../.env') });

export async function findCaviarAndOciswap(): Promise<void> {
  console.log('🔍 Searching for CaviarNine and Ociswap dApp definitions...\n');

  try {
    // ✅ Use cached function instead of direct API call
    const dapps = await getCachedDappDefinitions();

    console.log(`✅ Found ${dapps.length} dApp definitions total\n`);

    // Search for CaviarNine
    const caviarMatches = dapps.filter(
      (dapp) =>
        dapp.name?.toLowerCase().includes('caviar') ||
        dapp.description?.toLowerCase().includes('caviar') ||
        dapp.name?.toLowerCase().includes('nine')
    );

    // Search for Ociswap
    const ociMatches = dapps.filter(
      (dapp) =>
        dapp.name?.toLowerCase().includes('oci') ||
        dapp.description?.toLowerCase().includes('oci') ||
        dapp.name?.toLowerCase().includes('swap')
    );

    console.log('🎯 CaviarNine matches:');
    if (caviarMatches.length > 0) {
      caviarMatches.forEach((dapp) => {
        console.log(`  ✅ ${dapp.name || 'Unnamed'}`);
        console.log(`     Address: ${dapp.address}`);
        console.log(`     Description: ${dapp.description || 'N/A'}`);
        console.log(`     Icon: ${dapp.icon_url || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No matches found');
    }

    console.log('🎯 Ociswap matches:');
    if (ociMatches.length > 0) {
      ociMatches.forEach((dapp) => {
        console.log(`  ✅ ${dapp.name || 'Unnamed'}`);
        console.log(`     Address: ${dapp.address}`);
        console.log(`     Description: ${dapp.description || 'N/A'}`);
        console.log(`     Icon: ${dapp.icon_url || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No matches found');
    }

    // Show summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total dApps: ${dapps.length}`);
    console.log(`   CaviarNine matches: ${caviarMatches.length}`);
    console.log(`   Ociswap matches: ${ociMatches.length}`);
    console.log(
      `   Network: ${process.env.NETWORK_NAME || RadixNetwork.Mainnet}`
    );
  } catch (error) {
    console.error('💥 Script failed:', error);
  }
}

findCaviarAndOciswap();
