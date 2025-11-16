import fs from 'fs';
import path from 'path';

// 检查文件是否存在
const files = [
  'src/App.tsx',
  'src/app/AppRoutes.tsx',
  'src/shared/nav.tsx',
  'src/pages/organizations/index.tsx',
  'src/pages/properties/index.tsx',
  'src/pages/units/index.tsx',
  'src/pages/tenants/index.tsx',
  'src/pages/leases/index.tsx',
  'src/pages/payments/index.tsx',
];

console.log('=== 文件存在检查 ===');
files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✓' : '✗'} ${file}`);
});

console.log('\n=== App.tsx 资源检查 ===');
const appContent = fs.readFileSync('src/App.tsx', 'utf8');
const resources = ['organizations', 'properties', 'units', 'tenants', 'leases', 'payments'];
resources.forEach(res => {
  const found = appContent.includes(`{ name: "${res}"`);
  console.log(`${found ? '✓' : '✗'} ${res} 资源已注册`);
});

console.log('\n=== AppRoutes.tsx 路由检查 ===');
const routesContent = fs.readFileSync('src/app/AppRoutes.tsx', 'utf8');
resources.forEach(res => {
  const found = routesContent.includes(`path="${res}"`);
  console.log(`${found ? '✓' : '✗'} /${res} 路由已配置`);
});

console.log('\n=== nav.tsx 菜单检查 ===');
const navContent = fs.readFileSync('src/shared/nav.tsx', 'utf8');
resources.forEach(res => {
  const keyMatch = navContent.includes(`key: '${res}'`);
  const disabledMatch = navContent.match(new RegExp(`key: '${res}'[^}]*disabled: false`));
  console.log(`${keyMatch && disabledMatch ? '✓' : '✗'} ${res} 菜单项已启用`);
});

console.log('\n=== 所有检查完成 ===');
