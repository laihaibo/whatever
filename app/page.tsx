const REDIRECT_TARGET = "/whatever/make-money/";

/**
 * GitHub Pages 静态导出下的入口跳转页：
 * output: 'export' 不支持 redirect()，用 meta refresh + 可见链接兜底
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <meta httpEquiv="refresh" content={`0;url=${REDIRECT_TARGET}`} />
      <h1 className="text-2xl font-bold text-slate-900">赚钱心得 · 嘴比饺子馅儿碎</h1>
      <p className="text-sm text-slate-500">
        正在进入正文… 如果没有自动跳转，
        <a
          href={REDIRECT_TARGET}
          className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-4"
        >
          点此进入
        </a>
      </p>
    </main>
  );
}
