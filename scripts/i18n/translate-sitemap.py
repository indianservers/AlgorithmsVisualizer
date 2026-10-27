"""Generate checked-in sitemap translations from public English catalog text.

Uses Google Translate during this explicit maintenance task only. The website
serves local JSON and has no translation-service dependency. Existing curated
directory translations are retained. Reruns resume from the checked-in cache.
"""
import concurrent.futures
import json
import pathlib
import subprocess
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
subprocess.run(['node', '--input-type=module', '-e', '''
import {rolldown} from 'rolldown';
import {mkdir, writeFile} from 'node:fs/promises';
const bundle = await rolldown({input:'src/sitemap/catalog.ts',platform:'node',logLevel:'silent'});
try {
  const {output} = await bundle.generate({format:'esm'});
  const catalog = await import('data:text/javascript;base64,' + Buffer.from(output.find(x=>x.type==='chunk').code).toString('base64'));
  await mkdir('node_modules/.cache', {recursive:true});
  await writeFile('node_modules/.cache/sitemap-source.json', JSON.stringify(catalog.sitemapCatalog('en-IN',s=>s)));
} finally { await bundle.close(); }
'''], cwd=ROOT, check=True)
catalog = json.loads((ROOT / 'node_modules/.cache/sitemap-source.json').read_text(encoding='utf-8'))
seed_path = ROOT / 'scripts/i18n/sitemap-translations.json'
seeds = json.loads(seed_path.read_text(encoding='utf-8'))
languages = json.loads((ROOT / 'src/i18n/languages.json').read_text(encoding='utf-8'))
copy = ['Sitemap and topic directory', catalog['description']['text'], 'Visualization',
        'Theory guide', 'Home', 'Sitemap languages', 'Full sitemap', 'XML sitemap',
        'Machine-readable catalog', 'AI reading guide']
for group in catalog['categories']:
    copy.extend([group['name']['text'], group['description']['text']])
    copy.extend(lesson['description']['text'] for lesson in group['lessons'])
sources = list(dict.fromkeys(copy))

# Short labels need computing context to avoid translations such as musical
# strings or office-holding incumbents. These expand meaning, not functionality.
CONTEXT = {
    'Strings': 'Text string algorithms',
    'Greedy': 'Greedy algorithms in computer science',
    'Backtracking': 'Backtracking search algorithms',
    'Branch and Bound': 'Branch and bound optimization algorithms',
    'Analysis & Correctness': 'Algorithm analysis and correctness',
    'DAA Concepts': 'Concepts of algorithm design and analysis',
    'DAA Extensions': 'Advanced algorithm design techniques',
    'Divide and Conquer': 'Divide and conquer algorithms',
    'Separate feasible incumbents from optimistic relaxation bounds.':
        'Distinguish the best feasible solution found so far from optimistic bounds obtained by relaxing the optimization constraints.',
    'Define states, transitions, bases and dependency order.':
        'Define dynamic-programming states, transitions, base cases, and the order in which dependent states are evaluated.',
    'Construct an optimal binary prefix code.':
        'Construct a binary prefix code with the minimum total weighted code length.',
    'Use medians of groups of five for a guaranteed linear bound.':
        'Use medians of groups of five to guarantee linear time complexity for the selection algorithm.',
}

def translate(locale, values):
    text = '\n'.join(CONTEXT.get(value, value) for value in values)
    query = urllib.parse.urlencode({'client': 'gtx', 'sl': 'en', 'tl': locale, 'dt': 't', 'q': text})
    for attempt in range(5):
        try:
            request = urllib.request.Request('https://translate.googleapis.com/translate_a/single?' + query,
                                             headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(request, timeout=60) as response:
                result = json.load(response)
            lines = ''.join(part[0] for part in result[0] if part[0]).strip().splitlines()
            if len(lines) != len(values):
                if len(values) == 1:
                    return {values[0]: ' '.join(lines)}
                middle = len(values) // 2
                return translate(locale, values[:middle]) | translate(locale, values[middle:])
            if any(not line.strip() or line.strip() == source for source, line in zip(values, lines)):
                # Retry unchanged English independently; legitimate technical
                # category labels such as XML may remain recognizable.
                if len(values) > 1:
                    return dict(item for source in values for item in translate(locale, [source]).items())
            return dict(zip(values, (line.strip() for line in lines)))
        except Exception:
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)

def generate(locale):
    existing = seeds.get(locale, {})
    missing = [source for source in sources if source not in existing]
    batches, batch, size = [], [], 0
    for source in missing:
        if size + len(source) > 2500 and batch:
            batches.append(batch)
            batch, size = [], 0
        batch.append(source)
        size += len(source) + 1
    if batch:
        batches.append(batch)
    result = dict(existing)
    for batch in batches:
        result.update(translate(locale, batch))
    return locale, result

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        jobs = [pool.submit(generate, locale[0]) for locale in languages if locale[0] != 'en-IN']
        for job in concurrent.futures.as_completed(jobs):
            locale, entries = job.result()
            seeds[locale] = entries
            seed_path.write_text(json.dumps(seeds, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            print(f'{locale}: {len(entries)} translated directory strings', flush=True)
