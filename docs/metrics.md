# Algorithm Metrics

- `reads`: each direct access to input data or an auxiliary structure.
- `writes`: each mutation to the visualized state or an auxiliary structure.
- `comparisons`: each value, pointer, or node-order decision.
- `swaps`: paired value exchanges; both assignments still count as writes.
- `recursiveCalls`: each nontrivial recursive invocation.
- `memory`: peak auxiliary data footprint the runner can explain for the current visualization.
