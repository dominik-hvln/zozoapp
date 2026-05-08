import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    async redirects() {
        return [
            {
                source: '/',
                destination: '/login',
                permanent: true,
            },
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'mjbahhsksijztmoxrvld.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/avatars/**',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'supabase-api.zozoapp.pl',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
};

export default nextConfig;
