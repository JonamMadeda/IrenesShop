const fs = require('fs');
let content = fs.readFileSync('app/stock-manager/page.js', 'utf8');

// Replace buttons
content = content.replace(
  '<button\n            onClick={handleManageCategories}',
  `{role === 'admin' && (\n            <>\n              <button\n            onClick={handleManageCategories}`
);
content = content.replace(
  '<button\r\n            onClick={handleManageCategories}',
  `{role === 'admin' && (\r\n            <>\r\n              <button\r\n            onClick={handleManageCategories}`
);

content = content.replace(
  'Delete All Items\n          </button>\n        </div>',
  `Delete All Items\n          </button>\n            </>\n          )}\n        </div>`
);
content = content.replace(
  'Delete All Items\r\n          </button>\r\n        </div>',
  `Delete All Items\r\n          </button>\r\n            </>\r\n          )}\r\n        </div>`
);

// Pass role to parameter
content = content.replace(
  '        <StocksTable\n          user={user}',
  '        <StocksTable\n          user={user}\n          role={role}'
);
content = content.replace(
  '        <StocksTable\r\n          user={user}',
  '        <StocksTable\r\n          user={user}\r\n          role={role}'
);

fs.writeFileSync('app/stock-manager/page.js', content);
console.log('Stock manager updated successfully');
