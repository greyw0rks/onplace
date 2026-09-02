/**
 * Fetch real ERC-8004 registered agents from BSC
 * ERC-8004 Registry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
 */
import { createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';

const ERC8004_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713';

// Minimal ERC-8004 ABI
const ERC8004_ABI = [
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getAgentProfile',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'metadataURI', type: 'string' },
      { name: 'active', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalAgents',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

async function fetchAgents() {
  const client = createPublicClient({
    chain: bsc,
    transport: http('https://bsc-dataseed1.bnbchain.org')
  });

  console.log('Fetching total agents from ERC-8004 registry...');
  
  try {
    const totalAgents = await client.readContract({
      address: ERC8004_REGISTRY,
      abi: ERC8004_ABI,
      functionName: 'totalAgents'
    });

    console.log(`Total agents registered: ${totalAgents}`);
    
    // Fetch first 100 agents
    const limit = Math.min(Number(totalAgents), 100);
    const agents = [];

    for (let i = 1; i <= limit; i++) {
      try {
        const profile = await client.readContract({
          address: ERC8004_REGISTRY,
          abi: ERC8004_ABI,
          functionName: 'getAgentProfile',
          args: [BigInt(i)]
        });
        
        agents.push({
          agentId: i,
          owner: profile[0],
          metadataURI: profile[1],
          active: profile[2]
        });
        
        if (i % 10 === 0) {
          console.log(`Fetched ${i}/${limit} agents...`);
        }
      } catch (err) {
        console.error(`Error fetching agent ${i}:`, err);
      }
    }

    console.log(`\nSuccessfully fetched ${agents.length} agents`);
    console.log('Sample agents:');
    console.log(JSON.stringify(agents.slice(0, 5), null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchAgents();
