const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  const match1 = await bcrypt.compare('password', hash);
  const match2 = await bcrypt.compare('admin123', hash);
  console.log('password matches:', match1);
  console.log('admin123 matches:', match2);
}

test();
