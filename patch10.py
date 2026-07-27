import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_block(type_str, new_lenses):
    global content
    pattern = r"(} else if \(type === '" + type_str + r"'\) \{.*?lenses = \[).*?(\];)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        old_full = match.group(0)
        new_full = match.group(1) + "\n" + new_lenses + "\n            " + match.group(2)
        content = content.replace(old_full, new_full)

# Newton
replace_block('newton', '''                {r1: cD * 3.0, r2: -cD * 3.0, t: cD * 0.15, d: 0, glass: "N-BK7"},
                {r1: -cD * 1.6, r2: cD * 1.6, t: cD * 0.05, d: cD * 0.1, glass: "N-F2"},
                {r1: cD * 4.0, r2: -cD * 4.0, t: cD * 0.12, d: cD * 0.15, glass: "N-BK7"}''')

# DK
replace_block('dk', '''                {r1: cD * 2.5, r2: Infinity, t: cD * 0.12, d: 0, glass: "N-BK7"},
                {r1: -cD * 2.0, r2: cD * 3.0, t: cD * 0.05, d: cD * 0.15, glass: "Silice Fondue"}''')

# RC
replace_block('rc', '''                {r1: cD * 3.0, r2: Infinity, t: cD * 0.12, d: 0, glass: "Silice Fondue"},
                {r1: Infinity, r2: cD * 2.4, t: cD * 0.12, d: cD * 0.15, glass: "Silice Fondue"}''')

# Cassegrain
replace_block('cassegrain', '''                {r1: Infinity, r2: cD * 2.4, t: cD * 0.12, d: 0, glass: "N-BK7"}''')

# Nasmyth
replace_block('nasmyth', '''                {r1: Infinity, r2: cD * 2.4, t: cD * 0.12, d: 0, glass: "N-BK7"}''')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 10 done.")
