declare module 'ml-cart' {
  export class DecisionTreeClassifier {
    constructor(options?: Record<string, unknown>)
    train(features: number[][], labels: number[]): void
    predict(features: number[][]): number[]
  }
}
