import type { AlgorithmStep } from '../types'

type FrameExportOptions = {
  activeIndices?: number[]
  algorithmName: string
  filename: string
  maxMagnitude: number
  visualData: number[]
}

export function downloadText(filename: string, value: string, type = 'text/plain') {
  downloadBlob(filename, new Blob([value], { type }))
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function buildStepLogCsv(steps: AlgorithmStep[]) {
  return ['step,type,description,comparisons,swaps,reads,writes,recursiveCalls']
    .concat(
      steps.map((step, index) =>
        [
          index + 1,
          step.type,
          `"${step.description.replaceAll('"', '""')}"`,
          step.metrics.comparisons ?? 0,
          step.metrics.swaps ?? 0,
          step.metrics.reads ?? 0,
          step.metrics.writes ?? 0,
          step.metrics.recursiveCalls ?? 0,
        ].join(','),
      ),
    )
    .join('\n')
}

export function exportSvgFrame({ activeIndices = [], algorithmName, filename, maxMagnitude, visualData }: FrameExportOptions) {
  const width = 980
  const height = 360
  const barWidth = width / Math.max(visualData.length, 1)
  const bars = visualData
    .map((value, index) => {
      const barHeight = (Math.abs(value) / maxMagnitude) * 280
      const active = activeIndices.includes(index)
      return `<rect x="${index * barWidth + 4}" y="${height - barHeight - 28}" width="${Math.max(8, barWidth - 8)}" height="${barHeight}" rx="5" fill="${active ? '#e85d4f' : '#247c7a'}" /><text x="${index * barWidth + barWidth / 2}" y="${height - 8}" text-anchor="middle" font-size="12" fill="#243033">${value}</text>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f7f4ee"/><text x="24" y="32" font-family="Arial" font-size="20" fill="#1d2428">${algorithmName}</text>${bars}</svg>`
  downloadBlob(filename, new Blob([svg], { type: 'image/svg+xml' }))
}

export function exportPngFrame({ activeIndices = [], algorithmName, filename, maxMagnitude, visualData }: FrameExportOptions) {
  const width = 980
  const height = 360
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return false
  context.fillStyle = '#f7fbff'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#1d2428'
  context.font = '20px Arial'
  context.fillText(algorithmName, 24, 32)
  const barWidth = width / Math.max(visualData.length, 1)
  visualData.forEach((value, index) => {
    const barHeight = (Math.abs(value) / maxMagnitude) * 280
    const active = activeIndices.includes(index)
    context.fillStyle = active ? '#e85d4f' : value < 0 ? '#7c5bb0' : '#247c7a'
    context.fillRect(index * barWidth + 4, height - barHeight - 36, Math.max(8, barWidth - 8), barHeight)
    context.fillStyle = '#243033'
    context.font = '12px Arial'
    context.textAlign = 'center'
    context.fillText(String(value), index * barWidth + barWidth / 2, height - 12)
  })
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename
  link.click()
  return true
}
