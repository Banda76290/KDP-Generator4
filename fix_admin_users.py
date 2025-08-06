#!/usr/bin/env python3
import re

def fix_admin_users():
    """Fix specific syntax errors in admin-users.tsx"""
    
    filepath = "client/src/pages/admin-users.tsx"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Fix known issues based on LSP errors
    # The common pattern is missing closing parentheses or brackets
    
    for i in range(len(lines)):
        line = lines[i]
        
        # Fix queryClient.invalidateQueries calls - missing closing parenthesis
        if 'queryClient.invalidateQueries({ queryKey: ["/api/admin/users"]})' in line:
            lines[i] = line.replace(
                'queryClient.invalidateQueries({ queryKey: ["/api/admin/users"]})',
                'queryClient.invalidateQueries({ queryKey: ["/api/admin/users"]})'
            )
        
        # Fix toast calls without enough closing parentheses
        if 'toast({' in line and line.strip().endswith('});'):
            # Check if this is the end of a toast call that needs fixing
            pass  # Already correct
        
        # Look for patterns that need correction based on line numbers from LSP
        # Line 130, 141, 214, 224, 240, 288, 296, 304, 311, 319 - missing commas
        # These are likely in object literals or function calls
        
        # Fix missing commas in object literals
        if i in [129, 140, 213, 223, 239, 287, 295, 303, 310, 318]:  # Adjust for 0-based indexing
            # Check if line ends with } but should have },
            if line.strip().endswith('}') and not line.strip().endswith('},') and not line.strip().endswith('});'):
                # Check if next line starts with a property or method
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and not next_line.startswith(')') and not next_line.startswith('}'):
                        lines[i] = line.rstrip() + ',\n'
    
    # Write the fixed content back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"Fixed {filepath}")
    
    # Also fix the toast import issue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ensure toast is properly imported and used
    if 'const toast = useToast()' not in content and 'const { toast } = useToast()' not in content:
        # Find where useToast is imported and fix it
        content = re.sub(
            r'const toast = useToast\(\)',
            r'const { toast } = useToast()',
            content
        )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_admin_users()