"""Compile and execute every generated Python and Java source against independent answers."""
import bisect
import json
from pathlib import Path
import subprocess

sources = json.loads(Path('src/studio/languages.generated.json').read_text(encoding='utf-8'))
directory = Path('artifacts/studio-language-check')
directory.mkdir(parents=True, exist_ok=True)
java_calls = []
expected_java = []
python_count = 0

def expected(algorithm, data, target, result):
    if algorithm == 'sliding-window-two-pointers-suite':
        pairs = [(i,j) for i in range(len(data)) for j in range(i+1,len(data)) if data[i]+data[j]==target]
        return (not pairs) if result == [] else len(result)==2 and 0 <= int(result[0]) < int(result[1]) < len(data) and data[int(result[0])]+data[int(result[1])]==target
    if algorithm.endswith('-sort') or algorithm in ['divide-and-conquer-suite', 'advanced-sorting-suite']:
        return result == sorted(data)
    if algorithm in ['lower-bound', 'search-insert-position']:
        return result == bisect.bisect_left(data, target)
    if algorithm == 'upper-bound':
        return result == bisect.bisect_right(data, target)
    if algorithm == 'last-occurrence':
        return result == (len(data) - 1 - data[::-1].index(target) if target in data else -1)
    if algorithm == 'peak-element-search':
        return result == -1 if not data else 0 <= result < len(data) and (result == 0 or data[result] >= data[result-1]) and (result == len(data)-1 or data[result] >= data[result+1])
    if algorithm in ['linear-search', 'recursive-linear-search', 'sentinel-linear-search', 'first-occurrence', 'sliding-window-two-pointers-suite']:
        return result == (data.index(target) if target in data else -1)
    return result == -1 if target not in data else 0 <= result < len(data) and data[result] == target

for index, (algorithm, languages) in enumerate(sources.items()):
    text = '\n'.join(row['text'] for row in languages['Python'])
    context = {}
    exec(compile(text, algorithm, 'exec'), context)
    name = next(key for key, value in context.items() if callable(value))
    cases = [[], [3], [2,1], [3,1,3,2,0], [0,0,0], [-5,-2,-5,3,0], [1.5,-2.25,0,1.5], [9,8,7,6,5,4,3,2,1]]
    if algorithm == 'counting-sort': cases = [a for a in cases if all(float(v).is_integer() for v in a)]
    if algorithm == 'radix-sort': cases = [a for a in cases if all(float(v).is_integer() and v >= 0 for v in a)]
    if not (algorithm.endswith('-sort') or algorithm in ['divide-and-conquer-suite','advanced-sorting-suite']): cases = [sorted(a) for a in cases]
    class_name = f'Algorithm{index}'
    java = '\n'.join(row['text'] for row in languages['Java']).replace('class Algorithm {', f'class {class_name} {{')
    (directory / f'{class_name}.java').write_text(java,encoding='utf-8')
    for original in cases:
        for target in [3, 100]:
            data = original.copy()
            result = context[name](data, target)
            assert expected(algorithm, original, target, result), (algorithm, original, target, result)
            python_count += 1
            values = ', '.join(f'{float(v)}' for v in original)
            init = f'new ArrayList<Double>(Arrays.asList({values}))' if values else 'new ArrayList<Double>()'
            java_calls.append(f'System.out.println({class_name}.{name}({init}, {target}.0));')
            expected_java.append((algorithm, original, target))

(directory/'Check.java').write_text('import java.util.*; class Check { public static void main(String[] args) {\n'+'\n'.join(java_calls)+'\n}}',encoding='utf-8')
files = [str(p) for p in directory.glob('*.java')]
compiled = subprocess.run(['javac','-encoding','UTF-8',*files],capture_output=True,text=True)
if compiled.returncode:
    print(compiled.stderr)
    raise SystemExit(1)
executed = subprocess.run(['java','-cp',str(directory),'Check'],capture_output=True,text=True,check=True)
for line, (algorithm, data, target) in zip(executed.stdout.splitlines(), expected_java, strict=True):
    value = json.loads(line)
    assert expected(algorithm, data, target, value), (algorithm,data,target,value)
print(f'PASS: {python_count} Python executions and {len(expected_java)} Java executions across {len(sources)} studios.')
