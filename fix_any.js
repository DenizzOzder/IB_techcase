const fs = require('fs');
const path = require('path');
const dir = '/Users/yhwach/Desktop/IB_techcase/apps/web/composables';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.ts')) {
    const full = path.join(dir, file);
    let content = fs.readFileSync(full, 'utf8');
    content = content.replace(/catch\s*\(\s*e\s*:\s*any\s*\)\s*\{/g, "catch (err) {\n      const e = err as { data?: { message?: string }; message?: string };");
    fs.writeFileSync(full, content);
  }
});
