const fs = require('fs');
const path = require('path');

const files = [
  'app/sales/page.js',
  'app/stock-manager/page.js',
  'app/dashboard/page.js',
  'app/reports/page.js',
  'app/debt/page.js'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Add import
  if (!content.includes('getShopContext')) {
    content = content.replace(
      /import\s+\{\s*createClient\s*\}\s+from\s+["']@\/utils\/supabase\/client["'];?/,
      `import { createClient } from "@/utils/supabase/client";\nimport { getShopContext } from "@/utils/supabase/getShopContext";`
    );
    changed = true;
  }

  // 2. Replace simple setUserId(user.id) block (Sales, Dashboard, Debt)
  const regexUserId = /if\s*\(\s*user\s*\)\s*\{\s*setUserId\(\s*user\.id\s*\)\s*;/g;
  if (regexUserId.test(content)) {
    content = content.replace(regexUserId, `if (user) {\n        const { queryId } = await getShopContext(user.id);\n        setUserId(queryId);`);
    changed = true;
  }

  // 3. Replace stock-manager/page.js block (setUser(currentUser);)
  const stockManagerRegex = /setUser\(currentUser\);\s+setUserDisplayName\(/g;
  if (file.includes('stock-manager') && stockManagerRegex.test(content)) {
    content = content.replace(
      stockManagerRegex,
      `setUser(currentUser);\n      const { queryId } = await getShopContext(currentUser.id);\n      currentUser.queryId = queryId;\n      setUserDisplayName(`
    );
    // change the categories fetch parameter
    content = content.replace(/fetchCategories\(currentUser\.id\)/g, 'fetchCategories(currentUser.queryId)');
    changed = true;
  }

  // 4. Replace reports/page.js block if it uses setUserId
  // reports uses setUserId similarly

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Successfully patched ${file}`);
  }
});
