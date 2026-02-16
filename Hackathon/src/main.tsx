import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { defineChain } from 'viem'

const kasplex = defineChain({
    id: parseInt(import.meta.env.VITE_CHAIN_ID || '167012'),
    name: 'Kasplex Testnet',
    nativeCurrency: { name: 'KAS', symbol: 'KAS', decimals: 18 },
    rpcUrls: {
        default: { http: [import.meta.env.VITE_RPC_URL || 'https://rpc.kasplextest.xyz'] },
    },
    blockExplorers: {
        default: { name: 'KasplexScan', url: import.meta.env.VITE_EXPLORER_URL || 'https://explorer.testnet.kasplextest.xyz/' },
    },
})

const config = createConfig({
    chains: [kasplex],
    transports: {
        [kasplex.id]: http(),
    },
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App />
                </ThemeProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>,
)
