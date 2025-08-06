#!/usr/bin/env python3
import subprocess
import re
import os

def get_build_error():
    """Run build and get the first error"""
    result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True, timeout=30)
    output = result.stdout + result.stderr
    
    # Parse error
    match = re.search(r'(/[^:]+\.tsx?):(\d+):(\d+): ERROR: (.+)', output)
    if match:
        return {
            'file': match.group(1),
            'line': int(match.group(2)),
            'col': int(match.group(3)),
            'msg': match.group(4)
        }
    
    if 'built in' in output or 'Build succeeded' in output:
        return None
    
    return {'error': 'Unknown', 'output': output[:500]}

def fix_error(error):
    """Fix a specific error"""
    if not error or 'file' not in error:
        return False
    
    filepath = error['file']
    line_num = error['line'] - 1  # 0-based
    msg = error['msg']
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    if line_num >= len(lines):
        return False
    
    line = lines[line_num]
    fixed = False
    
    # Fix based on error message
    if 'Expected ";" but found ")"' in msg:
        # This means we have }); but should have };
        lines[line_num] = line.replace('});', '};')
        fixed = True
    elif 'Expected ")" but found "}"' in msg:
        # Missing closing parenthesis
        lines[line_num] = line.replace('}', ')}', 1)
        fixed = True
    elif 'Expected "}" but found ")"' in msg:
        # Extra closing parenthesis
        lines[line_num] = line.replace(')}', '}', 1)
        fixed = True
    elif 'Expected ")" but found ";"' in msg:
        # Missing closing parenthesis before semicolon
        lines[line_num] = line.replace('};', '});', 1)
        fixed = True
    
    if fixed:
        with open(filepath, 'w') as f:
            f.writelines(lines)
        print(f"Fixed: {filepath}:{error['line']} - {msg}")
        return True
    
    return False

def main():
    print("Starting targeted error fixing...")
    max_attempts = 30
    attempt = 0
    
    while attempt < max_attempts:
        attempt += 1
        print(f"\nAttempt {attempt}...")
        
        error = get_build_error()
        
        if error is None:
            print("✅ Build successful!")
            return True
        
        if 'file' not in error:
            print(f"Could not parse error: {error.get('error', 'Unknown')}")
            return False
        
        print(f"Error in {error['file']}:{error['line']} - {error['msg']}")
        
        if not fix_error(error):
            print("Could not fix this error automatically")
            return False
    
    print("Max attempts reached")
    return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 All errors fixed! Build successful!")
    else:
        print("\n❌ Could not fix all errors")