import {TitledBox} from "@mishieck/ink-titled-box";
import {HumanInterfaceRequestFor, HumanInterfaceResponseFor} from "@tokenring-ai/agent/HumanInterfaceRequest";
import {Box, Text, useInput} from 'ink';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import useScreenSize from "../hooks/useScreenSize.ts";

export type TreeLeaf = {
  name: string
  value?: string
  hasChildren?: boolean
  children?: Array<TreeLeaf> | (() => Promise<TreeLeaf[]> | TreeLeaf[])
}

interface TreeNode {
  label: string;
  value: string;
  hasChildren?: boolean;
  children?: TreeNode[];
  childrenLoader?: () => Promise<TreeLeaf[]> | TreeLeaf[];
}

type TreeSelectInputProps = {
  request: HumanInterfaceRequestFor<"askForSingleTreeSelection">;
  onResponse: (response: HumanInterfaceResponseFor<"askForSingleTreeSelection">) => void
} | {
  request: HumanInterfaceRequestFor<"askForMultipleTreeSelection">;
  onResponse: (response: HumanInterfaceResponseFor<"askForMultipleTreeSelection">) => void
}

interface FlatNode {
  node: TreeNode;
  depth: number;
  expanded: boolean;
  loading: boolean;
}
export default function TreeSelectionScreen({ request, onResponse }: TreeSelectInputProps) {
  const { rows } = useScreenSize();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [resolvedChildren, setResolvedChildren] = useState<Map<string, TreeLeaf[]>>(new Map());
  const [remaining, setRemaining] = useState(request.timeout);

  const { tree, timeout, default: defaultValue } = request;
  const multiple = request.type === 'askForMultipleTreeSelection';

  // Calculate max visible items (rows - 2 for title and footer)
  const maxVisibleItems = Math.max(1, rows - 6);

  // Timeout handler
  useEffect(() => {
    if (timeout && timeout > 0) {
      const timer = setTimeout(() => onResponse(defaultValue as any), timeout * 1000);
      const interval = setInterval(() => setRemaining(prev => Math.max(0, (prev ?? timeout) - 1)), 1000);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [timeout, defaultValue, onResponse]);

// Load root children if they're async
  useEffect(() => {
    const rootValue = tree.value || tree.name;

    if (typeof tree.children === 'function' && !resolvedChildren.has(rootValue) && !loading.has(rootValue)) {
      const loadRootChildren = async () => {
        setLoading(prev => new Set(prev).add(rootValue));

        try {
          const loader = tree.children as () => Promise<TreeLeaf[]> | TreeLeaf[];
          const result = loader();
          const children = result instanceof Promise ? await result : result;

          setResolvedChildren(prev => new Map(prev).set(rootValue, children));
        } finally {
          setLoading(prev => {
            const next = new Set(prev);
            next.delete(rootValue);
            return next;
          });
        }
      };

      loadRootChildren();
    }
  }, [tree, resolvedChildren, loading]);

  const flatTree = useMemo(() => {
    const result: FlatNode[] = [];

    const convertLeaf = (leaf: TreeLeaf, resolvedMap: Map<string, TreeLeaf[]>): TreeNode => {
      const value = leaf.value || leaf.name;
      const resolved = resolvedMap.get(value);

      // Determine children: use resolved if available, otherwise use static array
      let children: TreeNode[] | undefined;
      let childrenLoader: (() => Promise<TreeLeaf[]> | TreeLeaf[]) | undefined;

      if (resolved) {
        children = resolved.map(child => convertLeaf(child, resolvedMap));
      } else if (Array.isArray(leaf.children)) {
        children = leaf.children.map(child => convertLeaf(child, resolvedMap));
      } else if (typeof leaf.children === 'function') {
        childrenLoader = leaf.children;
      }

      return {
        label: leaf.name,
        value,
        hasChildren: leaf.hasChildren || !!leaf.children,
        children,
        childrenLoader
      };
    };

    const traverse = (leaves: TreeLeaf[], depth: number) => {
      for (const leaf of leaves) {
        const convertedNode = convertLeaf(leaf, resolvedChildren);
        const isExpanded = expanded.has(convertedNode.value);
        const isLoading = loading.has(convertedNode.value);

        result.push({
          node: convertedNode,
          depth,
          expanded: isExpanded,
          loading: isLoading
        });

        if (isExpanded) {
          // Use resolved children if available
          const resolved = resolvedChildren.get(convertedNode.value);
          if (resolved) {
            traverse(resolved, depth + 1);
          } else if (Array.isArray(leaf.children)) {
            traverse(leaf.children, depth + 1);
          }
        }
      }
    };

    // Handle root children - check for async function or resolved children
    const rootValue = tree.value || tree.name;
    const rootResolved = resolvedChildren.get(rootValue);

    let rootChildren: TreeLeaf[];
    if (rootResolved) {
      rootChildren = rootResolved;
    } else if (Array.isArray(tree.children)) {
      rootChildren = tree.children;
    } else {
      rootChildren = [];
    }

    traverse(rootChildren, 0);
    return result;
  }, [tree, expanded, resolvedChildren, loading]);

  const expandNode = useCallback(async (current: FlatNode) => {
    const nodeValue = current.node.value;

    // If it has a children loader (async function) and not yet resolved
    if (current.node.childrenLoader && !resolvedChildren.has(nodeValue)) {
      setLoading(prev => new Set(prev).add(nodeValue));

      try {
        const result = current.node.childrenLoader();
        const children = result instanceof Promise ? await result : result;

        setResolvedChildren(prev => new Map(prev).set(nodeValue, children));
        setExpanded(prev => new Set(prev).add(nodeValue));
      } finally {
        setLoading(prev => {
          const next = new Set(prev);
          next.delete(nodeValue);
          return next;
        });
      }
    } else if (current.node.children || current.node.hasChildren || resolvedChildren.has(nodeValue)) {
      // Already has children or already resolved
      setExpanded(prev => new Set(prev).add(nodeValue));
    }
  }, [resolvedChildren]);

  // Auto-scroll effect when selectedIndex changes
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      // Scrolling up
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + maxVisibleItems) {
      // Scrolling down
      setScrollOffset(selectedIndex - maxVisibleItems + 1);
    }
  }, [selectedIndex, maxVisibleItems, scrollOffset]);

  useInput((input, key) => {
    if ((key.escape || input === 'q')) {
      onResponse(null);
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(flatTree.length - 1, prev + 1));
    } else if (key.pageUp) {
      const halfScreen = Math.floor(maxVisibleItems / 2);
      setSelectedIndex(prev => Math.max(0, prev - halfScreen));
    } else if (key.pageDown) {
      const halfScreen = Math.floor(maxVisibleItems / 2);
      setSelectedIndex(prev => Math.min(flatTree.length - 1, prev + halfScreen));
    } else if (key.rightArrow) {
      const current = flatTree[selectedIndex];
      if (current && !current.loading) {
        expandNode(current);
      }
    } else if (key.leftArrow) {
      const current = flatTree[selectedIndex];
      if (current) {
        setExpanded(prev => {
          const next = new Set(prev);
          next.delete(current.node.value);
          return next;
        });
      }
    } else if (input === ' ') {
      const current = flatTree[selectedIndex];
      if (current) {
        if (multiple) {
          // Toggle selection in multiple mode
          setChecked(prev => {
            const next = new Set(prev);
            if (next.has(current.node.value)) {
              next.delete(current.node.value);
            } else {
              next.add(current.node.value);
            }
            return next;
          });
        } else {
          // Expand/collapse in single mode
          if (!current.loading) {
            expandNode(current);
          }
        }
      }
    } else if (key.return) {
      if (request.type === 'askForMultipleTreeSelection') {
        // Submit all checked items
        onResponse(Array.from(checked) as any);
      } else {
        // Select current item
        const current = flatTree[selectedIndex];
        if (current) {
          onResponse(current.node.value as any);
        }
      }
    }
  });


  // Get visible slice of flatTree
  const visibleTree = useMemo(() => {
    return flatTree.slice(scrollOffset, scrollOffset + maxVisibleItems);
  }, [flatTree, scrollOffset, maxVisibleItems]);

  return (
    <TitledBox flexDirection="column" titles={[tree.name]} borderStyle="single">
      {visibleTree.map((item, visibleIndex) => {
        const actualIndex = scrollOffset + visibleIndex;
        return (
          <Box key={actualIndex}>
            <Text color={actualIndex === selectedIndex ? 'green' : undefined}>
              {'  '.repeat(item.depth)}
              {actualIndex === selectedIndex ? '❯ ' : '  '}
              {item.loading
                ? '⏳ '
                : (item.node.children || item.node.childrenLoader || item.node.hasChildren)
                  ? (item.expanded ? '▼ ' : '▶ ')
                  : '  '}
              {multiple && (checked.has(item.node.value) ? '◉ ' : '◯ ')}
              {item.node.label}
              {item.loading && <Text dimColor> Loading...</Text>}
            </Text>
          </Box>
        );
      })}
      <Text dimColor>
        ({multiple ? 'Space to toggle, Enter to submit' : 'Enter to select'}), q to exit
        {timeout && timeout > 0 && <Text color="yellow"> ({remaining}s)</Text>}
      </Text>
    </TitledBox>
  );
}
