import type { AlgorithmModule } from '../types'
import { daaTheoryFor } from '../guides/daaTheory'
import { lessonById } from '../daa/catalog'

export type TopicNotes = { definition: string; purpose: string; intuition: string; advantages: string[]; disadvantages: string[]; mistakes: string[] }
const notes = (definition: string, purpose: string, intuition: string, advantages: string[], disadvantages: string[], mistakes: string[]): TopicNotes => ({
  definition,
  purpose,
  intuition,
  advantages,
  disadvantages,
  mistakes,
})
export const topicNotes: Record<string, TopicNotes> = {
  'selection-sort': notes(
    'Selection sort is an in-place comparison sorting algorithm. It builds an ordered prefix by repeatedly finding the smallest value in the remaining suffix and exchanging it with the next output position. Selection refers to choosing the next minimum, rather than inserting or merging values.',
    'Its purpose is to arrange records in ascending order with little auxiliary memory and relatively few exchanges. It is especially useful for learning loop invariants and for small inputs where an exchange is more expensive than a comparison. General-purpose libraries usually prefer faster methods for large collections.',
    'Imagine arranging numbered cards. Look through every remaining card, pick the smallest, and put it in the next open position. Finding that card still requires a full scan, even if the cards were already ordered. After each pass, one more position is final.',
    [
      'Uses constant auxiliary space in the sorting core.',
      'Makes at most n − 1 nontrivial swaps, even though comparisons are quadratic.',
      'Its growing sorted prefix makes correctness easy to inspect.',
    ],
    [
      'Still scans the remaining suffix on already sorted input.',
      'The usual exchange-based version is not stable.',
      'Quadratic comparisons make it a poor choice for large arrays.',
    ],
    [
      'Confusing the minimum value with its index.',
      'Resetting minIndex inside the inner loop instead of once per pass.',
      'Swapping after every comparison instead of after the complete scan.',
      'Assuming equal records retain their original order.',
    ],
  ),
  'bubble-sort': notes(
    'Bubble sort orders a sequence by comparing adjacent values and swapping inverted pairs. Each forward pass moves the largest remaining value to the right boundary.',
    'Use it to understand local exchanges, inversions and early termination. It is mainly educational or suitable for very small data.',
    'Like bubbles rising through water, a large value moves one neighbor at a time. A complete pass without a swap proves every adjacent pair is ordered.',
    ['Stable with a strict greater-than comparison.', 'Uses constant auxiliary workspace.', 'The optimized studio stops after a swap-free pass.'],
    ['Average and worst-case time are quadratic.', 'Often performs many more writes than selection sort.'],
    ['Claiming linear best-case time for a version without early exit.', 'Swapping equal keys and accidentally losing stability.'],
  ),
  'insertion-sort': notes(
    'Insertion sort maintains a sorted prefix and inserts each next value by shifting larger predecessors one position right.',
    'Use it for small arrays, nearly ordered input and the small subproblems inside hybrid sorting algorithms.',
    'It is how people commonly arrange a hand of cards: make a gap in the already ordered cards and insert the next card there.',
    ['Stable when only strictly larger keys move.', 'Adapts well to a small number of inversions.', 'Can process items as they arrive.'],
    ['Reverse order requires quadratic shifts.', 'Moving large records can be expensive.'],
    ['Overwriting the saved key during shifting.', 'Using a non-strict comparison when stability matters.'],
  ),
  'binary-insertion-sort': notes(
    'Binary insertion sort uses binary search to find a new key’s place in a sorted prefix, then shifts values to make room.',
    'It reduces comparisons when comparison itself is expensive, while keeping the familiar insertion-sort layout.',
    'Finding a seat is faster with binary search, but everyone between that seat and the end still has to move.',
    ['Needs only logarithmically many comparisons per insertion.', 'Uses constant auxiliary storage.'],
    ['Worst-case element movement remains quadratic.', 'Equal-key boundary choices determine stability.'],
    ['Calling the whole algorithm O(n log n) while ignoring shifts.', 'Inserting before equal keys when stable ordering is required.'],
  ),
  'merge-sort': notes(
    'Merge sort is a divide-and-conquer sorting algorithm. It sorts two smaller halves and merges their ordered streams into one sorted result.',
    'Use it when predictable O(n log n) time or stable ordering is more important than avoiding temporary array storage. Merging also underlies external sorting.',
    'Two ordered queues can be combined by repeatedly taking the smaller front item. Recursion creates those ordered queues from single-element base cases.',
    ['Predictable O(n log n) comparison time.', 'Stable if the left item wins ties.', 'Sequential merging is useful for linked or external data.'],
    ['Array merging commonly needs O(n) temporary storage.', 'Recursive calls add stack overhead.'],
    ['Losing stability by taking the right item on a tie.', 'Forgetting to copy the remainder of either half.'],
  ),
  'quick-sort': notes(
    'Quicksort partitions values around a pivot, then recursively orders the smaller and larger regions. The partition establishes where values belong relative to the pivot.',
    'Use it for fast general-purpose array sorting when good pivot selection and a worst-case safeguard are available.',
    'Put books smaller than a chosen book on one side and larger books on the other. Repeat the same task within each side rather than comparing every pair.',
    ['Good average performance and locality on arrays.', 'Partitioning can operate with little additional array storage.'],
    ['Unbalanced partitions can cause quadratic time and deep recursion.', 'Typical in-place versions are unstable.'],
    ['Assuming the pivot always divides input in half.', 'Failing to make progress on equal values.', 'Confusing Hoare and Lomuto partition boundaries.'],
  ),
  'heap-sort': notes(
    'Heapsort builds a max-heap and repeatedly moves its largest value to the end of a shrinking active array.',
    'Use it when worst-case O(n log n) sorting time and constant auxiliary array space are useful.',
    'The root acts like a tournament winner. After removing it, repair the tournament so the next largest value reaches the root.',
    ['Worst-case O(n log n) time.', 'Can sort in place without an O(n) merge buffer.'],
    ['Not stable in its usual form.', 'Heap accesses often have weaker locality than quicksort.'],
    ['Including the sorted suffix in heap repair.', 'Treating heap order as full sorted order.'],
  ),
  'counting-sort': notes(
    'Counting sort orders integer keys by counting occurrences in a bounded key range and reconstructing or placing the output from those counts.',
    'Use it when the key range is manageable relative to the input size. It is not a comparison-only sort.',
    'Instead of comparing cards, create a tally for each possible label. Read the tallies back in label order.',
    ['O(n + k) time for n items and range width k.', 'Avoids pairwise key comparisons.'],
    ['A sparse or enormous key range wastes memory.', 'A frequency-reconstruction version does not preserve record identity.'],
    ['Ignoring the minimum-key offset with negative numbers.', 'Claiming O(n) time without mentioning range width.'],
  ),
  'radix-sort': notes(
    'Least-significant-digit radix sort orders non-negative integers through stable passes over successive digit positions.',
    'Use it for fixed-width integer or digit keys when digit extraction and bucket storage are efficient.',
    'First group by the units digit, then tens, then hundreds. Stability carries the order learned in earlier passes into later passes.',
    ['Can avoid the comparison-sorting lower bound under key assumptions.', 'Predictable digit passes.'],
    ['Requires suitable digit or key encoding.', 'Auxiliary buckets and stable passes cost memory.'],
    ['Using an unstable digit pass.', 'Silently treating signed integers as unsigned keys.'],
  ),
  'shell-sort': notes(
    'Shell sort applies insertion sorting to gap-separated subsequences and reduces the gap until a final gap-one pass.',
    'Use it to study how moving values over long distances changes insertion-sort behavior.',
    'Distant comparisons move misplaced values closer to their destinations before a final ordinary insertion pass.',
    ['Uses little extra memory.', 'Often improves over insertion sort on moderately disordered arrays.'],
    ['Performance bounds depend on the gap sequence.', 'Usually unstable.'],
    ['Quoting a bound for a different gap sequence.', 'Ending with a gap greater than one.'],
  ),
  'cocktail-shaker-sort': notes(
    'Cocktail shaker sort is a bidirectional bubble sort that alternates forward and backward adjacent-swap sweeps.',
    'Use it to illustrate how both the minimum and maximum can reach final boundaries in one round.',
    'A forward sweep carries a large item right, and a backward sweep carries a small item left.',
    ['Stable with strict adjacent swaps.', 'Can stop when a sweep finds no swaps.'],
    ['Still has quadratic worst-case time.', 'Many local exchanges can be expensive.'],
    ['Shrinking the wrong boundary after a sweep.', 'Stopping before both required directions are checked.'],
  ),
  'comb-sort': notes(
    'Comb sort compares values separated by a shrinking gap, eventually repeating adjacent comparisons until no swaps occur.',
    'Use it to explore how long-distance exchanges remove small misplaced values near the end of an array.',
    'A large-to-small comb first catches widely separated disorder, then its finest teeth remove adjacent inversions.',
    ['Uses constant auxiliary workspace.', 'Large gaps can move badly misplaced elements quickly.'],
    ['Worst-case time remains quadratic for this implementation.', 'Not generally stable.'],
    ['Stopping when the gap reaches one instead of when a gap-one pass has no swaps.'],
  ),
  'gnome-sort': notes(
    'Gnome sort advances across ordered neighbors and steps backward after exchanging an inverted adjacent pair.',
    'Use it to understand insertion-like sorting using adjacent swaps and a single moving position.',
    'After fixing a neighboring pair, step back to check whether the new left neighbor is still ordered.',
    ['Simple control flow.', 'Stable when only inverted neighbors are exchanged.'],
    ['Quadratic worst-case exchanges.', 'Frequent backward steps on disordered input.'],
    ['Moving before the first array position.', 'Forgetting to advance after an already ordered pair.'],
  ),
  'linear-search': notes(
    'Linear search examines candidates one at a time until it finds the target or exhausts the collection.',
    'Use it on unsorted input, small collections or sequential access where building an index is not justified.',
    'Check each drawer in order. A miss is established only after every candidate has been ruled out.',
    ['No sorting prerequisite.', 'Works with sequential access.', 'Can return the first occurrence.'],
    ['A miss may inspect all n values.', 'Repeated queries can justify an index or sorted representation.'],
    ['Returning absence before the loop is complete.', 'Confusing an index of zero with a failed search.'],
  ),
  'binary-search': notes(
    'Binary search locates a target in ordered data by repeatedly comparing it with the midpoint of a remaining interval.',
    'Use it for repeated queries on sorted random-access data or for finding a boundary of a monotone predicate.',
    'Like opening a dictionary near the middle, ordering lets one comparison rule out an entire half.',
    ['Logarithmic worst-case comparisons.', 'An iterative implementation uses constant auxiliary space.'],
    ['Requires ordering or a monotone predicate.', 'Random access is important for logarithmic overall time.'],
    ['Using it on unsorted input.', 'Mixing inclusive and half-open bounds.', 'Failing to exclude an already checked midpoint.'],
  ),
}
const variants: Record<string, [string, string, string]> = {
  'sentinel-linear-search': [
    'Linear search with a sentinel temporarily puts the target at a boundary so the scan can stop on equality without a bounds check on every iteration.',
    'Useful for studying loop guards and restoring a temporarily modified input.',
    'Always restore the replaced final value and distinguish a real final match from the sentinel.',
  ],
  'recursive-linear-search': [
    'Recursive linear search checks one position and delegates the remaining suffix to a recursive call.',
    'Useful for learning base cases, recursive progress and stack cost.',
    'The empty-suffix base case must run before indexing; a depth-n recursion uses O(n) stack space.',
  ],
  'recursive-binary-search': [
    'Recursive binary search passes the surviving ordered interval into a recursive call after a midpoint comparison.',
    'Useful for expressing interval elimination directly as divide and conquer.',
    'Use an empty-interval base case, exclude the midpoint, and count O(log n) call-stack space.',
  ],
  'lower-bound': [
    'Lower bound returns the first index whose value is greater than or equal to a target, or n if no such value exists.',
    'Use it to find an insertion boundary, count a range or locate the first possible match in sorted data.',
    'The predicate a[i] >= target changes from false to true; the result may equal n and need not be a match.',
  ],
  'upper-bound': [
    'Upper bound returns the first index whose value is strictly greater than the target, or n if none exists.',
    'Use it to find the position after all equal keys and, with lower bound, count duplicates.',
    'Changing >= to > changes the boundary. A boundary of n is valid.',
  ],
  'first-occurrence': [
    'First-occurrence search finds the leftmost index equal to a target in a sorted array.',
    'Use it when duplicate records exist and the earliest matching position matters.',
    'Find the lower boundary and verify equality before reporting success.',
  ],
  'last-occurrence': [
    'Last-occurrence search finds the rightmost matching index in sorted data.',
    'Use it to locate the end of a duplicate run or compute a range of matching records.',
    'Find the upper boundary, subtract one and check that the index is valid and equal to the target.',
  ],
  'search-insert-position': [
    'Search-insert position finds the first sorted position at which a target can be inserted without breaking ascending order.',
    'Use it to maintain ordered collections or turn search into a boundary query.',
    'A returned position can equal the array length; it is an insertion point, not necessarily an existing match.',
  ],
  'rotated-sorted-array-search': [
    'Rotated-array search locates a target in an ascending array whose prefix has been moved to the end.',
    'Use it to study how a locally ordered half permits interval elimination even when the whole array wraps around.',
    'Equal endpoints can hide which half is ordered. Duplicates may force linear progress rather than logarithmic elimination.',
  ],
  'peak-element-search': [
    'Peak search finds a local high point relative to its neighbors, rather than necessarily finding the global maximum.',
    'Use it for slope-based binary reasoning on adjacent values and for understanding local versus global objectives.',
    'A local peak can be far smaller than another distant peak. State how endpoints and equal neighbors are treated.',
  ],
}
for (const [id, [definition, purpose, intuition]] of Object.entries(variants))
  topicNotes[id] = notes(
    definition,
    purpose,
    intuition,
    ['Has a precisely defined search or boundary contract.', 'Can be traced with a small candidate interval or current position.'],
    ['Its contract and input assumptions must be satisfied.', 'A missing target and an insertion boundary are different outputs.'],
    [intuition],
  )

