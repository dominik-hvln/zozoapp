import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        ],
    },
};

export default nextConfig;
