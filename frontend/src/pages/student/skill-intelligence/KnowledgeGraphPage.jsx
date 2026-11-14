// frontend/src/pages/student/skill-intelligence/KnowledgeGraphPage.jsx
// Knowledge Graph Explorer – SI-04 (SaaS 2026 Celestial Nebula & Pathway Architecture)
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { skillIntelligenceApi } from '../../../api/skill-intelligence';
import { Link } from 'react-router-dom';

const PROFICIENCY_VI = {
  beginner: 'Mới bắt đầu (Cấp 1)',
  elementary: 'Cơ bản (Cấp 2)',
  intermediate: 'Trung cấp (Cấp 3)',
  advanced: 'Nâng cao (Cấp 4)',
  expert: 'Chuyên gia (Cấp 5)',
};

const PROFICIENCY_LEVEL_NAMES = {
  1: 'Mới bắt đầu',
  2: 'Cơ bản',
  3: 'Trung cấp',
  4: 'Nâng cao',
  5: 'Chuyên gia',
};

// Unified category mapping supporting aliases
const CATEGORY_MAP = {
  'Frontend': {
    name: 'Frontend',
    icon: '⚡',
    color: '#3b82f6',
    glow: '#60a5fa',
    bg: '#1d4ed8',
    gradient: ['#3b82f6', '#1d4ed8'],
    light: '#eff6ff',
    border: '#93c5fd',
    text: '#1d4ed8',
    anchor: { x: -200, y: -160 },
  },
  'Backend': {
    name: 'Backend',
    icon: '⚙️',
    color: '#10b981',
    glow: '#34d399',
    bg: '#047857',
    gradient: ['#10b981', '#047857'],
    light: '#ecfdf5',
    border: '#a7f3d0',
    text: '#047857',
    anchor: { x: 210, y: -150 },
  },
  'Database': {
    name: 'Database',
    icon: '💾',
    color: '#f59e0b',
    glow: '#fbbf24',
    bg: '#b45309',
    gradient: ['#f59e0b', '#b45309'],
    light: '#fffbeb',
    border: '#fde68a',
    text: '#b45309',
    anchor: { x: 270, y: 70 },
  },
  'DevOps': {
    name: 'DevOps & Cloud',
    icon: '🚀',
    color: '#8b5cf6',
    glow: '#a78bfa',
    bg: '#6d28d9',
    gradient: ['#8b5cf6', '#6d28d9'],
    light: '#f5f3ff',
    border: '#ddd6fe',
    text: '#6d28d9',
    anchor: { x: 20, y: 240 },
  },
  'AI/Data Science': {
    name: 'AI & Data Science',
    icon: '🧠',
    color: '#ec4899',
    glow: '#f472b6',
    bg: '#be185d',
    gradient: ['#ec4899', '#be185d'],
    light: '#fdf2f8',
    border: '#fbcfe8',
    text: '#be185d',
    anchor: { x: -240, y: 130 },
  },
  'UI/UX': {
    name: 'UI/UX Design',
    icon: '🎨',
    color: '#06b6d4',
    glow: '#22d3ee',
    bg: '#0e7490',
    gradient: ['#06b6d4', '#0e7490'],
    light: '#ecfeff',
    border: '#a5f3fc',
    text: '#0e7490',
    anchor: { x: -290, y: -20 },
  },
  'Khác': {
    name: 'Khác',
    icon: '📦',
    color: '#64748b',
    glow: '#94a3b8',
    bg: '#334155',
    gradient: ['#64748b', '#334155'],
    light: '#f8fafc',
    border: '#cbd5e1',
    text: '#334155',
    anchor: { x: 0, y: -250 },
  },
};

function normalizeCategory(raw) {
  if (!raw) return 'Khác';
  const lower = raw.toLowerCase();
  if (lower.includes('front') || lower.includes('web dev')) return 'Frontend';
  if (lower.includes('back')) return 'Backend';
  if (lower.includes('data') && (lower.includes('base') || lower.includes('sql') || lower.includes('store'))) return 'Database';
  if (lower.includes('devops') || lower.includes('cloud') || lower.includes('infra')) return 'DevOps';
  if (lower.includes('ai') || lower.includes('artific') || lower.includes('machine') || lower.includes('deep') || lower.includes('data sci')) return 'AI/Data Science';
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('figma')) return 'UI/UX';
  return 'Khác';
}

const EDGE_CONFIG = {
  HAS_SKILL: {
    color: '#334155',
    activeColor: '#6366f1',
    width: 1.2,
    dash: '4,4',
    label: 'Kỹ năng sở hữu',
    showByDefault: false,
  },
  PREREQUISITE_OF: {
    color: '#ef4444',
    glow: '#f87171',
    width: 2.4,
    dash: '',
    label: 'Tiên quyết (Cần học trước)',
    marker: 'url(#arrow-prereq)',
  },
  COMPLEMENTARY_TO: {
    color: '#c084fc',
    glow: '#e879f9',
    width: 2.0,
    dash: '6,4',
    label: 'Bổ trợ lẫn nhau',
    marker: 'url(#arrow-comp)',
  },
  RELATED_TO: {
    color: '#38bdf8',
    glow: '#7dd3fc',
    width: 1.8,
    dash: '5,3',
    label: 'Liên quan trực tiếp',
    marker: 'url(#arrow-related)',
  },
};

