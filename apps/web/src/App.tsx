import { useState } from "react";
import "./App.css";

type RailPage = "display" | "detect" | "marker" | "channel";

export default function App() {
  const [rail, setRail] = useState<RailPage>("display");
  const [auxMode, setAuxMode] = useState<"wave" | "psd">("wave");
  const [mainMode, setMainMode] = useState<"stft" | "waterfall">("stft");

  return (
    <div className="app-shell">
      <aside className="project-tree" aria-label="project-tree">
        <div className="pane-title">工程</div>
        <ul>
          <li>未打开工程</li>
          <li className="muted">添加信号文件…</li>
        </ul>
      </aside>
      <main className="workspace">
        <div className="global-nav" aria-label="global-nav">
          <span>全局时间导航（占位）</span>
        </div>
        <div className="aux-chart" aria-label="aux-chart">
          <div className="chart-toolbar">
            <button type="button" onClick={() => setAuxMode("wave")} data-active={auxMode === "wave"}>波形</button>
            <button type="button" onClick={() => setAuxMode("psd")} data-active={auxMode === "psd"}>PSD</button>
          </div>
          <div className="chart-canvas muted">{auxMode.toUpperCase()} 辅助图区</div>
        </div>
        <div className="main-chart" aria-label="main-chart">
          <div className="chart-toolbar">
            <button type="button" onClick={() => setMainMode("stft")} data-active={mainMode === "stft"}>时频</button>
            <button type="button" onClick={() => setMainMode("waterfall")} data-active={mainMode === "waterfall"}>瀑布</button>
            <span className="muted">STFT N · 色表 · 电平 · 显示 · ROI · 标记</span>
          </div>
          <div className="chart-canvas muted">{mainMode === "stft" ? "时频" : "瀑布"} 主图区（WebGL2 待接）</div>
        </div>
        <footer className="status-bar">就绪 · 源对齐 rebuild/a143-native@0f108d0</footer>
      </main>
      <aside className="right-rail" aria-label="context-rail">
        <nav className="rail-tabs">
          {([
            ["display", "显示"],
            ["detect", "检测"],
            ["marker", "标记"],
            ["channel", "通道"],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" data-active={rail === id} onClick={() => setRail(id)}>{label}</button>
          ))}
        </nav>
        <div className="rail-body">
          {rail === "display" && <p>显示参数（临时设置层稍后接入）</p>}
          {rail === "detect" && <p>检测首屏：模型 / 谱 / 范围 / 运行</p>}
          {rail === "marker" && <p>三来源标记列表（占位）</p>}
          {rail === "channel" && <p>窄带通道（真实 DDC 待接）</p>}
        </div>
      </aside>
    </div>
  );
}
