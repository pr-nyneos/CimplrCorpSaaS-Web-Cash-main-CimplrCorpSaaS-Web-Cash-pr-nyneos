import { ChevronDown, ChevronRight, Building, Building2 } from "lucide-react";

interface TreeNodeBase<T> {
  id: string;
  name: string;
  children?: TreeNodeBase<T>[];
  data: T;
}

interface TreeNodeProps<T extends { processing_status?: string }> {
  node: TreeNodeBase<T>;
  level?: number;
  selectedNode: TreeNodeBase<T> | null;
  setSelectedNode: (node: TreeNodeBase<T> | null) => void;
  treeData?: TreeNodeBase<T> | TreeNodeBase<T>[] | null;

  expandedNodes: Set<string>;
  toggleNode: (nodeId: string) => void;
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const lineColors = [
  "border-l-blue-600",
  "border-l-green-600",
  "border-l-yellow-600",
  "border-l-purple-600",
];

const getNodeConfig = (level: number) => {
  switch (level) {
    case 0:
      return {
        icon: Building,
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
      };
    case 1:
      return {
        icon: Building2,
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
      };
    case 2:
      return {
        icon: Building2,
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-800",
      };
    case 3:
      return {
        icon: Building2,
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
      };
    default:
      return {
        icon: Building,
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-800",
      };
  }
};

const getAllNodeIds = <T,>(
  node: TreeNodeBase<T> | TreeNodeBase<T>[] | null
): string[] => {
  if (!node) return [];

  if (Array.isArray(node)) {
    return node.flatMap((n) => {
      const ids = [n.id];
      if (n.children) {
        ids.push(...getAllNodeIds(n.children));
      }
      return ids;
    });
  }

  const ids = [node.id];
  if (node.children) {
    node.children.forEach((child) => {
      ids.push(...getAllNodeIds(child));
    });
  }
  return ids;
};

function TreeNode<T extends { processing_status?: string }>({
  node,
  level = 0,
  selectedNode,
  setSelectedNode,
  treeData = null,
  expandedNodes,
  toggleNode,
}: TreeNodeProps<T>) {
  // Hide rejected nodes
  if (node.data?.processing_status === "Rejected") {
    return null;
  }

  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedNodes.has(node.id);
  const config = getNodeConfig(level);
  const Icon = config.icon;
  const status = node.data?.processing_status || "";

  // Filter children to hide rejected
  const visibleChildren =
    hasChildren && node.children
      ? node.children.filter(
          (child) => child.data?.processing_status !== "Rejected"
        )
      : [];

  const hasVisibleChildren = visibleChildren.length > 0;

  return (
    <div className="relative">
      <div
        className="flex items-center gap-4 mb-6"
        style={{ marginLeft: level * 10, cursor: "pointer" }}
        onClick={() => setSelectedNode(node)}
      >
        <div
          className={`relative flex items-center gap-0 p-0 rounded-lg border-2 w-[400px] hover:shadow-md transition-all ${config.border} bg-white`}
        >
          {/* Colored left strip */}
          <div className={`w-2 h-full rounded-l-md ${config.bg}`}></div>

          {/* Main content area */}
          <div className="flex items-center gap-2 p-3 flex-grow">
            {hasVisibleChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className={`p-1 rounded-full ${config.bg} hover:opacity-80`}
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown size={16} className={config.text} />
                ) : (
                  <ChevronRight size={16} className={config.text} />
                )}
              </button>
            )}

            <Icon size={16} className={config.text} />
            <span className={`font-medium flex-grow ${config.text}`}>
              {node.name}
            </span>

            <div className="flex items-center gap-1 ml-2">
              <div className="absolute -right-2.5 -top-4">
                <span
                  className={`px-2 py-1 font-bold rounded-xl text-xs ${
                    statusColors[status] || "bg-gray-200 text-gray-600"
                  }`}
                >
                  {formatStatus(status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasVisibleChildren && isExpanded && (
        <div
          className={`pl-6 mt-4 border-l-2 ${
            lineColors[level % lineColors.length]
          } border-dashed`}
        >
          {visibleChildren.map((child) => (
            <TreeNode<T>
              key={child.id}
              node={child}
              level={level + 1}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              treeData={treeData}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const statusColors: Record<string, string> = {
  APPROVED: "bg-green-200 text-green-600",
  REJECTED: "bg-red-100 text-red-500",
  PENDING_APPROVAL: "bg-gray-200 text-gray-600",
  PENDING_DELETE_APPROVAL: "bg-orange-100 text-orange-500",
  PENDING_EDIT_APPROVAL: "bg-yellow-100 text-yellow-600",
  CANCELLED: "bg-gray-100 text-gray-400",
};

export default TreeNode;
