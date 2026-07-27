import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Newton lenses
newton_old = '''            lenses = [
                {r1: F1 * 0.15, r2: -F1 * 0.15, t: cD * 0.25, d: 0, glass: "N-BK7"},
                {r1: -F1 * 0.05, r2: F1 * 0.05, t: cD * 0.15, d: cD * 0.2, glass: "N-F2"},
                {r1: F1 * 0.2, r2: -F1 * 0.2, t: cD * 0.2, d: cD * 0.3, glass: "N-BK7"}
            ];'''
newton_new = '''            lenses = [
                {r1: cD * 3.0, r2: -cD * 3.0, t: cD * 0.3, d: 0, glass: "N-BK7"},
                {r1: -cD * 1.6, r2: cD * 1.6, t: cD * 0.1, d: cD * 0.2, glass: "N-F2"},
                {r1: cD * 4.0, r2: -cD * 4.0, t: cD * 0.24, d: cD * 0.3, glass: "N-BK7"}
            ];'''
content = content.replace(newton_old, newton_new)

# Replace Cassegrain lenses
cas_old = '''            lenses = [
                {r1: Infinity, r2: F_sys * 0.05, t: cD * 0.25, d: 0, glass: "N-BK7"}
            ];'''
cas_new = '''            lenses = [
                {r1: Infinity, r2: cD * 2.4, t: cD * 0.25, d: 0, glass: "N-BK7"}
            ];'''
content = content.replace(cas_old, cas_new)

# Replace DK lenses
dk_old = '''            lenses = [
                {r1: F_sys * 0.05, r2: Infinity, t: cD * 0.2, d: 0, glass: "N-BK7"},
                {r1: -F_sys * 0.04, r2: F_sys * 0.08, t: cD * 0.1, d: cD * 0.25, glass: "Silice Fondue"}
            ];'''
dk_new = '''            lenses = [
                {r1: cD * 2.5, r2: Infinity, t: cD * 0.25, d: 0, glass: "N-BK7"},
                {r1: -cD * 2.0, r2: cD * 3.0, t: cD * 0.15, d: cD * 0.3, glass: "Silice Fondue"}
            ];'''
content = content.replace(dk_old, dk_new)

# Replace RC lenses
rc_old = '''            lenses = [
                {r1: Infinity, r2: F_sys * 0.08, t: cD * 0.2, d: cD * 0.3, glass: "Silice Fondue"}
            ];'''
rc_new = '''            lenses = [
                {r1: Infinity, r2: cD * 2.4, t: cD * 0.25, d: cD * 0.3, glass: "Silice Fondue"}
            ];'''
content = content.replace(rc_old, rc_new)

# Replace Nasmyth lenses
nas_old = '''            lenses = [
                {r1: Infinity, r2: F_sys * 0.06, t: cD * 0.25, d: 0, glass: "N-BK7"}
            ];'''
nas_new = '''            lenses = [
                {r1: Infinity, r2: cD * 2.4, t: cD * 0.25, d: 0, glass: "N-BK7"}
            ];'''
content = content.replace(nas_old, nas_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 8 done.")
