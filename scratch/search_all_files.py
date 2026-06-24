import os

target_dir = '/home/pranii/.gemini/antigravity'
search_terms = ['senthil', 'cn-002', '37,800', '37800']

for root, dirs, files in os.walk(target_dir):
    for file in files:
        full_path = os.path.join(root, file)
        try:
            with open(full_path, 'rb') as f:
                content = f.read()
                for term in search_terms:
                    term_bytes = term.encode('utf-8')
                    if term_bytes in content.lower():
                        print(f"Found '{term}' in file: {full_path}")
                        idx = content.lower().index(term_bytes)
                        start = max(0, idx - 200)
                        end = min(len(content), idx + 1000)
                        snippet = content[start:end]
                        print("Snippet:", snippet.decode('utf-8', errors='replace'))
                        print("=" * 60)
        except Exception as e:
            pass
