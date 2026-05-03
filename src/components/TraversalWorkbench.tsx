import type { AlgorithmModule, AlgorithmStep } from '../types'
import { graphEdges, graphNodes, treeEdges, treeNodes } from '../algorithms'

export function TraversalWorkbench({ activeModule, currentStep, input }: { activeModule: AlgorithmModule; currentStep?: AlgorithmStep; input: number[] }) {
  const isTree = activeModule.visualMode === 'Tree'
  const customTreeNodes =
    input.length >= 3
      ? input.slice(0, 15).map((value, index) => {
          const level = Math.floor(Math.log2(index + 1))
          const levelStart = 2 ** level - 1
          const position = index - levelStart
          const levelCount = 2 ** level
          return { id: String(value), x: 60 + ((position + 0.5) * 500) / levelCount, y: 50 + level * 82 }
        })
      : treeNodes
  const customTreeEdges =
    input.length >= 3
      ? customTreeNodes.flatMap((node, index) => {
          const left = customTreeNodes[index * 2 + 1]
          const right = customTreeNodes[index * 2 + 2]
          return [left ? [node.id, left.id] : null, right ? [node.id, right.id] : null].filter(Boolean) as [string, string][]
        })
      : treeEdges
  const nodes = isTree ? customTreeNodes : graphNodes
  const edges = isTree ? customTreeEdges : graphEdges
  const activeNodes = currentStep?.highlights.nodes ?? []
  const visited = String(currentStep?.highlights.variables?.order ?? '')
    .split(' -> ')
    .filter(Boolean)
  const colorFor = (id: string) => {
    if (activeNodes.includes(id)) return '#f97316'
    if (visited.includes(id)) return '#22c55e'
    return isTree ? '#4f6bed' : '#3b82f6'
  }

  return (
    <div className="traversal-workbench">
      <svg viewBox="0 0 620 380" role="img" aria-label={`${activeModule.name} traversal diagram`}>
        <rect className="diagram-bg" x="8" y="8" width="604" height="364" rx="16" />
        {edges.map((edge) => {
          const from = nodes.find((node) => node.id === edge[0])!
          const to = nodes.find((node) => node.id === edge[1])!
          const edgeActive = activeNodes.includes(edge[0]) || activeNodes.includes(edge[1])
          return (
            <g key={`${edge[0]}-${edge[1]}`}>
              <line className={edgeActive ? 'edge active' : 'edge'} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              {edge.length > 2 && (
                <text className="edge-weight" x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 5}>
                  {edge[2]}
                </text>
              )}
            </g>
          )
        })}
        {nodes.map((node) => (
          <g className="diagram-node" key={node.id}>
            <circle cx={node.x} cy={node.y} r={activeNodes.includes(node.id) ? 30 : 25} fill={colorFor(node.id)} />
            <text x={node.x} y={node.y + 7}>
              {node.id}
            </text>
          </g>
        ))}
      </svg>
      <div className="traversal-order">
        <strong>Traversal order</strong>
        <span>{visited.length ? visited.join(' -> ') : 'Press Run to begin'}</span>
      </div>
    </div>
  )
}
