const fs = require('fs');

const filesToPatch = [
  'app/sales/page.js',
  'app/stock-manager/page.js',
  'app/dashboard/page.js',
  'app/reports/page.js',
  'app/debt/page.js'
];

filesToPatch.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');

  // Add the getShopContext import if not present
  if (!content.includes('getShopContext')) {
    content = content.replace(
      'import { createClient } from "@/utils/supabase/client";',
      'import { createClient } from "@/utils/supabase/client";\nimport { getShopContext } from "@/utils/supabase/getShopContext";'
    );
  }

  // Common pattern 1: app/sales/page.js & dashboard
  if (content.includes('setUser(user.id);') || content.includes('setUserId(user.id);')) {
    content = content.replace(
      '      if (user) {\n        setUserId(user.id);\n      }',
      '      if (user) {\n        const { queryId } = await getShopContext(user.id);\n        setUserId(queryId);\n      }'
    );
    content = content.replace(
      '      if (user) {\r\n        setUserId(user.id);\r\n      }',
      '      if (user) {\r\n        const { queryId } = await getShopContext(user.id);\r\n        setUserId(queryId);\r\n      }'
    );
  }

  // Common pattern 2: stock-manager/page.js
  if (content.includes('setUser(currentUser);')) {
    content = content.replace(
      '      setUser(currentUser);',
      '      setUser(currentUser);\n      const { queryId } = await getShopContext(currentUser.id);\n      currentUser.queryId = queryId;'
    );
    // if stock manager uses currentUser.id, replace it with currentUser.queryId
    content = content.replace(
      '.eq(\'id\', currentUser.id)',
      '.eq(\'id\', currentUser.id)' // Don't change role fetch
    );
    content = content.replace(
      'await fetchCategories(currentUser.id);',
      'await fetchCategories(currentUser.queryId);'
    );
    // Also stock-manager sets user into StocksTable. StocksTable uses user.id!
    // We should patch StocksTable down the line or just pass queryId down.
  }

  fs.writeFileSync(file, content);
  console.log(`Patched ${file}`);
});
