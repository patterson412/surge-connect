/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'surge-connect.s3.eu-north-1.amazonaws.com',
                port: '',
                pathname: '/**',
            },
        ],
        minimumCacheTTL: 600,
    }
};

export default nextConfig;
