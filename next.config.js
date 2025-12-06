
/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    images: {
        unoptimized: true,
    },

    trailingSlash: true,
    skipTrailingSlashRedirect: true,
//    output: "export",
//    distDir: "docs"
}

module.exports = nextConfig
