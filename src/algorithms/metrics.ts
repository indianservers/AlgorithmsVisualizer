export const metricRules = [
  'reads counts each direct access to input data or an auxiliary structure.',
  'writes counts each mutation to the visualized state or an auxiliary structure.',
  'comparisons counts value, pointer, or node-order decisions.',
  'swaps counts paired value exchanges; writes should still count both assignments.',
  'memory is the peak auxiliary data footprint that the runner can explain for the current visualization.',
]

export const metricRulesText = metricRules.join('\n')
