#!/usr/bin/env python3
import os
import re
import glob

def fix_file(filepath):
    """Fix common syntax errors in TypeScript/React files"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix patterns based on observed errors
    patterns = [
        # Fix mismatched brackets in mutationFn
        (r'(\{ userId: string; role: string \}) => \{', r'\1) => {'),
        
        # Fix missing closing parentheses in function calls
        (r'queryKey: \[([^\]]+)\]\}(?!\))', r'queryKey: [\1]})'),
        
        # Fix missing closing parentheses in apiRequest calls
        (r'body: JSON\.stringify\(\{ ([^}]+)\} \)\);', r'body: JSON.stringify({ \1 }) });'),
        
        # Fix missing closing parentheses in mutate calls  
        (r'\.mutate\(\{ ([^}]+)\};', r'.mutate({ \1});'),
        
        # Fix double closing brackets
        (r'\)\)\}(?!\))', r'))}'),
        
        # Fix missing closing parentheses in return statements
        (r'return await apiRequest\([^;]+\};', lambda m: m.group(0).replace('};', '});')),
        
        # Fix toast calls with missing closing parentheses
        (r'toast\(\{[^}]+\};(?!\))', lambda m: m.group(0).replace('};', '});')),
        
        # Fix incorrect closing brackets
        (r'\{ method: "PUT" \};', r'{ method: "PUT" });'),
        (r'\{ method: "DELETE" \};', r'{ method: "DELETE" });'),
    ]
    
    for pattern, replacement in patterns:
        if callable(replacement):
            content = re.sub(pattern, replacement, content)
        else:
            content = re.sub(pattern, replacement, content)
    
    # Fix specific known issues
    content = content.replace('role} });', 'role }) });')
    content = content.replace('role} );', 'role });')
    content = content.replace('] };', '] });')
    content = content.replace('variant: "destructive"\n      });', 'variant: "destructive"\n      });')
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Fix all TypeScript/React files in the client directory"""
    
    files_to_check = []
    
    # Get all TypeScript/React files
    for pattern in ['client/src/**/*.tsx', 'client/src/**/*.ts']:
        files_to_check.extend(glob.glob(pattern, recursive=True))
    
    files_fixed = []
    
    for filepath in files_to_check:
        if fix_file(filepath):
            files_fixed.append(filepath)
            print(f"Fixed: {filepath}")
    
    print(f"\nTotal files fixed: {len(files_fixed)}")
    
    if files_fixed:
        print("\nFiles that were modified:")
        for f in files_fixed:
            print(f"  - {f}")

if __name__ == "__main__":
    main()