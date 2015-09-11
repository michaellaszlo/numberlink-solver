import os

puzzle_dir = '.'

out_lines = []
out_lines.append('var puzzles = {')

for name in sorted(os.listdir(puzzle_dir)):
    if name[-4:] != '.txt':
        continue
    puzzle_name = name[:-4].lower()
    out_lines.append('  %s: [' % puzzle_name)
    in_lines = open(name).readlines()[1:]
    for ix, line in enumerate(in_lines[:-1]):
      out_lines.append("    '%s'," % (line.strip()))
    out_lines.append("    '%s'" % (line.strip()))
    out_lines.append('  ],')

out_lines.pop()
out_lines.append('  ]')
out_lines.append('};')

print('\n'.join(out_lines))
