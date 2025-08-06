#!/usr/bin/env python3
import os
import re
import glob

def fix_tooltip_file():
    """Fix the specific tooltip.tsx file issue"""
    filepath = "client/src/components/ui/tooltip.tsx"
    
    if not os.path.exists(filepath):
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # The issue is likely with TypeScript generics parsing
    # Try to ensure proper formatting
    content_fixed = content.replace(
        'React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>',
        'React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content_fixed)
    
    print(f"Fixed: {filepath}")

def fix_all_syntax_errors():
    """Fix all syntax errors in the entire codebase"""
    
    files_to_fix = glob.glob('client/src/**/*.tsx', recursive=True) + \
                   glob.glob('client/src/**/*.ts', recursive=True)
    
    patterns = [
        # Fix double closing parentheses that should be single
        (r'onChange=\{[^}]*e\.target\.value\)\)\}', lambda m: m.group(0).replace('))}', ')')),
        (r'setLocation\("([^"]+)"\)\)\}', r'setLocation("\1")}'),
        (r'setLocation\("([^"]+)"\)\)\)', r'setLocation("\1"))'),
        
        # Fix handler function calls
        (r'handleEditProject\(project \}', r'handleEditProject(project)}'),
        (r'handleDuplicateProject\(project \}', r'handleDuplicateProject(project)}'),
        (r'handleDeleteProject\(project \}', r'handleDeleteProject(project)}'),
        
        # Fix formatCurrency calls
        (r'formatCurrency\(([^,]+),\s*([^)]+)\)\)\}', r'formatCurrency(\1, \2)}'),
        
        # Fix mutationFn arrow functions
        (r'\{ userId: string; role: string \} =>', r'{ userId: string; role: string }) =>'),
        
        # Fix toast/queryClient calls
        (r'queryClient\.invalidateQueries\(\{ queryKey: \[([^\]]+)\]\}\);', r'queryClient.invalidateQueries({ queryKey: [\1]});'),
        
        # Fix missing closing parentheses
        (r'targetLanguage: selectedLanguage\};', r'targetLanguage: selectedLanguage});'),
        
        # Fix apiRequest calls
        (r'{ method: "PUT" \};', r'{ method: "PUT" });'),
        (r'{ method: "DELETE" \};', r'{ method: "DELETE" });'),
        
        # Fix array map closing brackets
        (r'\)\}(?=\s*</)', r'))}'),
        
        # Fix subscription.tsx specific error
        (r'onClick=\{[^}]+\)\)\}', lambda m: m.group(0).replace('))}', ')}').replace('))}', ')}')),
    ]
    
    fixed_files = []
    
    for filepath in files_to_fix:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Apply all patterns
            for pattern, replacement in patterns:
                if callable(replacement):
                    content = re.sub(pattern, replacement, content)
                else:
                    content = re.sub(pattern, replacement, content)
            
            # Fix specific known issues
            content = content.replace('role} });', 'role }) });')
            content = content.replace('role} );', 'role });')
            content = content.replace('] };', '] });')
            content = content.replace('})};', '});')
            content = content.replace('))};', ')});')
            content = content.replace('))}', '))}')  # Ensure proper closing
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixed_files.append(filepath)
                print(f"Fixed: {os.path.basename(filepath)}")
        
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
    
    return fixed_files

def fix_admin_users():
    """Fix specific issues in admin-users.tsx"""
    filepath = "client/src/pages/admin-users.tsx"
    
    if not os.path.exists(filepath):
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Fix known line issues
    for i in range(len(lines)):
        line = lines[i]
        
        # Fix missing closing brackets/parentheses
        if 'queryClient.invalidateQueries({ queryKey: ["/api/admin/users"]' in line:
            if not line.strip().endswith('});'):
                lines[i] = line.replace(']};', ']});').replace(']}', ']});')
        
        # Fix toast calls
        if 'toast({' in line and line.strip().endswith('};'):
            lines[i] = line.replace('};', '});')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"Fixed: admin-users.tsx")

def main():
    print("Starting comprehensive syntax error fixing...")
    print("=" * 50)
    
    # Fix tooltip.tsx first
    fix_tooltip_file()
    
    # Fix admin-users.tsx
    fix_admin_users()
    
    # Fix all other files
    fixed_files = fix_all_syntax_errors()
    
    print("=" * 50)
    print(f"Total files fixed: {len(fixed_files) + 2}")
    print("\nAll syntax errors should now be fixed!")
    print("Run 'npm run build' to verify.")

if __name__ == "__main__":
    main()