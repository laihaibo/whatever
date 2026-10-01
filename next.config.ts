import type { NextConfig } from "next";

// GitHub Pages 项目页部署：静态导出 + /whatever 基路径 + 尾斜杠（Pages 目录解析需要）
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/whatever",
  images: {
    // 静态导出要求关闭图片优化服务；封面域名为 B 站 CDN（如启用封面时直接 <img> 引用）
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "i0.hdslb.com" },
      { protocol: "https", hostname: "i1.hdslb.com" },
      { protocol: "https", hostname: "i2.hdslb.com" },
      { protocol: "https", hostname: "i3.hdslb.com" },
      { protocol: "https", hostname: "i4.hdslb.com" },
      { protocol: "https", hostname: "i9.hdslb.com" },
      { protocol: "https", hostname: "s1.hdslb.com" },
    ],
  },
};

export default nextConfig;
