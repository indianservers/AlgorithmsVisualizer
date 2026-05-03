import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const assetDir = join(process.cwd(), 'dist', 'assets')
const maxChunkBytes = 250 * 1024

const files = await readdir(assetDir)
const chunks = await Promise.all(
  files
    .filter((file) => file.endsWith('.js'))
    .map(async (file) => {
      const info = await stat(join(assetDir, file))
      return { file, size: info.size }
    }),
)

const oversized = chunks.filter((chunk) => chunk.size > maxChunkBytes)

if (oversized.length) {
  console.error('Bundle budget exceeded:')
  oversized.forEach((chunk) => console.error(`- ${chunk.file}: ${chunk.size} bytes`))
  process.exit(1)
}

console.log(`Bundle budget passed for ${chunks.length} chunks. Limit: ${maxChunkBytes} bytes.`)
