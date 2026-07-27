import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# I will just regex replace any {r1: F1 * ..., {r1: -F1 * ..., etc., with the correct cD values.
# Actually, let's just find the entire blocks and replace them.

def replace_block(type_str, new_lenses):
    global content
    pattern = r"(} else if \(type === '" + type_str + r"'\) \{.*?lenses = \[).*?(\];)"
    # We find everything between `lenses = [` and `];`
    match = re.search(pattern, content, re.DOTALL)
    if match:
        old_full = match.group(0)
        new_full = match.group(1) + "\n" + new_lenses + "\n            " + match.group(2)
        content = content.replace(old_full, new_full)
    else:
        print(f"Could not find lenses block for {type_str}")

replace_block('newton', '''                {r1: cD * 3.0, r2: -cD * 3.0, t: cD * 0.3, d: 0, glass: "N-BK7"},
                {r1: -cD * 1.6, r2: cD * 1.6, t: cD * 0.1, d: cD * 0.2, glass: "N-F2"},
                {r1: cD * 4.0, r2: -cD * 4.0, t: cD * 0.24, d: cD * 0.3, glass: "N-BK7"}''')

replace_block('dk', '''                {r1: cD * 2.5, r2: Infinity, t: cD * 0.25, d: 0, glass: "N-BK7"},
                {r1: -cD * 2.0, r2: cD * 3.0, t: cD * 0.15, d: cD * 0.3, glass: "Silice Fondue"}''')

replace_block('rc', '''                {r1: cD * 3.0, r2: Infinity, t: cD * 0.25, d: 0, glass: "Silice Fondue"},
                {r1: Infinity, r2: cD * 2.4, t: cD * 0.25, d: cD * 0.3, glass: "Silice Fondue"}''')

replace_block('cassegrain', '''                {r1: Infinity, r2: cD * 2.4, t: cD * 0.25, d: 0, glass: "N-BK7"}''')

replace_block('nasmyth', '''                {r1: Infinity, r2: cD * 2.4, t: cD * 0.25, d: 0, glass: "N-BK7"}''')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 9 done.")
