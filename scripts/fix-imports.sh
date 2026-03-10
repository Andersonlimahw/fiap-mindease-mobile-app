
#!/bin/bash

echo "Fixing '@app' imports across the project..."

# List of file patterns to fix
FILES=$(find src -name "*.ts" -o -name "*.tsx" | grep -v node_modules)

for file in $FILES; do
  echo "Processing $file"
  
  # Replace @app imports with relative paths
  sed -i '' 's|from '\''@app/core/|from '\''../core/|g' "$file"
  sed -i '' 's|from '\''@app/infrastructure/|from '\''../infrastructure/|g' "$file"
  sed -i '' 's|from '\''@app/presentation/|from '\''../presentation/|g' "$file"
  sed -i '' 's|from '\''@app/data/|from '\''../data/|g' "$file"
  sed -i '' 's|from '\''@app/domain/|from '\''../domain/|g' "$file"
  sed -i '' 's|from '\''@app/types/|from '\''../types/|g' "$file"
  sed -i '' 's|from '\''@app/config/|from '\''../config/|g' "$file"
  sed -i '' 's|from '\''@app/utils/|from '\''../utils/|g' "$file"
  sed -i '' 's|from '\''@app/store/|from '\''../store/|g' "$file"
  
  # Fix specific edge cases
  sed -i '' 's|from '\''@app/presentation/components/|from '\''../../presentation/components/|g' "$file"
  sed -i '' 's|from '\''@app/presentation/theme/|from '\''../../presentation/theme/|g' "$file"
  sed -i '' 's|from '\''@app/presentation/i18n/|from '\''../../presentation/i18n/|g' "$file"
  sed -i '' 's|from '\''@app/presentation/hooks/|from '\''../../presentation/hooks/|g' "$file"
  
done

echo "Import fixes completed!"
