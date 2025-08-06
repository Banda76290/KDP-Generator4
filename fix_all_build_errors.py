#!/usr/bin/env python3
import os
import re
import subprocess
import time

def fix_common_patterns(filepath):
    """Fix common syntax error patterns in a file"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern fixes
    replacements = [
        # Fix double closing parentheses that should be single
        (r'setLocation\("([^"]+)"\)\)\}', r'setLocation("\1")}'),
        (r'setLocation\("([^"]+)"\)\)\)', r'setLocation("\1"))'),
        
        # Fix map array patterns
        (r'\)\}(?=\s*</div>)', r'))}'),
        
        # Fix formatCurrency patterns
        (r'formatCurrency\(([^,]+),\s*([^)]+)\)\)\}', r'formatCurrency(\1, \2)}'),
        
        # Fix onClick handlers
        (r'onClick=\{[^}]+\)\)\}', lambda m: m.group(0).replace('))}', ')}').replace('))}', ')}')),
        
        # Fix extra closing brackets in JSX
        (r'(?<![\)])\)\}(?=\s*<)', r')}'),
    ]
    
    for pattern, replacement in replacements:
        if callable(replacement):
            content = re.sub(pattern, replacement, content)
        else:
            content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def run_build_and_get_error():
    """Run build and extract the first error"""
    result = subprocess.run(
        ['npm', 'run', 'build'],
        capture_output=True,
        text=True,
        timeout=30
    )
    
    output = result.stdout + result.stderr
    
    # Parse error output
    error_pattern = r'([^:]+\.tsx?):(\d+):(\d+): ERROR: (.+)'
    match = re.search(error_pattern, output)
    
    if match:
        filepath = match.group(1).strip()
        line_num = int(match.group(2))
        col_num = int(match.group(3))
        error_msg = match.group(4)
        return {
            'filepath': filepath,
            'line': line_num,
            'column': col_num,
            'message': error_msg,
            'full_output': output
        }
    
    # Check if build succeeded
    if 'Build succeeded' in output or '✓ built in' in output:
        return None
    
    return {'error': 'Unknown error', 'full_output': output}

def fix_specific_error(error_info):
    """Fix a specific error based on the error information"""
    
    if not error_info or 'filepath' not in error_info:
        return False
    
    filepath = error_info['filepath']
    line_num = error_info['line']
    error_msg = error_info['message']
    
    # Read the file
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if line_num > len(lines):
        return False
    
    # Get the problematic line (adjust for 0-based indexing)
    line_idx = line_num - 1
    problem_line = lines[line_idx]
    
    # Fix based on error message
    fixed = False
    
    if 'Expected ")" but found "}"' in error_msg:
        # Add missing closing parenthesis
        lines[line_idx] = problem_line.replace('}', ')}', 1)
        fixed = True
    
    elif 'Expected "}" but found ")"' in error_msg:
        # Fix extra closing parenthesis
        lines[line_idx] = problem_line.replace(')}', '}', 1)
        fixed = True
    
    elif 'Expected ")" but found ";"' in error_msg:
        # Fix missing closing parenthesis before semicolon
        lines[line_idx] = problem_line.replace('};', '});', 1)
        fixed = True
    
    if fixed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True
    
    return False

def main():
    """Main loop to fix all build errors"""
    
    max_attempts = 50
    attempt = 0
    errors_fixed = []
    
    print("Starting automated build error fixing...")
    
    while attempt < max_attempts:
        attempt += 1
        print(f"\nAttempt {attempt}...")
        
        # Run build and get error
        error_info = run_build_and_get_error()
        
        if error_info is None:
            print("✅ Build successful! All errors fixed.")
            break
        
        if 'filepath' not in error_info:
            print(f"⚠️  Could not parse error: {error_info.get('error', 'Unknown')}")
            # Try common pattern fixes on all files
            files_to_check = [
                'client/src/pages/projects.tsx',
                'client/src/pages/analytics.tsx',
                'client/src/pages/books.tsx',
                'client/src/pages/kdp-reports.tsx',
                'client/src/pages/dashboard.tsx'
            ]
            
            for filepath in files_to_check:
                if os.path.exists(filepath):
                    if fix_common_patterns(filepath):
                        print(f"  Fixed common patterns in {filepath}")
            continue
        
        print(f"  Error in {error_info['filepath']}:{error_info['line']}:{error_info['column']}")
        print(f"  Message: {error_info['message']}")
        
        # Try to fix the specific error
        if fix_specific_error(error_info):
            print(f"  ✓ Fixed error in {error_info['filepath']}")
            errors_fixed.append(error_info)
        else:
            # Try common pattern fixes
            if fix_common_patterns(error_info['filepath']):
                print(f"  ✓ Applied pattern fixes to {error_info['filepath']}")
            else:
                print(f"  ⚠️  Could not automatically fix this error")
                # Skip to avoid infinite loop
                break
        
        # Small delay to avoid overwhelming the system
        time.sleep(0.5)
    
    print(f"\n{'='*50}")
    print(f"Fixed {len(errors_fixed)} errors in {attempt} attempts")
    
    if errors_fixed:
        print("\nErrors that were fixed:")
        for error in errors_fixed[:10]:  # Show first 10
            print(f"  - {error['filepath']}:{error['line']} - {error['message']}")

if __name__ == "__main__":
    main()