import os

# Folders to include
TARGET_DIRS = ['app', 'components', 'constants', 'services']
# Extensions to include
TARGET_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.json']
# Files to ignore
IGNORE_FILES = ['package-lock.json', 'tsconfig.json']

def print_tree(startpath):
    print("--- FOLDER STRUCTURE ---")
    for root, dirs, files in os.walk(startpath):
        # Filter directories
        dirs[:] = [d for d in dirs if d in TARGET_DIRS or root != startpath]
        if root == startpath: continue 
        
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        print('{}{}/'.format(indent, os.path.basename(root)))
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if any(f.endswith(ext) for ext in TARGET_EXTS):
                print('{}{}'.format(subindent, f))
    print("\n" + "="*40 + "\n")

def print_files(startpath):
    print("--- FILE CONTENTS ---")
    for root, dirs, files in os.walk(startpath):
        # Only traverse target directories from root
        if root == startpath:
            dirs[:] = [d for d in dirs if d in TARGET_DIRS]
            continue

        for f in files:
            if any(f.endswith(ext) for ext in TARGET_EXTS) and f not in IGNORE_FILES:
                filepath = os.path.join(root, f)
                display_path = os.path.relpath(filepath, startpath)
                print(f"\n// --- START OF FILE: {display_path} ---")
                try:
                    with open(filepath, 'r', encoding='utf-8') as content_file:
                        print(content_file.read())
                except Exception as e:
                    print(f"// Error reading file: {e}")
                print(f"// --- END OF FILE: {display_path} ---\n")

if __name__ == "__main__":
    current_dir = os.getcwd()
    print_tree(current_dir)
    print_files(current_dir)