const categoryPurpose: Record<string, string> = {
  Sorting:
    'Sorting creates an ordered permutation so later searching, grouping, ranking and merging can use that order. The choice of method depends on input size, existing order, stability, workspace and key representation.',
  Searching:
    'Searching answers a precise query about a collection: membership, position, an order boundary or an extremum. The shape of the answer determines the invariant and the meaning of a failed query.',
  Graphs:
    'Graph algorithms model relationships using vertices and edges. They answer questions about reachability, routes, connectivity, dependencies and resource flow; directedness and edge weights determine which methods apply.',
  'Dynamic Programming':
    'Dynamic programming avoids recomputing overlapping subproblems by defining a state, a transition and base cases. It is useful for optimization and counting when subproblem results can be reused without losing necessary context.',
  Greedy:
    'Greedy algorithms make a locally preferred choice and commit to it. They are useful when an exchange argument, cut property or other proof shows that this choice can belong to a globally optimal solution.',
  Backtracking:
    'Backtracking explores partial solutions, rejects choices that violate constraints and undoes changes before trying alternatives. It is useful for discrete search when a complete solution must satisfy several interacting conditions.',
  Strings:
    'String algorithms process ordered symbols to find patterns, compare sequences and organize text. Prefix structure, hashes and indexes can avoid repeated character comparisons, but each method has its own assumptions.',
  'Data Structures':
    'A data structure organizes information around an operation contract. Choose a representation by the queries, updates, ordering and memory behavior an application needs, then maintain the invariants that make those operations correct.',
  'Number Theory':
    'Number-theoretic algorithms exploit divisibility, primes and modular arithmetic to compute exact integer results. They support tasks such as simplifying ratios, enumerating primes and reasoning about integer representations.',
  'Matrix / Grid':
    'Matrix and grid algorithms organize computation by coordinates and neighboring cells. They are useful for tabular transforms, spatial state and problems whose dependencies are naturally expressed across rows and columns.',
  Games:
    'Game-search methods evaluate legal choices under rules, opponent responses or chance events. They support decision-making in a defined model; a depth-limited heuristic result is not a proof that a move wins the complete game.',
  'DAA Concepts':
    'Algorithm design and analysis connects a problem definition to a precise procedure, a correctness argument and a resource bound. These concepts help explain why a method works, not merely how to execute its instructions.',
  'Analysis & Correctness':
    'Analysis and correctness techniques establish what an algorithm guarantees and how its resource use grows. They help distinguish a successful example from a proof that covers every permitted input.',
  'Divide and Conquer':
    'Divide and conquer decomposes a problem into smaller instances, solves base cases and combines the results. The amount of work outside recursion and the sizes of the subproblems determine the recurrence.',
  'Branch and Bound':
    'Branch and bound searches an optimization space while using valid bounds to discard regions that cannot improve the best known feasible solution. Correct bounds preserve optimality; their strength determines practical pruning.',
  'Complexity Theory':
    'Complexity theory classifies computational problems by the resources needed to solve or verify them. Reductions connect problem difficulty, while assumptions about decision versions and encodings make those comparisons meaningful.',
  'DAA Extensions':
    'Advanced algorithm design combines specialized mathematical structure with explicit assumptions about inputs, probability, approximation or numeric precision. Its guarantees must be read alongside those assumptions.',
}
export const articleSections = [
  ['overview', 'What is it?'],
  ['purpose', 'Purpose and applications'],
  ['how-it-works', 'How it works'],
  ['worked-example', 'Worked example'],
  ['correctness', 'Why it works'],
  ['complexity', 'Time and space complexity'],
  ['trade-offs', 'Advantages and limitations'],
  ['implementation', 'Pseudocode and implementation'],
  ['common-mistakes', 'Common mistakes'],
  ['faq', 'Questions and answers'],
  ['related', 'Related topics'],
  ['references', 'References and further reading'],
] as const
export function encyclopediaFor(module: AlgorithmModule) {
  const t = daaTheoryFor(module)
  const lesson = lessonById.get(module.lessonId ?? module.id)
  const extra = topicNotes[module.id]
  const scope =
    module.subcategory === 'Learning Tools'
      ? 'learning tool'
      : module.id.includes('suite')
        ? 'topic guide'
        : lesson?.theory
          ? 'concept'
          : module.category === 'Data Structures'
            ? 'data-structure topic'
            : 'algorithm'
  const purpose =
    extra?.purpose ?? `${module.name} addresses this task: ${module.summary} ${categoryPurpose[module.category] ?? categoryPurpose['DAA Concepts']}`
  const definition =
    extra?.definition ??
    `${module.name} is ${/^[aeiou]/i.test(scope) ? 'an' : 'a'} ${scope} in ${module.category.toLowerCase()}. ${module.summary} ${lesson?.theory?.[0] ?? t.idea}`
  const analysis =
    module.executionStudio && module.id === 'bubble-sort'
      ? 'This studio uses a swapped flag and stops after a pass with no exchanges. The best case is Θ(n), because a sorted array needs one scan. Average and worst cases are Θ(n²); a reverse-ordered array has n(n − 1)/2 inversions. The sorting core uses O(1) extra space, while recorded animation snapshots require separate storage.'
      : (lesson?.derivation ?? t.analysis)
  const related = [...new Set([...t.related])]
  return {
    ...t,
    overview: module.id.includes('suite') || module.subcategory === 'Learning Tools',
    definition,
    purpose,
    intuition: extra?.intuition ?? (lesson?.theory?.slice(1).join('\n\n') || t.idea),
    analysis,
    proof: lesson?.correctness ?? t.proof,
    example: lesson?.example ?? t.example,
    limits: lesson?.constraints ?? t.limits,
    question: lesson?.exercise.question ?? t.question,
    answer: lesson?.exercise.answer ?? t.answer,
    steps: lesson?.pseudocode.length ? lesson.pseudocode : module.pseudocode,
    advantages: extra?.advantages ?? [
      lesson?.summary ?? module.summary,
      `Makes ${module.subcategory ?? module.category.toLowerCase()} reasoning visible through explicit intermediate states.`,
    ],
    disadvantages: extra?.disadvantages ?? [lesson?.constraints ?? t.limits],
    mistakes: extra?.mistakes ?? [
      `Do not omit the preconditions: ${lesson?.constraints ?? t.limits}`,
      `Validate the reasoning, not only the final output: ${lesson?.correctness ?? t.proof}`,
    ],
    related,
    description: `${module.name}: definition, purpose, worked example, correctness, complexity, applications and common mistakes. ${module.summary}`.slice(
      0,
      190,
    ),
  }
}
