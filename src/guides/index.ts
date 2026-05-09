import type { AlgorithmModule, AlgorithmStep, StepType } from '../types'

export function stepReason(step?: AlgorithmStep) {
  if (!step) return 'Choose a live algorithm and press Run to generate timeline events.'
  if (step.reason) return step.reason
  if (step.type === 'compare') return 'The algorithm is gathering information before it changes state.'
  if (step.type === 'swap') return 'The current pair is out of the desired order, so their positions change.'
  if (step.type === 'select') return 'A candidate, pivot, key, or active node is being chosen for the next operation.'
  if (step.type === 'partition') return 'Values are being divided around a pivot so recursion can shrink the problem.'
  if (step.type === 'merge') return 'Sorted subranges are being combined into a larger ordered range.'
  if (step.type === 'update') return 'The data structure or array state is being written after a decision.'
  if (step.type === 'complete') return 'The run has reached its terminal state for this input.'
  return 'This step advances the algorithm state.'
}

export function pseudocodeIndexFor(step?: AlgorithmStep, lines: string[] = []) {
  if (!step) return -1
  if (Number.isInteger(step.pseudocodeLine)) {
    return Math.min(lines.length - 1, Math.max(0, step.pseudocodeLine ?? 0))
  }
  const typeHints: Record<StepType, string[]> = {
    compare: ['compare', 'check', 'while', 'if'],
    swap: ['swap', 'place', 'move'],
    select: ['select', 'choose', 'take', 'pivot'],
    visit: ['visit', 'mark'],
    partition: ['partition', 'pivot'],
    merge: ['merge', 'copy'],
    update: ['write', 'insert', 'shift', 'push', 'pop', 'enqueue', 'dequeue'],
    hash: ['hash'],
    complete: ['return', 'complete', 'done'],
  }
  const hints = typeHints[step.type] ?? [step.type]
  const found = lines.findIndex((line) => hints.some((hint) => line.toLowerCase().includes(hint)))
  return found >= 0 ? found : Math.min(lines.length - 1, Math.max(0, step.type === 'complete' ? lines.length - 1 : 0))
}

export function codeLinesFor(code: string, step?: AlgorithmStep) {
  const lines = code.split('\n')
  const activeIndex = Number.isInteger(step?.codeLine) ? Math.min(lines.length - 1, Math.max(0, step?.codeLine ?? 0)) : pseudocodeIndexFor(step, lines)
  return { lines, activeIndex }
}

