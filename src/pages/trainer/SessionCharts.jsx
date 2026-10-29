import { useCallback, useRef, useState } from "react";
import { SESSION_UNITS } from "../../data/trainingSessionOptions";
import { formatDate, formatDayMonth } from "../../utils/date";

const SPEED_HEIGHT = 200; // lớp chính: vận tốc
const HEART_HEIGHT = 96; // lớp phụ: nhịp tim, ngay dưới, chung trục x
const AXIS_HEIGHT = 22; // nhãn ngày, chỉ dưới lớp phụ
const GAP = 14;
const PAD_LEFT = 40;
const PAD_RIGHT = 18;
const PAD_TOP = 26; // chừa chỗ cho chú thích + nhãn giá trị
const HEART_DOMAIN = [140, 210]; // cố định để biên độ nhịp tim không bị phóng đại
const MIN_LABEL_GAP = 58;

const toTime = (isoDate) => new Date(`${isoDate}T00:00:00`).getTime();
const formatValue = (value, decimals = 0) => value.toLocaleString("vi-VN", { maximumFractionDigits: decimals });

// Đo độ rộng thật (callback ref: đo ngay khi gắn vào DOM, rồi theo dõi khi đổi cỡ) — vẽ SVG đúng pixel, không méo
function useElementWidth() {
  const observerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const ref = useCallback((element) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!element) return;
    setWidth(Math.floor(element.clientWidth));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    observerRef.current = observer;
  }, []);
  return [ref, width];
}