// ==========================================
// NODE DETAIL INSPECTOR PANEL
// ==========================================
function NodeDetailPanel({ node, onClose, onExplore, allNodes, allEdges }) {
  const [related, setRelated] = useState([]);
  const [prereqs, setPrereqs] = useState([]);
  const [loadingR, setLoadingR] = useState(false);

  useEffect(() => {
    if (!node || node.type !== 'skill' || !node.id) return;
    setLoadingR(true);
    Promise.all([
      skillIntelligenceApi.getRelatedSkills(node.id),
      skillIntelligenceApi.getPrerequisites(node.id, 2),
    ])
      .then(([r, p]) => {
        setRelated(r?.data?.data || r?.data || []);
        setPrereqs(p?.data?.data || p?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingR(false));
  }, [node?.id]);

  if (!node) return null;

  const catKey = normalizeCategory(node.category);
  const theme = CATEGORY_MAP[catKey] || CATEGORY_MAP['Khác'];
  const level = node.proficiencyLevel || 1;
  const levelPercent = Math.min(100, Math.round((level / 5) * 100));

  // Find incoming & outgoing relations directly from loaded graph
  const incomingPrereqs = (allEdges || []).filter(
    (e) => e.to === node.id && e.type === 'PREREQUISITE_OF'
  );
  const outgoingUnlocks = (allEdges || []).filter(
    (e) => e.from === node.id && e.type === 'PREREQUISITE_OF'
  );
  const complementarySkills = (allEdges || []).filter(
    (e) => (e.from === node.id || e.to === node.id) && e.type === 'COMPLEMENTARY_TO'
  );

  return (
    <div className="bg-white/95 dark:bg-[#1e1e1e] backdrop-blur-xl border border-stone-200/90 dark:border-neutral-700/80 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-xl"
            style={{
              backgroundColor: node.type === 'student' ? '#7c3aed' : theme.color,
              boxShadow: `0 6px 16px ${node.type === 'student' ? 'rgba(124,58,237,0.35)' : 'rgba(59,130,246,0.3)'}`,
            }}
          >
            {node.type === 'student' ? '👤' : theme.icon}
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base flex items-center gap-1.5">
              <span>{node.label}</span>
              {node.status === 'confirmed' && (
                <span className="text-emerald-500 text-xs" title="Đã xác thực">✓</span>
              )}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: theme.light, color: theme.text, border: `1px solid ${theme.border}` }}
              >
                {theme.name}
              </span>
              {node.proficiencyLevel && (
                <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded-full">
                  Cấp độ {node.proficiencyLevel}/5
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 flex items-center justify-center font-bold text-xs transition"
          title="Đóng panel"
        >
          ✕
        </button>
      </div>

      {node.type === 'skill' && (
        <>
          {/* Level Progress Indicator */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Trình độ thành thạo:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {PROFICIENCY_LEVEL_NAMES[level]} ({levelPercent}%)
              </span>
            </div>
            <div className="w-full bg-stone-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 shadow-sm"
                style={{
                  width: `${levelPercent}%`,
                  backgroundColor: theme.color,
                }}
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-stone-50 dark:bg-neutral-800/80 p-2.5 rounded-xl border border-stone-100 dark:border-neutral-700">
              <span className="text-stone-400 dark:text-stone-500 block text-[10px] font-semibold uppercase">Trạng thái</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <span>✓</span>
                <span>{node.status === 'confirmed' ? 'Đã xác thực' : 'Tự khai báo'}</span>
              </span>
            </div>
            <div className="bg-stone-50 dark:bg-neutral-800/80 p-2.5 rounded-xl border border-stone-100 dark:border-neutral-700">
              <span className="text-stone-400 dark:text-stone-500 block text-[10px] font-semibold uppercase">Độ tin cậy</span>
              <span className="font-bold text-violet-600 dark:text-violet-400 mt-0.5 block">
                {Math.round((node.confidence || 0.95) * 100)}%
              </span>
            </div>
          </div>

          {/* Relationships Explorer */}
          <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                Mối quan hệ tri thức
              </span>
              {loadingR && <span className="text-[11px] text-violet-600 animate-spin">⏳</span>}
            </div>

            {/* Prerequisites */}
            <div>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-1.5">
                <span>🔴</span>
                <span>Điều kiện Tiên quyết (Cần học trước):</span>
              </span>
              {prereqs.length > 0 || incomingPrereqs.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(prereqs.length > 0 ? prereqs : incomingPrereqs).map((item, idx) => {
                    const label = item.name || item.fromNode?.label || 'Kỹ năng';
                    const targetNode = allNodes?.find((n) => n.label?.toLowerCase() === label.toLowerCase());
                    return (
                      <button
                        key={idx}
                        onClick={() => targetNode && onExplore(targetNode)}
                        className="text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold px-2.5 py-1 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/80 transition shadow-2xs flex items-center gap-1"
                      >
                        <span>{label}</span>
                        {targetNode && <span className="text-[10px] opacity-75">Lv.{targetNode.proficiencyLevel}</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic">
                  ✓ Kỹ năng nền tảng cơ sở – không yêu cầu môn tiên quyết.
                </p>
              )}
            </div>

            {/* Unlocks / Next steps */}
            {outgoingUnlocks.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1.5">
                  <span>🟢</span>
                  <span>Mở khóa các kỹ năng nâng cao tiếp theo:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {outgoingUnlocks.map((edge, idx) => {
                    const targetNode = edge.toNode || allNodes?.find((n) => n.id === edge.to);
                    return (
                      <button
                        key={idx}
                        onClick={() => targetNode && onExplore(targetNode)}
                        className="text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition shadow-2xs"
                      >
                        {targetNode?.label || 'Kỹ năng'} →
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complementary */}
            {(related.length > 0 || complementarySkills.length > 0) && (
              <div>
                <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 mb-1.5">
                  <span>🟣</span>
                  <span>Kỹ năng Bổ trợ & Hợp lực tốt nhất:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(related.length > 0 ? related : complementarySkills).map((item, idx) => {
                    const label = item.name || item.fromNode?.label || item.toNode?.label;
                    const targetNode = allNodes?.find((n) => n.label?.toLowerCase() === label?.toLowerCase());
                    return (
                      <button
                        key={idx}
                        onClick={() => targetNode && onExplore(targetNode)}
                        className="text-xs bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 text-violet-700 dark:text-violet-300 font-semibold px-2.5 py-1 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/80 transition shadow-2xs"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-2 border-t border-stone-100 dark:border-neutral-800 space-y-2">
            <Link
              to="/app/skill-intelligence/analyze"
              className="w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>Phân tích khoảng cách & lộ trình học</span>
            </Link>
            <Link
              to="/app/quizzes"
              className="w-full text-center bg-stone-50 dark:bg-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-700 border border-stone-200 dark:border-neutral-700 text-stone-700 dark:text-stone-200 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <span>🎯</span>
              <span>Làm bài kiểm tra đánh giá năng lực</span>
            </Link>
          </div>
        </>
      )}

      {node.type === 'student' && (
        <div className="text-xs text-gray-600 space-y-3 pt-1">
          <p className="leading-relaxed">
            Tâm điểm đại diện cho hồ sơ của <strong>{node.label}</strong> trong Vũ trụ Tri thức. Từ đây, mạng lưới lan tỏa tới tất cả cụm kỹ năng chuyên môn.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl text-indigo-900 leading-relaxed space-y-1">
            <p className="font-bold">💡 Thao tác trực quan:</p>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-indigo-800">
              <li><strong>Kéo & thả (Drag):</strong> Giữ chuột vào bất kỳ hành tinh kỹ năng nào để di chuyển tùy ý.</li>
              <li><strong>Nhấp chuột:</strong> Xem chi tiết chuỗi tiên quyết và kỹ năng bổ trợ.</li>
              <li><strong>Lăn chuột:</strong> Thu phóng (Zoom in / Zoom out) toàn cảnh đồ thị.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN KNOWLEDGE GRAPH PAGE
// ==========================================
export default function KnowledgeGraphPage() {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [showCenterLines, setShowCenterLines] = useState(true);
  const [showClusterBounds, setShowClusterBounds] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'roadmap' | 'cards'
  const [orbitalMotion, setOrbitalMotion] = useState(true);

  // Custom dragged positions map: { [nodeId]: { x, y } }
  const [customPositions, setCustomPositions] = useState({});

  // Node Dragging State
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragNodeOffset, setDragNodeOffset] = useState({ x: 0, y: 0 });

  // Canvas Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Load Graph Data
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await skillIntelligenceApi.getMyGraph();
      const data = res?.data?.data || res?.data || res || { nodes: [], edges: [] };
      setGraph(data);
    } catch {
      setError('Không thể tải dữ liệu đồ thị tri thức.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Compute Layout Positions (Deterministic Domain Clusters with Drag Support)
  const layout = useMemo(() => {
    if (!graph?.nodes) return { nodeMap: new Map(), positionedNodes: [], edges: [], clusters: [] };

    const nodeMap = new Map();
    const positionedNodes = [];

    // Center student node strictly at (0, 0)
    const studentNode = graph.nodes.find((n) => n.type === 'student') || {
      id: 'student-me',
      type: 'student',
      label: 'Học viên',
    };
    const studentCustom = customPositions[studentNode.id];
    const studentPos = {
      ...studentNode,
      x: studentCustom ? studentCustom.x : 0,
      y: studentCustom ? studentCustom.y : 0,
      radius: 44,
    };
    nodeMap.set(studentNode.id, studentPos);
    positionedNodes.push(studentPos);

    // Group skills by normalized category
    const skillNodes = graph.nodes.filter((n) => n.type === 'skill');
    const categoryGroups = {};

    skillNodes.forEach((node) => {
      const catKey = normalizeCategory(node.category);
      if (!categoryGroups[catKey]) categoryGroups[catKey] = [];
      categoryGroups[catKey].push(node);
    });

    const clusters = [];

    Object.keys(categoryGroups).forEach((catKey) => {
      const theme = CATEGORY_MAP[catKey] || CATEGORY_MAP['Khác'];
      const anchor = theme.anchor || { x: 0, y: 0 };
      const nodes = categoryGroups[catKey];

      // Sort nodes within cluster by proficiency level (or prerequisite order)
      nodes.sort((a, b) => (a.proficiencyLevel || 1) - (b.proficiencyLevel || 1));

      // Calculate cluster bounds
      clusters.push({
        name: catKey,
        displayName: theme.name,
        icon: theme.icon,
        color: theme.color,
        light: theme.light,
        border: theme.border,
        x: anchor.x,
        y: anchor.y,
        count: nodes.length,
      });

      // Distribute nodes with generous spacing around cluster anchor
      const count = nodes.length;
      nodes.forEach((node, idx) => {
        const custom = customPositions[node.id];
        let x, y;

        if (custom) {
          x = custom.x;
          y = custom.y;
        } else if (count === 1) {
          x = anchor.x;
          y = anchor.y;
        } else if (count === 2) {
          x = anchor.x + (idx === 0 ? -48 : 48);
          y = anchor.y + (idx === 0 ? -15 : 15);
        } else if (count === 3) {
          const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
          const dist = 55;
          x = Math.round(anchor.x + dist * Math.cos(angles[idx]));
          y = Math.round(anchor.y + dist * Math.sin(angles[idx]));
        } else if (count === 4) {
          // 4-box layout with ample breathing room
          const offsets = [
            { x: -55, y: -45 },
            { x: 55, y: -45 },
            { x: -55, y: 45 },
            { x: 55, y: 45 },
          ];
          x = anchor.x + offsets[idx].x;
          y = anchor.y + offsets[idx].y;
        } else {
          // Circle ring around cluster anchor
          const angleStep = (2 * Math.PI) / count;
          const angle = idx * angleStep - Math.PI / 2;
          const dist = Math.max(65, 30 + count * 8);
          x = Math.round(anchor.x + dist * Math.cos(angle));
          y = Math.round(anchor.y + dist * Math.sin(angle));
        }

        const radius = Math.min(32, Math.max(26, 22 + (node.proficiencyLevel || 1) * 2));
        const posNode = {
          ...node,
          x,
          y,
          radius,
          categoryKey: catKey,
        };
        nodeMap.set(node.id, posNode);
        positionedNodes.push(posNode);
      });
    });

    // Resolve Edges
    const edges = (graph.edges || [])
      .map((e) => {
        const fromNode = nodeMap.get(e.from);
        const toNode = nodeMap.get(e.to);
        if (!fromNode || !toNode) return null;
        return { ...e, fromNode, toNode };
      })
      .filter(Boolean);

    return { nodeMap, positionedNodes, edges, clusters };
  }, [graph, customPositions]);

  // Connected Nodes Set for Spotlight Highlighting
  const connectedNodeIds = useMemo(() => {
    const focusNode = selectedNode || hoveredNode;
    if (!focusNode) return null;
    const ids = new Set([focusNode.id]);
    layout.edges.forEach((e) => {
      if (e.fromNode.id === focusNode.id) ids.add(e.toNode.id);
      if (e.toNode.id === focusNode.id) ids.add(e.fromNode.id);
    });
    return ids;
  }, [selectedNode, hoveredNode, layout.edges]);

  // Active Edge IDs for Highlighting
  const activeEdgeKeys = useMemo(() => {
    const focusNode = selectedNode || hoveredNode;
    if (!focusNode) return null;
    const set = new Set();
    layout.edges.forEach((e, idx) => {
      if (e.fromNode.id === focusNode.id || e.toNode.id === focusNode.id) {
        set.add(idx);
      }
    });
    return set;
  }, [selectedNode, hoveredNode, layout.edges]);

  // ==========================================
  // MOUSE & DRAG HANDLERS
  // ==========================================
  // Start dragging a node
  const handleNodeMouseDown = (nodeId, e) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const node = layout.nodeMap.get(nodeId);
    if (!node) return;

    // Convert mouse to SVG coordinates
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseSvgX = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom;
    const mouseSvgY = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom;

    setDraggedNodeId(nodeId);
    setDragNodeOffset({ x: mouseSvgX - node.x, y: mouseSvgY - node.y });
  };

  // Start panning canvas
  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanOrigin({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Move handler (handles both node dragging & canvas panning)
  const handleMouseMove = (e) => {
    if (draggedNodeId) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseSvgX = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom;
      const mouseSvgY = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom;

      const newX = Math.round(mouseSvgX - dragNodeOffset.x);
      const newY = Math.round(mouseSvgY - dragNodeOffset.y);

      setCustomPositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: newX, y: newY },
      }));
    } else if (isPanning) {
      setPan({ x: e.clientX - panOrigin.x, y: e.clientY - panOrigin.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(2.5, Math.max(0.4, Number((z + delta).toFixed(2)))));
  };

  // Reset view to default
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // Reset custom node positions
  const handleResetPositions = () => {
    setCustomPositions({});
    setSelectedNode(null);
  };

  // Focus & explore target node
  const handleExplore = useCallback(
    (target) => {
      const found = layout.positionedNodes.find(
        (n) => n.id === target.id || n.label?.toLowerCase() === target.label?.toLowerCase()
      );
      if (found) {
        setSelectedNode(found);
        setPan({ x: -found.x * zoom, y: -found.y * zoom });
      }
    },
    [layout.positionedNodes, zoom]
  );

  // Filter Categories
  const allCategories = useMemo(() => {
    const set = new Set();
    graph?.nodes?.forEach((n) => {
      if (n.type === 'skill') set.add(normalizeCategory(n.category));
    });
    return Array.from(set);
  }, [graph]);

  const skillCount = graph?.nodes?.filter((n) => n.type === 'skill').length || 0;
  const relCount = graph?.edges?.filter((e) => e.type !== 'HAS_SKILL').length || 0;
  const expertCount = graph?.nodes?.filter((n) => (n.proficiencyLevel || 1) >= 4).length || 0;

  // Filtered nodes based on category, level, and search
  const visibleNodes = useMemo(() => {
    return layout.positionedNodes.filter((node) => {
      if (node.type === 'student') return true;
      if (filterCategory !== 'ALL' && node.categoryKey !== filterCategory) return false;
      if (filterLevel !== 'ALL') {
        const lvl = node.proficiencyLevel || 1;
        if (filterLevel === 'basic' && lvl > 2) return false;
        if (filterLevel === 'mid' && lvl !== 3) return false;
        if (filterLevel === 'advanced' && lvl < 4) return false;
      }
      if (searchTerm && !node.label.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [layout.positionedNodes, filterCategory, filterLevel, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* CSS Animations & Glow Styles */}
      <style>{`
        @keyframes pulseHalo {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        @keyframes edgeFlowRed {
          to { stroke-dashoffset: -32; }
        }
        @keyframes edgeFlowPurple {
          to { stroke-dashoffset: -28; }
        }
        @keyframes orbitSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .saas-pulse-halo {
          transform-origin: 0px 0px;
          animation: pulseHalo 3.2s ease-in-out infinite;
        }
        .saas-flow-red {
          stroke-dasharray: 6, 4;
          animation: edgeFlowRed 1.1s linear infinite;
        }
        .saas-flow-purple {
          stroke-dasharray: 6, 4;
          animation: edgeFlowPurple 1.4s linear infinite;
        }
        .saas-orbit-ring {
          transform-origin: 0px 0px;
          animation: orbitSlow 90s linear infinite;
        }
      `}</style>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-700/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-neutral-800 border border-violet-100 dark:border-neutral-700 flex items-center justify-center text-2xl shadow-xs">
            🌐
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Đồ thị Kỹ năng & Vũ trụ Tri thức Thông minh
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Bản đồ năng lực tương tác SaaS 2026: Phân cụm chuyên môn, chuỗi tiên quyết và kéo thả trực quan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/app/skill-intelligence/analyze"
            className="text-xs bg-violet-50 dark:bg-violet-950/70 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200/80 dark:border-violet-800 text-violet-700 dark:text-violet-300 font-bold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-xs"
          >
            <span>⚡</span>
            <span>Phân tích & Khoảng cách Kỹ năng</span>
          </Link>
          <Link
            to="/app/skill-intelligence/profile"
            className="text-xs bg-stone-50 dark:bg-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-700 border border-stone-200 dark:border-neutral-700 text-stone-700 dark:text-stone-200 font-semibold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5"
          >
            <span>👤</span>
            <span>Hồ sơ Kỹ năng</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl font-medium">
          {error}
        </div>
      )}

      {/* Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 rounded-2xl p-4 shadow-xs text-center">
          <p className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">{skillCount}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">Kỹ năng đã tích lũy</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 rounded-2xl p-4 shadow-xs text-center">
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{relCount}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">Liên kết tri thức</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 rounded-2xl p-4 shadow-xs text-center">
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{allCategories.length}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">Cụm lĩnh vực chuyên môn</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 rounded-2xl p-4 shadow-xs text-center">
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{expertCount}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">Kỹ năng chuyên sâu (Lv.4-5)</p>
        </div>
      </div>

      {/* Main Content & Sidebar Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Column: Canvas / Roadmap / Matrix */}
        <div className="flex-1 w-full space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition shadow-2xs ${
                  filterCategory === 'ALL'
                    ? 'bg-stone-900 dark:bg-neutral-700 text-white'
                    : 'bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-700'
                }`}
              >
                Tất cả ({skillCount})
              </button>
              {allCategories.map((catKey) => {
                const theme = CATEGORY_MAP[catKey] || CATEGORY_MAP['Khác'];
                const count = graph?.nodes?.filter(
                  (n) => n.type === 'skill' && normalizeCategory(n.category) === catKey
                ).length || 0;
                const active = filterCategory === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setFilterCategory(catKey)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition ${
                      active
                        ? 'text-white shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-neutral-800/80 border border-stone-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-700'
                    }`}
                    style={{ backgroundColor: active ? theme.color : undefined }}
                  >
                    <span>{theme.icon}</span>
                    <span>{theme.name} ({count})</span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-stone-100 dark:bg-neutral-800 p-0.5 rounded-xl border border-stone-200 dark:border-neutral-700 text-xs">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'graph' ? 'bg-white dark:bg-neutral-700 shadow-xs text-violet-700 dark:text-violet-300' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <span>🪐</span>
                  <span>Vũ trụ Mạng</span>
                </button>
                <button
                  onClick={() => setViewMode('roadmap')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'roadmap' ? 'bg-white dark:bg-neutral-700 shadow-xs text-violet-700 dark:text-violet-300' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <span>🌳</span>
                  <span>Cây Lộ trình</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'cards' ? 'bg-white dark:bg-neutral-700 shadow-xs text-violet-700 dark:text-violet-300' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <span>📊</span>
                  <span>Ma trận Thẻ</span>
                </button>
              </div>

              {/* Canvas Zoom & Reset Controls */}
              {viewMode === 'graph' && (
                <div className="flex items-center gap-1 bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-xl px-2 py-1 text-xs">
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
                    className="w-6 h-6 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-700 rounded"
                    title="Thu nhỏ"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-stone-700 dark:text-stone-300">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 0.2, 2.2))}
                    className="w-6 h-6 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-700 rounded"
                    title="Phóng to"
                  >
                    +
                  </button>
                  <button
                    onClick={handleResetView}
                    className="text-[11px] text-violet-600 dark:text-violet-400 font-bold px-1.5 py-0.5 hover:underline"
                    title="Căn giữa góc nhìn"
                  >
                    Fit
                  </button>
                  {Object.keys(customPositions).length > 0 && (
                    <button
                      onClick={handleResetPositions}
                      className="text-[11px] text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 hover:underline"
                      title="Khôi phục vị trí mặc định của các nút"
                    >
                      ↺ Vị trí
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: INTERACTIVE GRAPH CANVAS */}
          {viewMode === 'graph' && (
            <div className="relative bg-[#080d1a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl select-none">
              {/* Floating Instructions HUD */}
              <div className="absolute top-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-slate-300 text-xs px-3.5 py-1.5 rounded-full pointer-events-none flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Kéo thả nút để sắp xếp</span>
                <span className="text-slate-600">•</span>
                <span>Kéo nền để di chuyển</span>
                <span className="text-slate-600">•</span>
                <span>Lăn chuột để zoom</span>
              </div>

              {/* Floating Quick Toggles */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={() => setShowCenterLines((p) => !p)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition ${
                    showCenterLines
                      ? 'bg-indigo-600/80 border-indigo-400 text-white'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400'
                  }`}
                  title="Bật/Tắt đường liên kết từ tâm học viên tới các kỹ năng"
                >
                  Tia liên kết: {showCenterLines ? 'Bật' : 'Tắt'}
                </button>
                <button
                  onClick={() => setShowClusterBounds((p) => !p)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition ${
                    showClusterBounds
                      ? 'bg-indigo-600/80 border-indigo-400 text-white'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400'
                  }`}
                  title="Bật/Tắt vùng sáng bao quanh cụm kỹ năng"
                >
                  Vùng sáng cụm: {showClusterBounds ? 'Bật' : 'Tắt'}
                </button>
                <button
                  onClick={() => setOrbitalMotion((p) => !p)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition ${
                    orbitalMotion
                      ? 'bg-indigo-600/80 border-indigo-400 text-white'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400'
                  }`}
                  title="Bật/Tắt hiệu ứng dòng chảy ánh sáng"
                >
                  Dòng chảy: {orbitalMotion ? 'Bật' : 'Tắt'}
                </button>
              </div>

              {/* SVG Canvas */}
              <svg
                ref={svgRef}
                viewBox="-550 -420 1100 840"
                className="w-full h-[680px] cursor-grab active:cursor-grabbing"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* SVG Definitions */}
                <defs>
                  {/* Subtle Celestial Grid Pattern */}
                  <pattern id="celestial-grid" width="45" height="45" patternUnits="userSpaceOnUse">
                    <circle cx="22.5" cy="22.5" r="1.2" fill="#334155" opacity="0.4" />
                  </pattern>

                  {/* Core Galaxy Radial Glow */}
                  <radialGradient id="galaxy-core-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#312e81" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#080d1a" stopOpacity="0" />
                  </radialGradient>

                  {/* Arrowhead Markers */}
                  <marker
                    id="arrow-prereq"
                    viewBox="0 0 10 10"
                    refX="25"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ef4444" />
                  </marker>
                  <marker
                    id="arrow-comp"
                    viewBox="0 0 10 10"
                    refX="24"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#c084fc" />
                  </marker>
                  <marker
                    id="arrow-related"
                    viewBox="0 0 10 10"
                    refX="24"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Grid Background */}
                <rect x="-550" y="-420" width="1100" height="840" fill="url(#celestial-grid)" />

                {/* Transformed Content Group */}
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Cosmic Core Glow */}
                  <circle cx="0" cy="0" r="420" fill="url(#galaxy-core-glow)" pointerEvents="none" />

                  {/* Concentric Orbital Distance Rings */}
                  <circle cx="0" cy="0" r="150" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,6" opacity="0.6" />
                  <circle cx="0" cy="0" r="280" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,8" opacity="0.45" />

                  {/* Rotating Orbit Track */}
                  {orbitalMotion && (
                    <g pointerEvents="none" className="saas-orbit-ring">
                      <circle cx="0" cy="0" r="210" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.2" strokeDasharray="6,10" />
                    </g>
                  )}

                  {/* DOMAIN CLUSTER NEBULA AURAS & LABELS */}
                  {showClusterBounds &&
                    layout.clusters.map((cluster, idx) => {
                      const isCatMatch = filterCategory === 'ALL' || filterCategory === cluster.name;
                      return (
                        <g key={`cluster-${idx}`} opacity={isCatMatch ? 0.9 : 0.15} className="transition-opacity">
                          {/* Soft Cluster Cloud Aura */}
                          <circle
                            cx={cluster.x}
                            cy={cluster.y}
                            r={Math.max(90, 45 + cluster.count * 15)}
                            fill={cluster.color}
                            opacity="0.07"
                            pointerEvents="none"
                          />
                          <circle
                            cx={cluster.x}
                            cy={cluster.y}
                            r={Math.max(90, 45 + cluster.count * 15)}
                            fill="none"
                            stroke={cluster.color}
                            strokeWidth="1"
                            strokeDasharray="4,6"
                            opacity="0.25"
                            pointerEvents="none"
                          />

                          {/* Domain Badge Header */}
                          <g transform={`translate(${cluster.x}, ${cluster.y - Math.max(95, 55 + cluster.count * 15)})`}>
                            <rect
                              x="-50"
                              y="-11"
                              width="100"
                              height="22"
                              rx="11"
                              fill="#0f172a"
                              stroke={cluster.color}
                              strokeWidth="1.2"
                              opacity="0.9"
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fill={cluster.color}
                              fontSize="10"
                              fontWeight="bold"
                              className="pointer-events-none tracking-wider"
                            >
                              {cluster.icon} {cluster.displayName.toUpperCase()}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                  {/* EDGES: 1. Optional Conduits from Student Center */}
                  {showCenterLines &&
                    layout.edges
                      .filter((e) => e.type === 'HAS_SKILL')
                      .map((edge, idx) => {
                        const isCatMatch =
                          filterCategory === 'ALL' ||
                          normalizeCategory(edge.toNode.category) === filterCategory;
                        if (!isCatMatch) return null;

                        const isConnected =
                          !connectedNodeIds ||
                          (connectedNodeIds.has(edge.fromNode.id) && connectedNodeIds.has(edge.toNode.id));

                        return (
                          <line
                            key={`has-${idx}`}
                            x1={edge.fromNode.x}
                            y1={edge.fromNode.y}
                            x2={edge.toNode.x}
                            y2={edge.toNode.y}
                            stroke="#6366f1"
                            strokeWidth={isConnected ? 1.5 : 0.8}
                            strokeDasharray="4,6"
                            opacity={isConnected ? 0.45 : 0.15}
                          />
                        );
                      })}

                  {/* EDGES: 2. Knowledge Graph Directed Relationships (Curved Bezier Paths) */}
                  {layout.edges
                    .filter((e) => e.type !== 'HAS_SKILL')
                    .map((edge, idx) => {
                      const cfg = EDGE_CONFIG[edge.type] || EDGE_CONFIG.RELATED_TO;
                      const isCatMatch =
                        filterCategory === 'ALL' ||
                        normalizeCategory(edge.fromNode.category) === filterCategory ||
                        normalizeCategory(edge.toNode.category) === filterCategory;

                      const isEdgeActive = activeEdgeKeys ? activeEdgeKeys.has(idx) : false;
                      const isConnected =
                        !connectedNodeIds ||
                        (connectedNodeIds.has(edge.fromNode.id) && connectedNodeIds.has(edge.toNode.id));

                      const opacity = !isCatMatch ? 0.06 : isEdgeActive ? 1 : isConnected ? 0.85 : 0.15;

                      // Gentle Bezier Curvature Calculation
                      const dx = edge.toNode.x - edge.fromNode.x;
                      const dy = edge.toNode.y - edge.fromNode.y;
                      // Curve gently outward
                      const cx = (edge.fromNode.x + edge.toNode.x) / 2 - dy * 0.15;
                      const cy = (edge.fromNode.y + edge.toNode.y) / 2 + dx * 0.15;

                      const pathD = `M ${edge.fromNode.x} ${edge.fromNode.y} Q ${cx} ${cy} ${edge.toNode.x} ${edge.toNode.y}`;

                      // Flow class for animation
                      const flowClass =
                        orbitalMotion && isConnected
                          ? edge.type === 'PREREQUISITE_OF'
                            ? 'saas-flow-red'
                            : 'saas-flow-purple'
                          : '';

                      return (
                        <g key={`rel-${idx}`} className="transition-opacity duration-300" opacity={opacity}>
                          {/* Glow backdrop on active edge */}
                          {isConnected && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke={cfg.glow || cfg.color}
                              strokeWidth={cfg.width + (isEdgeActive ? 4.5 : 2.5)}
                              opacity={isEdgeActive ? 0.45 : 0.2}
                            />
                          )}

                          {/* Primary relation path */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke={cfg.color}
                            strokeWidth={isEdgeActive ? cfg.width + 1.2 : cfg.width}
                            strokeDasharray={cfg.dash}
                            markerEnd={cfg.marker}
                            className={flowClass}
                          />
                        </g>
                      );
                    })}

                  {/* NODES: Positioned with Absolute Stability & Interactive Dragging */}
                  {layout.positionedNodes.map((node) => {
                    const isStudent = node.type === 'student';
                    const catKey = normalizeCategory(node.category);
                    const theme = CATEGORY_MAP[catKey] || CATEGORY_MAP['Khác'];
                    const isCatMatch = filterCategory === 'ALL' || isStudent || catKey === filterCategory;

                    const isSelected = selectedNode?.id === node.id;
                    const isHovered = hoveredNode?.id === node.id;
                    const isConnected = !connectedNodeIds || connectedNodeIds.has(node.id);
                    const opacity = !isCatMatch ? 0.12 : isConnected ? 1 : 0.22;

                    // STUDENT CENTER NODE
                    if (isStudent) {
                      return (
                        <g
                          key={node.id}
                          transform={`translate(${node.x}, ${node.y})`}
                          className="cursor-pointer"
                          onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                          onClick={() => setSelectedNode(node)}
                          onMouseEnter={() => setHoveredNode(node)}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          {/* Outer pulse aura */}
                          <circle
                            cx="0"
                            cy="0"
                            r={node.radius + 14}
                            fill="#6366f1"
                            opacity="0.2"
                            className="saas-pulse-halo"
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r={node.radius + 6}
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="1.6"
                            strokeDasharray="4,4"
                          />

                          {/* Core Body */}
                          <circle
                            cx="0"
                            cy="0"
                            r={node.radius}
                            fill="#4338ca"
                            stroke="#a5b4fc"
                            strokeWidth="2.8"
                            style={{ filter: 'drop-shadow(0 6px 18px rgba(79,70,229,0.5))' }}
                          />
                          <text x="0" y="-3" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="bold">
                            👤
                          </text>
                          <text
                            x="0"
                            y="17"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="extrabold"
                            className="select-none"
                          >
                            {node.label || 'Tôi'}
                          </text>
                        </g>
                      );
                    }

                    // SKILL NODES (Draggable & Clickable)
                    const lvl = node.proficiencyLevel || 1;
                    const ringCircumference = 2 * Math.PI * (node.radius + 3);
                    const ringStrokeDash = (lvl / 5) * ringCircumference;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        className="cursor-pointer transition-opacity duration-300"
                        opacity={opacity}
                        onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                        onClick={() => setSelectedNode(node)}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        {/* Glow halo when selected or hovered */}
                        {(isSelected || isHovered) && (
                          <circle
                            cx="0"
                            cy="0"
                            r={node.radius + 10}
                            fill="none"
                            stroke={theme.glow}
                            strokeWidth="3.5"
                            opacity="0.9"
                          />
                        )}

                        {/* Outer Proficiency Level Progress Ring */}
                        <circle
                          cx="0"
                          cy="0"
                          r={node.radius + 3}
                          fill="none"
                          stroke="#1e293b"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r={node.radius + 3}
                          fill="none"
                          stroke={theme.glow}
                          strokeWidth="2.5"
                          strokeDasharray={`${ringStrokeDash} ${ringCircumference}`}
                          strokeLinecap="round"
                          transform="rotate(-90)"
                        />

                        {/* Node Spherical Body */}
                        <circle
                          cx="0"
                          cy="0"
                          r={node.radius}
                          fill={theme.color}
                          stroke={isSelected ? '#ffffff' : theme.glow}
                          strokeWidth={isSelected ? 3 : 1.5}
                          style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.6))' }}
                        />

                        {/* Glossy top specular reflection */}
                        <ellipse
                          cx="0"
                          cy={-node.radius * 0.42}
                          rx={node.radius * 0.55}
                          ry={node.radius * 0.25}
                          fill="#ffffff"
                          opacity="0.32"
                          pointerEvents="none"
                        />

                        {/* Skill Label Text */}
                        <text
                          x="0"
                          y="1"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#ffffff"
                          fontSize={node.radius > 27 ? '11' : '9.5'}
                          fontWeight="bold"
                          className="pointer-events-none drop-shadow-sm select-none"
                        >
                          {node.label}
                        </text>

                        {/* Level Badge Pill */}
                        <g transform={`translate(${node.radius * 0.72}, ${-node.radius * 0.72})`}>
                          <rect
                            x="-11"
                            y="-8"
                            width="22"
                            height="16"
                            rx="8"
                            fill="#0f172a"
                            stroke={theme.glow}
                            strokeWidth="1.2"
                          />
                          <text
                            x="0"
                            y="3.5"
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="8.5"
                            fontWeight="extrabold"
                          >
                            Lv.{lvl}
                          </text>
                        </g>

                        {/* Verified Status Icon (Bottom-Left) */}
                        {node.status === 'confirmed' && (
                          <g transform={`translate(${-node.radius * 0.72}, ${node.radius * 0.72})`}>
                            <circle cx="0" cy="0" r="6" fill="#10b981" stroke="#0f172a" strokeWidth="1.2" />
                            <text x="0" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                              ✓
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          )}

          {/* VIEW MODE 2: ROADMAP HIERARCHY FLOW */}
          {viewMode === 'roadmap' && (
            <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 dark:border-neutral-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                    <span>🌳</span>
                    <span>Lộ trình Phát triển Năng lực & Chuỗi Tiên quyết</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Mô hình hóa thứ tự phát triển: Kỹ năng nền tảng cơ sở ➔ Kỹ năng cốt lõi ➔ Kỹ năng chuyên sâu
                  </p>
                </div>
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 px-3 py-1 rounded-full">
                  {skillCount} Kỹ năng theo Tracks
                </span>
              </div>

              <div className="space-y-6">
                {allCategories.map((catKey) => {
                  const theme = CATEGORY_MAP[catKey] || CATEGORY_MAP['Khác'];
                  const nodesInCat = graph?.nodes?.filter(
                    (n) => n.type === 'skill' && normalizeCategory(n.category) === catKey
                  ) || [];
                  if (filterCategory !== 'ALL' && filterCategory !== catKey) return null;
                  if (nodesInCat.length === 0) return null;

                  return (
                    <div key={catKey} className="bg-stone-50/80 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700 rounded-2xl p-5 space-y-4">
                      {/* Track Header */}
                      <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-neutral-700 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{theme.icon}</span>
                          <div>
                            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                              Track: {theme.name}
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">
                              {nodesInCat.length} kỹ năng trong chuyên môn này
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: theme.light, color: theme.text, border: `1px solid ${theme.border}` }}
                        >
                          {catKey}
                        </span>
                      </div>

                      {/* Step-by-Step Pathway Flow */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {nodesInCat
                          .sort((a, b) => (a.proficiencyLevel || 1) - (b.proficiencyLevel || 1))
                          .map((node, nIdx) => {
                            const isSelected = selectedNode?.id === node.id;
                            const lvl = node.proficiencyLevel || 1;
                            return (
                              <div key={node.id} className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedNode(node)}
                                  className={`text-left p-3.5 rounded-2xl border transition-all ${
                                    isSelected
                                      ? 'bg-white dark:bg-neutral-800 border-violet-500 shadow-md ring-2 ring-violet-400/40'
                                      : 'bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-stone-900 dark:text-stone-100 text-xs">{node.label}</span>
                                    <span
                                      className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                                      style={{ backgroundColor: theme.color }}
                                    >
                                      Lv.{lvl}
                                    </span>
                                    {node.status === 'confirmed' && (
                                      <span className="text-emerald-500 text-xs" title="Đã xác thực">✓</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                                    {PROFICIENCY_LEVEL_NAMES[lvl]} ({lvl * 20}%)
                                  </p>
                                  <div className="w-24 bg-stone-100 dark:bg-neutral-700 rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${lvl * 20}%`, backgroundColor: theme.color }}
                                    />
                                  </div>
                                </button>
                                {nIdx < nodesInCat.length - 1 && (
                                  <div className="flex items-center text-stone-400 dark:text-stone-500 font-bold px-1 text-sm">
                                    <span>➔</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: CARDS & MATRIX */}
          {viewMode === 'cards' && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <span>📊</span>
                    <span>Ma trận Năng lực & Thẻ Tri thức Chi tiết</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tra cứu đầy đủ thông số năng lực, mức độ hoàn thiện và điều kiện tiên quyết theo từng kỹ năng.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {allCategories.map((catKey) => {
                  const theme = CATEGORY_MAP[catKey] || CATEGORY_MAP['Khác'];
                  const nodesInCat = graph?.nodes?.filter(
                    (n) => n.type === 'skill' && normalizeCategory(n.category) === catKey
                  ) || [];
                  if (filterCategory !== 'ALL' && filterCategory !== catKey) return null;
                  if (nodesInCat.length === 0) return null;

                  return (
                    <div key={catKey} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                        <span className="text-base">{theme.icon}</span>
                        <h4 className="font-bold text-gray-900 text-sm">{theme.name}</h4>
                        <span className="text-xs text-gray-400 font-medium">({nodesInCat.length} kỹ năng)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {nodesInCat.map((node) => {
                          const isSelected = selectedNode?.id === node.id;
                          const lvl = node.proficiencyLevel || 1;
                          return (
                            <div
                              key={node.id}
                              onClick={() => setSelectedNode(node)}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-2 ring-indigo-200'
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-900 text-sm">{node.label}</span>
                                  {node.status === 'confirmed' && (
                                    <span className="text-emerald-500 text-xs">✓</span>
                                  )}
                                </div>
                                <span
                                  className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: theme.color }}
                                >
                                  Cấp {lvl}/5
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {PROFICIENCY_LEVEL_NAMES[lvl]} ({lvl * 20}%)
                              </p>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${lvl * 20}%`, backgroundColor: theme.color }}
                                />
                              </div>
                              <div className="text-[11px] text-indigo-600 font-semibold mt-3 flex items-center justify-between">
                                <span>Khám phá quan hệ</span>
                                <span>→</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Graph Legend */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Cụm Lĩnh vực Chuyên môn:
                </span>
                <div className="flex flex-wrap gap-3 mt-2">
                  {Object.entries(CATEGORY_MAP)
                    .filter(([k]) => k !== 'Khác' || allCategories.includes('Khác'))
                    .map(([name, t]) => (
                      <span key={name} className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                        <span>{t.name}</span>
                      </span>
                    ))}
                </div>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-4">
                <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Loại Liên kết Tri thức:
                </span>
                <div className="flex flex-wrap gap-3.5 mt-2">
                  <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <span className="w-4 h-1 bg-red-500 rounded" />
                    <span>Tiên quyết (Cần học trước)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <span className="w-4 h-1 bg-purple-500 rounded" />
                    <span>Bổ trợ</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <span className="w-4 h-0.5 bg-sky-400 border-b border-dashed" />
                    <span>Liên quan</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Node Inspector & Search */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {selectedNode ? (
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onExplore={handleExplore}
              allNodes={layout.positionedNodes}
              allEdges={layout.edges}
            />
          ) : (
            <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 rounded-3xl p-6 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center text-xl font-bold shadow-xs">
                🎯
              </div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Chi tiết nút kỹ năng</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Nhấp vào bất kỳ hành tinh kỹ năng nào trên sơ đồ để kiểm tra chi tiết trình độ, điều kiện tiên quyết và liên kết bổ trợ.
              </p>
            </div>
          )}

          {/* Quick Skill Search & Filter Drawer */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-stone-200/80 dark:border-neutral-700/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                Tìm kiếm nhanh ({skillCount})
              </h4>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Gõ tên kỹ năng (React, Python...)"
              className="w-full border border-stone-300 dark:border-neutral-700 bg-stone-50/70 dark:bg-neutral-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 rounded-xl px-3 py-2 text-xs focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
            />

            <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-stone-100 dark:divide-neutral-800/80 pt-1">
              {graph?.nodes
                ?.filter(
                  (n) =>
                    n.type === 'skill' &&
                    (!searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((node) => {
                  const catKey = normalizeCategory(node.category);
                  const theme = CATEGORY_MAP[catKey] || CATEGORY_MAP['Khác'];
                  const isSelected = selectedNode?.id === node.id;
                  const lvl = node.proficiencyLevel || 1;
                  return (
                    <button
                      key={node.id}
                      onClick={() => handleExplore(node)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200 font-bold'
                          : 'hover:bg-stone-50 dark:hover:bg-neutral-800/60 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.color }} />
                        <span className="truncate">{node.label}</span>
                        {node.status === 'confirmed' && (
                          <span className="text-emerald-500 text-[10px]">✓</span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0 font-bold ml-2">
                        Lv.{lvl}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
