const fs = require('fs');
let content = fs.readFileSync('app/stock-manager/_components/StocksTable.jsx', 'utf8');

content = content.replace(
  'const StocksTable = ({ user, categories }) => {',
  'const StocksTable = ({ user, categories, role }) => {'
)

content = content.replace(
  '<button\n                          onClick={() => onDelete(item)}',
  `{role === 'admin' && (<button\n                          onClick={() => onDelete(item)}`
);
content = content.replace(
  '<button\r\n                          onClick={() => onDelete(item)}',
  `{role === 'admin' && (<button\r\n                          onClick={() => onDelete(item)}`
);

content = content.replace(
  'Delete\n                        </button>\n                      </div>',
  `Delete\n                        </button>)}\n                      </div>`
);
content = content.replace(
  'Delete\r\n                        </button>\r\n                      </div>',
  `Delete\r\n                        </button>)}\r\n                      </div>`
);

fs.writeFileSync('app/stock-manager/_components/StocksTable.jsx', content);
console.log('Fixed stocks table');