// Vùng biểu đồ tự vẽ bằng SVG (không thư viện): vận tốc (chính, có tô vùng phẳng 8%) + nhịp tim (phụ) chung trục ngày thật.
// Hover/focus/phím ←→: vạch dọc cắt qua cả 2 lớp + tooltip; báo onActivate(SessionID) để highlight hàng trong nhật ký.
// sessions: sắp theo Ngay tăng dần.
export default function SessionCharts({ sessions, activeId, onActivate }) {
  const [containerRef, width] = useElementWidth();
  const innerWidth = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const totalHeight = SPEED_HEIGHT + GAP + HEART_HEIGHT + AXIS_HEIGHT;
  const heartTop = SPEED_HEIGHT + GAP;

  // Trục x theo tỷ lệ ngày thật
  const startTime = toTime(sessions[0].Ngay);
  const endTime = toTime(sessions[sessions.length - 1].Ngay);
  const x = (isoDate) =>
    endTime === startTime ? PAD_LEFT + innerWidth / 2 : PAD_LEFT + ((toTime(isoDate) - startTime) / (endTime - startTime)) * innerWidth;

  // Trục y vận tốc: chỉ rộng hơn dữ liệu 1 đơn vị mỗi đầu rồi làm tròn ra số chẵn; 4 vạch lưới
  const speeds = sessions.map((s) => s.VanToc);
  const speedMin = Math.floor((Math.min(...speeds) - 1) / 2) * 2;
  const speedMax = Math.ceil((Math.max(...speeds) + 1) / 2) * 2;
  const speedTicks = [0, 1, 2, 3].map((i) => speedMin + ((speedMax - speedMin) * i) / 3);
  const ySpeed = (v) => PAD_TOP + (SPEED_HEIGHT - PAD_TOP) * (1 - (v - speedMin) / (speedMax - speedMin));
  // Trục y nhịp tim: cố định 140–210, 2 vạch lưới
  const heartTicks = [160, 190];
  const yHeart = (v) => heartTop + 18 + (HEART_HEIGHT - 18) * (1 - (v - HEART_DOMAIN[0]) / (HEART_DOMAIN[1] - HEART_DOMAIN[0]));

  const points = sessions.map((s) => ({ ...s, cx: x(s.Ngay), ys: ySpeed(s.VanToc), yh: yHeart(s.NhipTim) }));
  const latest = points[points.length - 1];
  const fastest = points.reduce((top, p) => (p.VanToc > top.VanToc ? p : top), points[0]);
  const speedLine = points.map((p) => `${p.cx},${p.ys}`).join(" ");
  // Vùng tô dưới đường vận tốc: khép về đáy lớp chính
  const speedArea = `${points[0].cx},${SPEED_HEIGHT} ${speedLine} ${latest.cx},${SPEED_HEIGHT}`;
  const heartLine = points.map((p) => `${p.cx},${p.yh}`).join(" ");
  // Nhãn ngày thưa vừa đủ, luôn giữ nhãn cuối
  const dateLabels = points.reduce((kept, p, i) => {
    const last = kept[kept.length - 1];
    if (!last || p.cx - last.cx >= MIN_LABEL_GAP) kept.push(p);
    else if (i === points.length - 1) kept[kept.length - 1] = p;
    return kept;
  }, []);
  const active = points.find((p) => p.SessionID === activeId);

  // Chọn buổi gần con trỏ nhất theo trục x
  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const nearest = points.reduce((best, p) => (Math.abs(p.cx - px) < Math.abs(best.cx - px) ? p : best), points[0]);
    if (nearest.SessionID !== activeId) onActivate(nearest.SessionID);
  };
  // Bàn phím: focus chọn buổi mới nhất, ←/→ chuyển buổi
  const handleKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const index = Math.max(0, points.findIndex((p) => p.SessionID === activeId));
    const next = e.key === "ArrowLeft" ? Math.max(0, index - 1) : Math.min(points.length - 1, index + 1);
    onActivate(points[next].SessionID);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label="Biểu đồ vận tốc và nhịp tim theo ngày. Dùng phím mũi tên trái phải để xem từng buổi."
      onFocus={() => !active && onActivate(latest.SessionID)}
      onBlur={() => onActivate(null)}
      onKeyDown={handleKeyDown}
      className="relative rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brass/40"
      style={{ height: totalHeight }}
    >
      {width > 0 && (
        <svg width={width} height={totalHeight} className="block" aria-hidden="true">
          {/* ---- Lớp vận tốc ---- */}
          <text x={PAD_LEFT} y={12} fontSize="11" fill="var(--color-stone)">
            Vận tốc ({SESSION_UNITS.VanToc})
          </text>
          {speedTicks.map((tick) => (
            <g key={`s${tick}`}>
              <line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={ySpeed(tick)} y2={ySpeed(tick)} stroke="var(--color-gridline)" strokeWidth="1" />
              <text x={PAD_LEFT - 8} y={ySpeed(tick)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--color-stone)">
                {formatValue(tick, 1)}
              </text>
            </g>
          ))}
          {/* Tô vùng: đúng màu mực nâu #4a2f1b, độ mờ 8%, màu phẳng */}
          <polygon points={speedArea} fill="#4a2f1b" fillOpacity="0.08" />
          <polyline points={speedLine} fill="none" stroke="var(--color-bark)" strokeWidth="2.5" strokeLinejoin="miter" />
          {points.map((p) => (
            <circle key={`sd${p.SessionID}`} cx={p.cx} cy={p.ys} r="2" fill="var(--color-bark)" />
          ))}
          {/* Nhãn trực tiếp: buổi mới nhất (vòng trắng viền nâu) + buổi nhanh nhất ("cao nhất"), trùng thì chỉ ghi 1 */}
          <circle cx={latest.cx} cy={latest.ys} r="4" fill="#fff" stroke="var(--color-bark)" strokeWidth="1.5" />
          <text x={latest.cx} y={latest.ys - 10} textAnchor="end" fontFamily="var(--font-serif)" fontSize="14" fontWeight="600" fill="var(--color-bark)">
            {formatValue(latest.VanToc, 1)}
          </text>
          {fastest.SessionID !== latest.SessionID && (
            <g>
              <text x={fastest.cx} y={fastest.ys - 22} textAnchor="middle" fontFamily="var(--font-serif)" fontSize="14" fontWeight="600" fill="var(--color-bark)">
                {formatValue(fastest.VanToc, 1)}
              </text>
              <text x={fastest.cx} y={fastest.ys - 10} textAnchor="middle" fontSize="10" fill="var(--color-stone)">
                cao nhất
              </text>
            </g>
          )}

          {/* ---- Lớp nhịp tim ---- */}
          <text x={PAD_LEFT} y={heartTop + 10} fontSize="11" fill="var(--color-stone)">
            Nhịp tim ({SESSION_UNITS.NhipTim})
          </text>
          {heartTicks.map((tick) => (
            <g key={`h${tick}`}>
              <line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={yHeart(tick)} y2={yHeart(tick)} stroke="var(--color-gridline)" strokeWidth="1" />
              <text x={PAD_LEFT - 8} y={yHeart(tick)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--color-stone)">
                {tick}
              </text>
            </g>
          ))}
          <polyline points={heartLine} fill="none" stroke="var(--color-moss)" strokeWidth="2" strokeLinejoin="miter" />
          <text x={latest.cx} y={latest.yh - 8} textAnchor="end" fontFamily="var(--font-serif)" fontSize="14" fontWeight="600" fill="var(--color-moss)">
            {latest.NhipTim}
          </text>

          {/* ---- Trục ngày (chỉ dưới lớp phụ) ---- */}
          {dateLabels.map((p) => (
            <text key={`d${p.SessionID}`} x={p.cx} y={totalHeight - 6} textAnchor="middle" fontSize="11" fill="var(--color-stone)">
              {formatDayMonth(p.Ngay)}
            </text>
          ))}

          {/* Vạch dọc hairline cắt qua cả 2 lớp tại buổi đang trỏ */}
          {active && (
            <g>
              <line x1={active.cx} x2={active.cx} y1={PAD_TOP - 6} y2={heartTop + HEART_HEIGHT} stroke="var(--color-stone)" strokeOpacity="0.45" strokeWidth="1" />
              <circle cx={active.cx} cy={active.ys} r="3.5" fill="var(--color-bark)" stroke="#fff" strokeWidth="1.5" />
              <circle cx={active.cx} cy={active.yh} r="3" fill="var(--color-moss)" stroke="#fff" strokeWidth="1.5" />
            </g>
          )}

          {/* Lớp nhận chuột phủ toàn vùng vẽ */}
          <rect
            x={PAD_LEFT - 10}
            y={0}
            width={innerWidth + 20}
            height={heartTop + HEART_HEIGHT}
            fill="transparent"
            onMouseMove={handlePointerMove}
            onMouseLeave={() => onActivate(null)}
          />
        </svg>
      )}

      {/* Tooltip: nền be nhạt viền hairline, lật sang trái khi gần mép phải */}
      {active && width > 0 && (
        <div
          className={`pointer-events-none absolute top-6 z-10 w-56 rounded-sm border border-gridline bg-[color-mix(in_srgb,var(--color-brass)_8%,white)] px-3 py-2 text-xs shadow-sm ${
            active.cx > width - 240 ? "-translate-x-full" : ""
          }`}
          style={{ left: active.cx > width - 240 ? active.cx - 10 : active.cx + 10 }}
        >
          <p className="font-medium text-ink">{formatDate(active.Ngay)}</p>
          <p className="mt-0.5 text-stone">
            Vận tốc <span className="font-semibold text-bark">{formatValue(active.VanToc, 1)}</span> {SESSION_UNITS.VanToc}
            {" · "}Nhịp tim <span className="font-semibold text-moss">{active.NhipTim}</span> {SESSION_UNITS.NhipTim}
          </p>
          <p className="text-stone">
            Chỉ số tập <span className="font-semibold text-ink">{active.ChiSoTap}</span>/100
          </p>
          {active.NhanXet && <p className="mt-1 truncate text-stone italic">{active.NhanXet}</p>}
        </div>
      )}
    </div>
  );
}