export function learningGuideFor(module: AlgorithmModule) {
  const concept = `${module.name}: ${module.summary}`
  const prerequisites =
    module.category === 'Graphs'
      ? ['Graph nodes and edges', 'Visited sets', 'Queue/stack frontier']
      : module.category === 'Dynamic Programming'
        ? ['Recursion basics', 'State definition', 'Tables or memo maps']
        : module.category === 'Backtracking'
          ? ['Recursion basics', 'Constraint checks', 'Undo operations']
          : module.category === 'Greedy'
            ? ['Sorting or priority queues', 'Local choices', 'Proof by exchange']
            : module.category === 'Number Theory'
              ? ['Integers', 'Modulo arithmetic', 'Divisibility']
              : module.category === 'Matrix / Grid'
                ? ['Rows and columns', 'Bounds checks', 'Neighbor traversal']
                : module.category === 'Strings'
                  ? ['Arrays or characters', 'Prefixes and suffixes', 'Pattern windows']
      : module.category === 'Sorting'
        ? ['Arrays', 'Comparisons', 'Swaps and writes']
        : module.category === 'Searching'
          ? ['Arrays', 'Target value', 'Index pointers']
          : ['Basic data representation', 'Step-by-step tracing']
  const objectives = [
    `Trace ${module.name} on a small input and name each state change.`,
    module.runner
      ? 'Use the timeline to connect visual highlights to variables and metrics.'
      : 'Read the scaffolded flow and identify the missing runner contract.',
    `Defend the complexity: best ${module.complexity.best}, average ${module.complexity.average}, worst ${module.complexity.worst}.`,
  ]
  const misconceptions = [
    module.flags?.includes('Requires sorted input')
      ? 'This algorithm assumes sorted input; unsorted input changes the meaning of the result.'
      : 'A lower step count on one input does not prove a better algorithm overall.',
    'Animation speed is not the same as algorithmic complexity.',
  ]
  const interview = [
    `Implement ${module.name} and explain its complexity.`,
    'Name edge cases and input constraints.',
    'Compare it with a simpler or more advanced alternative.',
  ]
  const quiz = [
    { q: `What is the average complexity of ${module.name}?`, a: module.complexity.average },
    {
      q: 'What should you watch during the simulation?',
      a:
        module.visualMode === 'Array'
          ? `Active indices and ${module.category === 'Sorting' ? 'swaps/writes' : 'target comparisons'}.`
          : 'Highlighted nodes, cells, bytes, or model changes.',
    },
  ]
  const path =
    module.complexity.average.includes('log n') || module.flags?.includes('Recursive')
      ? 'Intermediate'
      : module.complexity.average.includes('n²')
        ? 'Beginner'
        : 'Advanced'
  const trap = module.flags?.includes('Requires sorted input')
    ? 'Forgetting the sorted-input precondition makes the output meaningless.'
    : module.category === 'Dynamic Programming'
      ? 'Choosing the wrong state definition makes the recurrence hard or impossible to reuse.'
      : module.category === 'Backtracking'
        ? 'Forgetting to undo a choice leaks state into sibling branches.'
        : module.category === 'Greedy'
          ? 'A locally good choice needs a safety argument; intuition alone is not a proof.'
          : module.category === 'Number Theory'
            ? 'Modulo and integer edge cases often break otherwise correct-looking code.'
            : module.category === 'Matrix / Grid'
              ? 'Missing bounds or visited checks can create repeated work or invalid cells.'
    : module.category === 'Sorting'
      ? 'Judging the algorithm only by one animated input hides the asymptotic tradeoff.'
      : 'Forgetting edge cases such as empty input, duplicates, or disconnected structures.'
  const useCase =
    module.category === 'Searching'
      ? 'Lookup workflows where each comparison can discard or confirm part of the data.'
      : module.category === 'Sorting'
        ? 'Preparing data for binary search, deduplication, ranking, or reporting.'
        : module.category === 'Dynamic Programming'
          ? 'Optimization and counting problems with overlapping subproblems and reusable states.'
          : module.category === 'Backtracking'
            ? 'Constraint solving where choices may need to be undone after a dead end.'
            : module.category === 'Greedy'
              ? 'Optimization problems where a provably safe local choice builds the global answer.'
              : module.category === 'Number Theory'
                ? 'Integer-heavy algorithms involving divisibility, primes, modular arithmetic, or cryptography.'
                : module.category === 'Matrix / Grid'
                  ? 'Cell-based pathfinding, flood fill, image grids, game boards, and table computations.'
                  : module.category === 'Strings'
                    ? 'Text search, autocomplete, indexing, pattern detection, and compressed representations.'
        : module.visualMode === 'Graph'
          ? 'Network, dependency, route, and reachability analysis.'
          : 'Teaching structural invariants and operation order.'
  const compareWith =
    module.category === 'Sorting'
      ? ['Insertion Sort', 'Merge Sort', 'Quick Sort'].filter((name) => name !== module.name)
      : module.category === 'Searching'
        ? ['Linear Search', 'Binary Search', 'Lower Bound'].filter((name) => name !== module.name)
        : module.category === 'Dynamic Programming'
          ? ['Backtracking Suite', 'Greedy Suite', 'Recursion Fundamentals Suite']
          : module.category === 'Backtracking'
            ? ['Dynamic Programming Suite', 'Recursion Fundamentals Suite', 'Matrix/Grid Suite']
            : module.category === 'Graphs'
              ? ['BFS Traversal', 'DFS Traversal', 'Advanced Graph Suite'].filter((name) => name !== module.name)
              : module.category === 'Strings'
                ? ['Advanced String Structures', 'String Pattern Matching Suite', 'Trie / Prefix Tree'].filter((name) => name !== module.name)
                : ['Stack', 'Queue', 'BFS Traversal'].filter((name) => name !== module.name)
  return { concept, prerequisites, objectives, misconceptions, interview, quiz, path, trap, useCase, compareWith }
}
