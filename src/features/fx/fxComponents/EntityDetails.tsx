import React, { useEffect, useState } from "react";

import CustomSelect from "../../../components/ui/SearchSelect";
import SectionCard from "../../../components/ui/SectionCard";
import nos from "../../../utils/nos.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

interface TreeNodeData {
  entity_id: string;
  entity_name: string;
  parentname: string | null;
  is_top_level_entity: boolean;
  level: string | null;
}

type TreeNodeType = {
  id: string;
  name: string;
  data: TreeNodeData;
  children?: TreeNodeType[];
};

type Option = { label: string; value: string };

// Now storing entity names instead of IDs
type EntityState = {
  buEntity0: string | null;
  buEntity1: string | null;
  buEntity2: string | null;
  buEntity3: string | null;
};

interface EntityDropdownProps {
  entityState: EntityState;
  isThere?: boolean; // Optional prop to control if the component is in a "view" mode
  setEntityState: React.Dispatch<React.SetStateAction<EntityState>>;
}

const ENTITY_LEVELS = ["buEntity0", "buEntity1", "buEntity2", "buEntity3"] as const;


// Flatten the tree and build map of id -> info
function flattenTree(
  nodes: TreeNodeType[],
  levelIndex = 0,
  parentChain: string[] = [],
  map = new Map<string, { levelIndex: number; parentChain: string[]; node: TreeNodeType }>()
) {
  for (const node of nodes) {
    map.set(node.id, { levelIndex, parentChain, node });
    if (node.children?.length) {
      flattenTree(node.children, levelIndex + 1, [...parentChain, node.id], map);
    }
  }
  return map;
}

export default function EntityDropdownTable({ entityState, setEntityState,isThere=false }: EntityDropdownProps) {
  const [, setTreeData] = useState<TreeNodeType[]>([]);
  const [entityMap, setEntityMap] = useState<
    Map<string, { levelIndex: number; parentChain: string[]; node: TreeNodeType }>
  >(new Map());

  useEffect(() => {
    nos
      .post<TreeNodeType[]>(`${apiBaseUrl}/master/entity/hierarchy`)
      .then((res) => {
        setTreeData(res.data);
        const map = flattenTree(res.data);
        setEntityMap(map);
      })
      .catch((err) => console.error("Failed to fetch hierarchy", err));
  }, []);

  // Check if a level should be disabled based on parent level being null
  const isLevelDisabled = (levelIndex: number): boolean => {
    if (isThere) return true; // Already disabled in view mode
    if (levelIndex === 0) return false; // Level 0 is never disabled
    
    // If Level 0 is null, all levels are editable
    if (!entityState[ENTITY_LEVELS[0]]) {
      return false;
    }
    
    // If Level 0 is selected, check cascading dependencies
    // Check if the immediate parent level is null
    const immediateParentLevel = ENTITY_LEVELS[levelIndex - 1];
    if (!entityState[immediateParentLevel]) {
      return true; // Disable if immediate parent level is null
    }
    
    return false;
  };

  // Prepare options by level - filter based on parent selection
  const getOptionsForLevel = (_levelKey: string, levelIndex: number): Option[] => {
    if (levelIndex === 0) {
      // Level 0: Show only top-level entities
      const topLevelOptions: Option[] = [];
      entityMap.forEach(({ levelIndex: nodeLevel, node }) => {
        if (nodeLevel === 0) {
          topLevelOptions.push({ label: node.name, value: node.id });
        }
      });
      return topLevelOptions.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      // For other levels: Show children of selected parent OR all entities at this level if no parent selected
      const parentLevelKey = ENTITY_LEVELS[levelIndex - 1];
      const parentName = entityState[parentLevelKey];
      
      const childOptions: Option[] = [];
      
      if (!parentName) {
        // No parent selected, show all entities at this level
        entityMap.forEach(({ levelIndex: nodeLevel, node }) => {
          if (nodeLevel === levelIndex) {
            childOptions.push({ label: node.name, value: node.id });
          }
        });
      } else {
        // Parent selected, show only direct children of selected parent
        const parentId = getIdFromName(parentLevelKey, parentName);
        if (parentId) {
          entityMap.forEach(({ levelIndex: nodeLevel, parentChain, node }) => {
            if (nodeLevel === levelIndex) {
              // The parentChain contains all ancestors, so for direct children:
              // The immediate parent is always the last element in parentChain
              if (parentChain.length >= 1 && parentChain[parentChain.length - 1] === parentId) {
                childOptions.push({ label: node.name, value: node.id });
              }
            }
          });
        }
      }
      
      return childOptions.sort((a, b) => a.label.localeCompare(b.label));
    }
  };

  // Helper: Given entity name, find the corresponding option value (id)
  const getIdFromName = (_levelKey: string, name: string | null): string | null => {
    if (!name) return null;
    // Search through all entities to find the one with matching name
    let foundId: string | null = null;
    entityMap.forEach(({ node }) => {
      if (node.name === name) {
        foundId = node.id;
      }
    });
    return foundId;
  };

  const handleChange = (levelKey: keyof EntityState, id: string | null) => {
    setEntityState((prev) => {
      const updated = { ...prev };
      const levelIndex = ENTITY_LEVELS.indexOf(levelKey);

      if (!id) {
        // Clear current and all lower levels when cancelling/clearing
        for (let i = levelIndex; i < ENTITY_LEVELS.length; i++) {
          updated[ENTITY_LEVELS[i]] = null;
        }
      } else {
        // Clear only the levels below the current selection, keep levels above
        for (let i = levelIndex + 1; i < ENTITY_LEVELS.length; i++) {
          updated[ENTITY_LEVELS[i]] = null;
        }

        const entityInfo = entityMap.get(id);
        const entityName = entityInfo?.node.name || null;
        
        // Set the selected entity
        updated[levelKey] = entityName;

        // Auto-populate all parent levels above the selected level
        if (entityInfo?.parentChain && levelIndex > 0) {
          const parentChain = entityInfo.parentChain;
          parentChain.forEach((parentId, idx) => {
            if (idx < levelIndex) { // Only fill levels above the current selection
              const parentNode = entityMap.get(parentId);
              if (parentNode) {
                updated[ENTITY_LEVELS[idx]] = parentNode.node.name;
              }
            }
          });
        }
      }

      return updated;
    });
  };

  return (
    <SectionCard title="Entity Details">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {ENTITY_LEVELS.map((levelKey, idx) => {
          const options = getOptionsForLevel(levelKey, idx);
          const isDisabled = isLevelDisabled(idx);

          return (
            <CustomSelect
              key={levelKey}
              label={`Level ${idx}`}
              options={options}
              selectedValue={getIdFromName(levelKey, entityState[levelKey]) || ""}
              onChange={(val) => handleChange(levelKey, val || null)}
              placeholder="Select..."
              isDisabled={isDisabled}
            />
          );
        })}
      </div>
    </SectionCard>
  );
}
